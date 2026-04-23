from __future__ import annotations

import asyncio
import json
import os
from collections import deque
from typing import Any

import requests
import websockets


API_URL = os.getenv("API_URL", "http://localhost:8000")
WS_URL = os.getenv("WS_URL", "ws://localhost:8000/ws/market")
USER_ID = os.getenv("ALGO_DONCHIAN_USER_ID", "algo-donchian")
SYMBOL = os.getenv("ALGO_DONCHIAN_SYMBOL", "AAPL")
ORDER_QTY = int(os.getenv("ALGO_DONCHIAN_ORDER_QTY", "10"))
WINDOW = int(os.getenv("ALGO_DONCHIAN_WINDOW", "20"))


def _submit_order(side: str) -> None:
    payload = {
        "user_id": USER_ID,
        "symbol": SYMBOL,
        "side": side,
        "order_type": "market",
        "price": None,
        "quantity": ORDER_QTY,
    }
    response = requests.post(f"{API_URL}/api/orders", json=payload, timeout=10)
    response.raise_for_status()


def _has_inventory() -> bool:
    response = requests.get(f"{API_URL}/api/portfolio/{USER_ID}", timeout=10)
    response.raise_for_status()
    payload = response.json()
    for position in payload.get("positions", []):
        if position.get("symbol") == SYMBOL and int(position.get("quantity", 0)) >= ORDER_QTY:
            return True
    return False


async def run() -> None:
    highs: deque[float] = deque(maxlen=WINDOW + 1)
    lows: deque[float] = deque(maxlen=WINDOW + 1)
    previous_close: float | None = None

    while True:
        try:
            async with websockets.connect(WS_URL, ping_interval=20, ping_timeout=20) as websocket:
                async for message in websocket:
                    payload: dict[str, Any] = json.loads(message)
                    if payload.get("type") != "tick":
                        continue

                    for bar in payload.get("bars", []):
                        if bar.get("symbol") != SYMBOL:
                            continue

                        close = float(bar["close"])
                        highs.append(float(bar["high"]))
                        lows.append(float(bar["low"]))

                        if len(highs) < WINDOW + 1 or previous_close is None:
                            previous_close = close
                            continue

                        upper = max(list(highs)[:-1])
                        lower = min(list(lows)[:-1])

                        crossed_up = previous_close <= upper and close > upper
                        crossed_down = previous_close >= lower and close < lower

                        if crossed_up:
                            _submit_order("buy")
                        elif crossed_down and _has_inventory():
                            _submit_order("sell")

                        previous_close = close

        except Exception as exc:
            print(f"[algo-donchian] reconnecting after error: {exc}")
            await asyncio.sleep(2)


if __name__ == "__main__":
    asyncio.run(run())
