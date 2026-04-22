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
USER_ID = os.getenv("ALGO_USER_ID", "algo-sma")
SYMBOL = os.getenv("ALGO_SYMBOL", "AAPL")
ORDER_QTY = int(os.getenv("ALGO_ORDER_QTY", "10"))


def _sma(values: deque[float], window: int) -> float | None:
    if len(values) < window:
        return None
    recent = list(values)[-window:]
    return sum(recent) / window


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
    closes: deque[float] = deque(maxlen=50)
    previous_fast: float | None = None
    previous_slow: float | None = None

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

                        closes.append(float(bar["close"]))
                        fast = _sma(closes, 10)
                        slow = _sma(closes, 50)
                        if fast is None or slow is None:
                            continue

                        if previous_fast is not None and previous_slow is not None:
                            crossed_up = previous_fast <= previous_slow and fast > slow
                            crossed_down = previous_fast >= previous_slow and fast < slow
                            if crossed_up:
                                _submit_order("buy")
                            elif crossed_down and _has_inventory():
                                _submit_order("sell")

                        previous_fast = fast
                        previous_slow = slow

        except Exception as exc:
            print(f"[algo-sma] reconnecting after error: {exc}")
            await asyncio.sleep(2)


if __name__ == "__main__":
    asyncio.run(run())
