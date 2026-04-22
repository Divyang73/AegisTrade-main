from __future__ import annotations

from decimal import Decimal

from fastapi import Depends, FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .db import close_pool, get_pool, init_pool
from .schemas import (
    AlgoStatsResponse,
    HistoricalBar,
    OrderBookLevel,
    OrderBookResponse,
    OrderRequest,
    PortfolioPosition,
    PortfolioResponse,
    TradeFeedEntry,
)
from .simulation import MarketStreamer


app = FastAPI(title="AegisTrade API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _decimal_to_float(value: Decimal | None) -> float:
    return float(value or Decimal("0"))


async def _seed_market_maker() -> None:
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO users (user_id, is_bot)
            VALUES ('market-maker', TRUE)
            ON CONFLICT (user_id) DO UPDATE SET is_bot = EXCLUDED.is_bot
            """
        )
        await conn.execute(
            """
            INSERT INTO wallets AS w (user_id, cash_balance)
            VALUES ('market-maker', $1)
            ON CONFLICT (user_id) DO UPDATE
            SET cash_balance = GREATEST(w.cash_balance, EXCLUDED.cash_balance)
            """,
            settings.bootstrap_market_maker_cash,
        )

        symbols = await conn.fetch("SELECT DISTINCT symbol FROM historical_data ORDER BY symbol")
        for row in symbols:
            await conn.execute(
                """
                INSERT INTO positions AS p (user_id, symbol, quantity)
                VALUES ('market-maker', $1, $2)
                ON CONFLICT (user_id, symbol) DO UPDATE
                SET quantity = GREATEST(p.quantity, EXCLUDED.quantity)
                """,
                row["symbol"],
                settings.bootstrap_market_maker_inventory,
            )


@app.on_event("startup")
async def on_startup() -> None:
    pool = await init_pool()
    await _seed_market_maker()
    app.state.streamer = MarketStreamer(
        pool=pool,
        interval_seconds=settings.simulation_interval_seconds,
    )
    await app.state.streamer.start()


@app.on_event("shutdown")
async def on_shutdown() -> None:
    streamer = getattr(app.state, "streamer", None)
    if streamer is not None:
        await streamer.stop()
    await close_pool()


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/orders")
async def create_order(payload: OrderRequest) -> dict[str, str]:
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            "CALL process_order($1, $2, $3, $4, $5, $6)",
            payload.user_id,
            payload.symbol.upper(),
            payload.side.lower(),
            payload.order_type.lower(),
            payload.price,
            payload.quantity,
        )
    return {"status": "accepted", "message": "order processed"}


@app.get("/api/portfolio/{user_id}", response_model=PortfolioResponse)
async def get_portfolio(user_id: str) -> PortfolioResponse:
    pool = await get_pool()
    async with pool.acquire() as conn:
        wallet = await conn.fetchrow(
            "SELECT cash_balance FROM wallets WHERE user_id = $1",
            user_id,
        )
        if wallet is None:
            raise HTTPException(status_code=404, detail="wallet not found")

        positions = await conn.fetch(
            """
            SELECT p.symbol, p.quantity, COALESCE(h.close, 0) AS last_price
            FROM positions p
            LEFT JOIN LATERAL (
                SELECT close
                FROM historical_data h
                WHERE h.symbol = p.symbol
                ORDER BY h."timestamp" DESC
                LIMIT 1
            ) h ON TRUE
            WHERE p.user_id = $1
            ORDER BY p.symbol ASC
            """,
            user_id,
        )

    position_payload: list[PortfolioPosition] = []
    equity = _decimal_to_float(wallet["cash_balance"])
    for row in positions:
        quantity = int(row["quantity"])
        last_price = _decimal_to_float(row["last_price"])
        market_value = quantity * last_price
        equity += market_value
        position_payload.append(
            PortfolioPosition(
                symbol=row["symbol"],
                quantity=quantity,
                last_price=last_price,
                market_value=market_value,
            )
        )

    return PortfolioResponse(
        user_id=user_id,
        cash_balance=_decimal_to_float(wallet["cash_balance"]),
        equity=equity,
        positions=position_payload,
    )


async def _compute_algo_stats(conn, user_id: str) -> AlgoStatsResponse:
    wallet = await conn.fetchrow(
        "SELECT cash_balance FROM wallets WHERE user_id = $1",
        user_id,
    )
    if wallet is None:
        raise HTTPException(status_code=404, detail=f"{user_id} wallet not found")

    latest_price = await conn.fetchval(
        """
        SELECT close
        FROM historical_data
        ORDER BY "timestamp" DESC
        LIMIT 1
        """
    )
    latest_price_float = _decimal_to_float(latest_price)

    positions = await conn.fetch(
        "SELECT symbol, quantity FROM positions WHERE user_id = $1",
        user_id,
    )
    mark_to_market = sum(int(row["quantity"]) * latest_price_float for row in positions)
    equity = _decimal_to_float(wallet["cash_balance"]) + mark_to_market
    pnl = equity - 100000.0

    total_trades = await conn.fetchval(
        """
        SELECT COUNT(*)
        FROM trades
        WHERE buyer_id = $1 OR seller_id = $1
        """,
        user_id,
    )

    favorable_trades = await conn.fetchval(
        """
        SELECT COUNT(*)
        FROM trades
        WHERE (buyer_id = $1 AND price <= $2)
           OR (seller_id = $1 AND price >= $2)
        """,
        user_id,
        latest_price,
    )
    win_rate = float(favorable_trades or 0) / float(total_trades or 1)

    return AlgoStatsResponse(
        user_id=user_id,
        pnl=pnl,
        win_rate=win_rate,
        total_trades=int(total_trades or 0),
        cash_balance=_decimal_to_float(wallet["cash_balance"]),
        equity=equity,
    )


@app.get("/api/algo-stats")
async def get_algo_stats() -> dict[str, AlgoStatsResponse]:
    pool = await get_pool()
    async with pool.acquire() as conn:
        sma = await _compute_algo_stats(conn, "algo-sma")
        rsi = await _compute_algo_stats(conn, "algo-rsi")
    return {"algo-sma": sma, "algo-rsi": rsi}


@app.get("/api/trades/recent", response_model=list[TradeFeedEntry])
async def recent_trades(limit: int = 25) -> list[TradeFeedEntry]:
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT id, symbol, price, quantity, buyer_id, seller_id, "timestamp"
            FROM trades
            ORDER BY "timestamp" DESC
            LIMIT $1
            """,
            limit,
        )

    return [
        TradeFeedEntry(
            id=str(row["id"]),
            symbol=row["symbol"],
            price=_decimal_to_float(row["price"]),
            quantity=int(row["quantity"]),
            buyer_id=row["buyer_id"],
            seller_id=row["seller_id"],
            timestamp=row["timestamp"].isoformat(),
        )
        for row in rows
    ]


