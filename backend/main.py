from __future__ import annotations

import statistics
from collections import defaultdict
from datetime import datetime, timezone
from time import perf_counter
from decimal import Decimal
from math import sqrt

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .db import close_pool, get_pool, init_pool
from .schemas import (
    AlgoStatsResponse,
    HistoricalBar,
    IndicatorPoint,
    IndicatorSeries,
    OrderBookLevel,
    OrderActivityEntry,
    OrderBookResponse,
    OrderRequest,
    EquityPoint,
    PortfolioPosition,
    PortfolioResponse,
    StrategyDetailResponse,
    StrategyMetrics,
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


@app.middleware("http")
async def add_server_time_and_latency(request: Request, call_next):
    start = perf_counter()
    response = await call_next(request)
    elapsed_ms = (perf_counter() - start) * 1000
    response.headers["X-Server-Time"] = datetime.now(timezone.utc).isoformat()
    response.headers["X-Process-Time-MS"] = f"{elapsed_ms:.3f}"
    return response


@app.get("/api/time")
async def server_time() -> dict[str, object]:
    now = datetime.now(timezone.utc)
    return {
        "iso": now.isoformat(),
        "epoch_ms": int(now.timestamp() * 1000),
    }


INITIAL_EQUITY = 100000.0
STRATEGY_REGISTRY: dict[str, dict[str, str | bool]] = {
    "sma-crossover": {"user_id": "algo-sma", "symbol": "AAPL", "live": True},
    "rsi": {"user_id": "algo-rsi", "symbol": "AAPL", "live": True},
    "ema-crossover": {"user_id": "algo-ema", "symbol": "AAPL", "live": True},
    "bollinger-reversion": {"user_id": "algo-bollinger", "symbol": "AAPL", "live": True},
    "macd-trend": {"user_id": "algo-macd", "symbol": "AAPL", "live": True},
    "donchian-breakout": {"user_id": "algo-donchian", "symbol": "AAPL", "live": True},
    "roc-momentum": {"user_id": "algo-roc", "symbol": "AAPL", "live": True},
    "pairs-trading": {"user_id": "algo-pairs", "symbol": "AAPL", "live": False},
}


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


async def _seed_bots() -> None:
    """Initialize all 7 algorithm bots with initial capital."""
    pool = await get_pool()
    bot_user_ids = [
        "algo-sma",
        "algo-rsi",
        "algo-ema",
        "algo-bollinger",
        "algo-macd",
        "algo-donchian",
        "algo-roc",
    ]
    async with pool.acquire() as conn:
        for bot_id in bot_user_ids:
            await conn.execute(
                """
                INSERT INTO users (user_id, is_bot)
                VALUES ($1, TRUE)
                ON CONFLICT (user_id) DO UPDATE SET is_bot = EXCLUDED.is_bot
                """,
                bot_id,
            )
            await conn.execute(
                """
                INSERT INTO wallets AS w (user_id, cash_balance)
                VALUES ($1, $2)
                ON CONFLICT (user_id) DO UPDATE
                SET cash_balance = GREATEST(w.cash_balance, EXCLUDED.cash_balance)
                """,
                bot_id,
                INITIAL_EQUITY,
            )


@app.on_event("startup")
async def on_startup() -> None:
    pool = await init_pool()
    await _seed_market_maker()
    await _seed_bots()
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


def _compute_sma(values: list[float], window: int) -> list[float | None]:
    output: list[float | None] = []
    for index in range(len(values)):
        if index + 1 < window:
            output.append(None)
            continue
        segment = values[index + 1 - window : index + 1]
        output.append(sum(segment) / window)
    return output


def _compute_ema(values: list[float], window: int) -> list[float | None]:
    output: list[float | None] = []
    multiplier = 2 / (window + 1)
    ema_value: float | None = None
    for index, value in enumerate(values):
        if index + 1 < window:
            output.append(None)
            continue
        if ema_value is None:
            seed = values[index + 1 - window : index + 1]
            ema_value = sum(seed) / window
        else:
            ema_value = ((value - ema_value) * multiplier) + ema_value
        output.append(ema_value)
    return output


def _compute_rsi(values: list[float], window: int = 14) -> list[float | None]:
    output: list[float | None] = [None] * len(values)
    if len(values) < window + 1:
        return output

    for index in range(window, len(values)):
        gains = 0.0
        losses = 0.0
        segment = values[index - window : index + 1]
        for pos in range(1, len(segment)):
            delta = segment[pos] - segment[pos - 1]
            if delta > 0:
                gains += delta
            else:
                losses += abs(delta)

        if losses == 0:
            output[index] = 100.0
            continue

        rs = gains / losses
        output[index] = 100.0 - (100.0 / (1.0 + rs))
    return output


def _compute_bollinger(values: list[float], window: int = 20) -> tuple[list[float | None], list[float | None], list[float | None]]:
    middle = _compute_sma(values, window)
    upper: list[float | None] = []
    lower: list[float | None] = []

    for index, value in enumerate(values):
        if index + 1 < window or middle[index] is None:
            upper.append(None)
            lower.append(None)
            continue

        segment = values[index + 1 - window : index + 1]
        std_dev = statistics.pstdev(segment) if len(segment) > 1 else 0.0
        basis = float(middle[index])
        upper.append(basis + (2 * std_dev))
        lower.append(basis - (2 * std_dev))
    return middle, upper, lower


def _compute_macd(values: list[float], fast_window: int = 12, slow_window: int = 26, signal_window: int = 9) -> tuple[list[float | None], list[float | None]]:
    fast = _compute_ema(values, fast_window)
    slow = _compute_ema(values, slow_window)

    macd_line: list[float | None] = []
    signal_line: list[float | None] = []
    signal_ema: float | None = None
    multiplier = 2 / (signal_window + 1)
    seeded = 0

    for index in range(len(values)):
        fast_value = fast[index]
        slow_value = slow[index]
        if fast_value is None or slow_value is None:
            macd_line.append(None)
            signal_line.append(None)
            continue

        macd_value = fast_value - slow_value
        macd_line.append(macd_value)

        seeded += 1
        if signal_ema is None:
            signal_ema = macd_value
        else:
            signal_ema = ((macd_value - signal_ema) * multiplier) + signal_ema

        if seeded < signal_window:
            signal_line.append(None)
        else:
            signal_line.append(signal_ema)

    return macd_line, signal_line


def _compute_donchian(highs: list[float], lows: list[float], window: int = 20) -> tuple[list[float | None], list[float | None]]:
    upper: list[float | None] = []
    lower: list[float | None] = []

    for index in range(len(highs)):
        if index + 1 < window:
            upper.append(None)
            lower.append(None)
            continue

        high_segment = highs[index + 1 - window : index + 1]
        low_segment = lows[index + 1 - window : index + 1]
        upper.append(max(high_segment))
        lower.append(min(low_segment))

    return upper, lower


def _compute_roc(values: list[float], window: int = 12) -> list[float | None]:
    output: list[float | None] = []
    for index, value in enumerate(values):
        if index < window:
            output.append(None)
            continue

        base = values[index - window]
        if base == 0:
            output.append(None)
            continue

        output.append(((value - base) / base) * 100)
    return output


def _series_from_values(name: str, color: str, timestamps: list[str], values: list[float | None]) -> IndicatorSeries:
    points = [
        IndicatorPoint(timestamp=timestamps[index], value=float(value))
        for index, value in enumerate(values)
        if value is not None
    ]
    return IndicatorSeries(name=name, color=color, points=points)


def _build_overlays(slug: str, bars: list[HistoricalBar]) -> list[IndicatorSeries]:
    timestamps = [bar.timestamp for bar in bars]
    closes = [bar.close for bar in bars]
    highs = [bar.high for bar in bars]
    lows = [bar.low for bar in bars]

    if slug == "sma-crossover":
        fast = _compute_sma(closes, 10)
        slow = _compute_sma(closes, 50)
        return [
            _series_from_values("SMA 10", "#7EE787", timestamps, fast),
            _series_from_values("SMA 50", "#63B3FF", timestamps, slow),
        ]

    if slug == "rsi":
        rsi = _compute_rsi(closes, 14)
        upper = [70.0 for _ in closes]
        lower = [30.0 for _ in closes]
        return [
            _series_from_values("RSI 14", "#FBBF24", timestamps, rsi),
            _series_from_values("RSI 70", "#EF4444", timestamps, upper),
            _series_from_values("RSI 30", "#10B981", timestamps, lower),
        ]

    if slug == "ema-crossover":
        fast = _compute_ema(closes, 12)
        slow = _compute_ema(closes, 26)
        return [
            _series_from_values("EMA 12", "#7EE787", timestamps, fast),
            _series_from_values("EMA 26", "#A78BFA", timestamps, slow),
        ]

    if slug == "bollinger-reversion":
        middle, upper, lower = _compute_bollinger(closes, 20)
        return [
            _series_from_values("BB Mid 20", "#63B3FF", timestamps, middle),
            _series_from_values("BB Upper", "#EF4444", timestamps, upper),
            _series_from_values("BB Lower", "#10B981", timestamps, lower),
        ]

    if slug == "macd-trend":
        macd_line, signal_line = _compute_macd(closes, 12, 26, 9)
        baseline = [0.0 for _ in closes]
        return [
            _series_from_values("MACD", "#7EE787", timestamps, macd_line),
            _series_from_values("Signal 9", "#A78BFA", timestamps, signal_line),
            _series_from_values("Zero Line", "#52525B", timestamps, baseline),
        ]

    if slug == "donchian-breakout":
        upper, lower = _compute_donchian(highs, lows, 20)
        return [
            _series_from_values("Donchian Upper 20", "#EF4444", timestamps, upper),
            _series_from_values("Donchian Lower 20", "#10B981", timestamps, lower),
        ]

    if slug == "roc-momentum":
        roc = _compute_roc(closes, 12)
        threshold_up = [0.5 for _ in closes]
        threshold_down = [-0.5 for _ in closes]
        return [
            _series_from_values("ROC 12", "#FBBF24", timestamps, roc),
            _series_from_values("ROC +0.5", "#10B981", timestamps, threshold_up),
            _series_from_values("ROC -0.5", "#EF4444", timestamps, threshold_down),
        ]

    return []


def _compute_drawdown(values: list[float]) -> float:
    if not values:
        return 0.0
    peak = values[0]
    max_drawdown = 0.0
    for value in values:
        peak = max(peak, value)
        if peak <= 0:
            continue
        drawdown = (peak - value) / peak
        max_drawdown = max(max_drawdown, drawdown)
    return max_drawdown


def _compute_sharpe(returns: list[float]) -> float | None:
    if len(returns) < 2:
        return None
    stdev = statistics.pstdev(returns)
    if stdev == 0:
        return None
    mean = statistics.mean(returns)
    return (mean / stdev) * sqrt(252)


async def _fetch_history(conn, symbol: str, limit: int = 180) -> list[HistoricalBar]:
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


async def _compute_strategy_detail(conn, slug: str) -> StrategyDetailResponse:
    config = STRATEGY_REGISTRY.get(slug)
    if config is None:
        raise HTTPException(status_code=404, detail="strategy not found")

    user_id = str(config["user_id"])
    symbol = str(config["symbol"])
    live = bool(config["live"])

    wallet = await conn.fetchrow("SELECT cash_balance FROM wallets WHERE user_id = $1", user_id)
    wallet_cash = _decimal_to_float(wallet["cash_balance"]) if wallet is not None else INITIAL_EQUITY

    positions_rows = await conn.fetch(
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

    current_positions: list[PortfolioPosition] = []
    mark_to_market = 0.0
    for row in positions_rows:
        quantity = int(row["quantity"])
        last_price = _decimal_to_float(row["last_price"])
        market_value = quantity * last_price
        mark_to_market += market_value
        current_positions.append(
            PortfolioPosition(
                symbol=row["symbol"],
                quantity=quantity,
                last_price=last_price,
                market_value=market_value,
            )
        )

    equity = wallet_cash + mark_to_market

    trade_rows = await conn.fetch(
        """
        SELECT id, symbol, price, quantity, buyer_id, seller_id, "timestamp"
        FROM trades
        WHERE buyer_id = $1 OR seller_id = $1
        ORDER BY "timestamp" ASC
        """,
        user_id,
    )

    live_trade_rows = await conn.fetch(
        """
        SELECT id, symbol, price, quantity, buyer_id, seller_id, "timestamp"
        FROM trades
        WHERE buyer_id = $1 OR seller_id = $1
        ORDER BY "timestamp" DESC
        LIMIT 40
        """,
        user_id,
    )

    live_trades = [
        TradeFeedEntry(
            id=str(row["id"]),
            symbol=row["symbol"],
            price=_decimal_to_float(row["price"]),
            quantity=int(row["quantity"]),
            buyer_id=row["buyer_id"],
            seller_id=row["seller_id"],
            timestamp=row["timestamp"].isoformat(),
        )
        for row in live_trade_rows
    ]

    order_rows = await conn.fetch(
        """
        SELECT id, symbol, side, order_type, price, quantity, filled_quantity, status, "timestamp"
        FROM orders
        WHERE user_id = $1
        ORDER BY "timestamp" DESC
        LIMIT 40
        """,
        user_id,
    )

    order_activity = [
        OrderActivityEntry(
            id=str(row["id"]),
            symbol=row["symbol"],
            side=row["side"],
            order_type=row["order_type"],
            price=_decimal_to_float(row["price"]) if row["price"] is not None else None,
            quantity=int(row["quantity"]),
            filled_quantity=int(row["filled_quantity"]),
            status=row["status"],
            timestamp=row["timestamp"].isoformat(),
        )
        for row in order_rows
    ]

    lots: dict[str, list[tuple[int, float]]] = defaultdict(list)
    realized_pnl = 0.0
    winning_closes = 0
    closed_trades = 0
    equity_curve: list[EquityPoint] = []
    running_equity = INITIAL_EQUITY
    total_trade_size = 0

    for row in trade_rows:
        quantity = int(row["quantity"])
        price = _decimal_to_float(row["price"])
        trade_symbol = row["symbol"]
        total_trade_size += quantity

        if row["buyer_id"] == user_id:
            lots[trade_symbol].append((quantity, price))
            continue

        if row["seller_id"] != user_id:
            continue

        remaining = quantity
        trade_realized = 0.0
        symbol_lots = lots[trade_symbol]
        while remaining > 0 and symbol_lots:
            lot_qty, lot_price = symbol_lots[0]
            matched = min(remaining, lot_qty)
            trade_realized += (price - lot_price) * matched
            lot_qty -= matched
            remaining -= matched
            if lot_qty == 0:
                symbol_lots.pop(0)
            else:
                symbol_lots[0] = (lot_qty, lot_price)

        if trade_realized != 0:
            closed_trades += 1
            if trade_realized > 0:
                winning_closes += 1

        realized_pnl += trade_realized
        running_equity = INITIAL_EQUITY + realized_pnl
        equity_curve.append(EquityPoint(timestamp=row["timestamp"].isoformat(), equity=running_equity))

    last_price_by_symbol = {position.symbol: position.last_price for position in current_positions}
    unrealized_pnl = 0.0
    for trade_symbol, symbol_lots in lots.items():
        last_price = last_price_by_symbol.get(trade_symbol, 0.0)
        for lot_qty, lot_price in symbol_lots:
            unrealized_pnl += (last_price - lot_price) * lot_qty

    total_pnl = realized_pnl + unrealized_pnl
    total_trades = len(trade_rows)
    avg_trade_size = float(total_trade_size) / float(total_trades) if total_trades else 0.0
    win_rate = float(winning_closes) / float(closed_trades) if closed_trades else 0.0

    curve_values = [point.equity for point in equity_curve]
    if not curve_values:
        curve_values = [INITIAL_EQUITY, equity]
    else:
        equity_curve.append(
            EquityPoint(
                timestamp=datetime.now(timezone.utc).isoformat(),
                equity=equity,
            )
        )
        curve_values.append(equity)

    returns: list[float] = []
    for idx in range(1, len(curve_values)):
        previous = curve_values[idx - 1]
        current = curve_values[idx]
        if previous != 0:
            returns.append((current - previous) / previous)

    sharpe_ratio = _compute_sharpe(returns)
    drawdown = _compute_drawdown(curve_values)

    market_history = await _fetch_history(conn, symbol, limit=220)
    overlays = _build_overlays(slug, market_history)

    return StrategyDetailResponse(
        slug=slug,
        user_id=user_id,
        symbol=symbol,
        live=live,
        metrics=StrategyMetrics(
            realized_pnl=realized_pnl,
            unrealized_pnl=unrealized_pnl,
            total_pnl=total_pnl,
            win_rate=win_rate,
            sharpe_ratio=sharpe_ratio,
            total_trades=total_trades,
            avg_trade_size=avg_trade_size,
            drawdown=drawdown,
            cash_balance=wallet_cash,
            equity=equity,
        ),
        current_positions=current_positions,
        live_trades=live_trades,
        order_activity=order_activity,
        equity_curve=equity_curve,
        market_history=market_history,
        overlays=overlays,
    )


@app.get("/api/algo-stats")
async def get_algo_stats() -> dict[str, AlgoStatsResponse]:
    pool = await get_pool()
    async with pool.acquire() as conn:
        output: dict[str, AlgoStatsResponse] = {}
        for slug, config in STRATEGY_REGISTRY.items():
            if not bool(config["live"]):
                continue
            user_id = str(config["user_id"])
            try:
                output[user_id] = await _compute_algo_stats(conn, user_id)
            except HTTPException:
                continue
    return output


@app.get("/api/algorithms")
async def list_algorithms() -> list[dict[str, str | bool]]:
    return [
        {
            "slug": slug,
            "user_id": str(config["user_id"]),
            "symbol": str(config["symbol"]),
            "live": bool(config["live"]),
        }
        for slug, config in STRATEGY_REGISTRY.items()
    ]


@app.get("/api/algorithms/{slug}", response_model=StrategyDetailResponse)
async def get_algorithm_detail(slug: str) -> StrategyDetailResponse:
    pool = await get_pool()
    async with pool.acquire() as conn:
        return await _compute_strategy_detail(conn, slug)


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
        return await _fetch_history(conn, symbol, limit)


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
