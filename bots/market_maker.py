from __future__ import annotations

import asyncio
import json
import os
from typing import Any

import requests
import websockets

from strategy_telemetry import StrategyTelemetryClient


API_URL = os.getenv("API_URL", "http://localhost:8000")
WS_URL = os.getenv("WS_URL", "ws://localhost:8000/ws/market")
USER_ID = os.getenv("MARKET_MAKER_USER_ID", "market-maker")
ORDER_QTY = int(os.getenv("MARKET_MAKER_ORDER_QTY", "5"))
STRATEGY_NAME = "Market Maker"
STRATEGY_SLUG = "market-maker"

telemetry = StrategyTelemetryClient(STRATEGY_NAME, STRATEGY_SLUG, USER_ID)


def _post_order(symbol: str, side: str, price: float) -> None:
    payload = {
        "user_id": USER_ID,
        "symbol": symbol,
        "side": side,
        "order_type": "limit",
        "price": round(price, 4),
        "quantity": ORDER_QTY,
    }
    response = requests.post(f"{API_URL}/api/orders", json=payload, timeout=10)
    response.raise_for_status()


async def run() -> None:
    telemetry.init()
    while True:
        try:
            async with websockets.connect(WS_URL, ping_interval=20, ping_timeout=20) as websocket:
                async for message in websocket:
                    payload: dict[str, Any] = json.loads(message)
                    if payload.get("type") != "tick":
                        continue

                    for bar in payload.get("bars", []):
                        timestamp = str(bar.get("timestamp") or payload.get("timestamp") or "")
                        telemetry.run(timestamp)
                        close = float(bar["close"])
                        symbol = str(bar["symbol"])
                        telemetry.signal(
                            price=close,
                            indicators={"spread": 0.1, "order_qty": ORDER_QTY},
                            decision="QUOTE",
                            reason="Posting bid and ask liquidity quotes",
                            timestamp=timestamp,
                            input_data={"price": close, "symbol": symbol},
                        )
                        _post_order(symbol, "buy", close * 0.999)
                        _post_order(symbol, "sell", close * 1.001)

        except Exception as exc:
            telemetry.crash(exc)
            print(f"[market-maker] reconnecting after error: {exc}")
            await asyncio.sleep(2)


if __name__ == "__main__":
    asyncio.run(run())