@app.get("/api/orderbook/{symbol}", response_model=OrderBookResponse)
async def orderbook(symbol: str, depth: int = 10) -> OrderBookResponse:
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT side, price, SUM(quantity - filled_quantity) AS quantity
            FROM orders
            WHERE symbol = $1
              AND status IN ('open', 'partial')
              AND order_type = 'limit'
              AND price IS NOT NULL
              AND quantity > filled_quantity
            GROUP BY side, price
            ORDER BY side ASC, price ASC
            """,
            symbol.upper(),
        )

    bids: list[OrderBookLevel] = []
    asks: list[OrderBookLevel] = []
    for row in rows:
        level = OrderBookLevel(price=_decimal_to_float(row["price"]), quantity=int(row["quantity"]))
        if row["side"] == "buy":
            bids.append(level)
        else:
            asks.append(level)

    bids = sorted(bids, key=lambda item: item.price, reverse=True)[:depth]
    asks = sorted(asks, key=lambda item: item.price)[:depth]
    return OrderBookResponse(symbol=symbol.upper(), bids=bids, asks=asks)


@app.get("/api/market/history", response_model=list[HistoricalBar])
async def market_history(symbol: str = "AAPL", limit: int = 120) -> list[HistoricalBar]:
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT "timestamp", symbol, open, high, low, close, volume
            FROM historical_data
            WHERE symbol = $1
            ORDER BY "timestamp" DESC
            LIMIT $2
            """,
            symbol.upper(),
            limit,
        )

    ordered_rows = list(reversed(rows))
    return [
        HistoricalBar(
            timestamp=row["timestamp"].isoformat(),
            symbol=row["symbol"],
            open=_decimal_to_float(row["open"]),
            high=_decimal_to_float(row["high"]),
            low=_decimal_to_float(row["low"]),
            close=_decimal_to_float(row["close"]),
            volume=int(row["volume"]),
        )
        for row in ordered_rows
    ]


@app.websocket("/ws/market")
async def market_socket(websocket: WebSocket) -> None:
    await websocket.accept()
    streamer: MarketStreamer = app.state.streamer
    await streamer.register(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        streamer.unregister(websocket)
    except Exception:
        streamer.unregister(websocket)
