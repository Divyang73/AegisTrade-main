from __future__ import annotations

import asyncio
import json
import os
from typing import Any
from urllib import request as urllib_request

import websockets  # pyright: ignore[reportMissingImports]


API_URL = os.getenv("API_URL", "http://localhost:8000")
WS_URL = os.getenv("WS_URL", "ws://localhost:8000/ws/market")
USER_ID = os.getenv("ALGO_EMA_USER_ID", "algo-ema")
SYMBOL = os.getenv("ALGO_EMA_SYMBOL", "AAPL")
ORDER_QTY = int(os.getenv("ALGO_EMA_ORDER_QTY", "10"))
FAST_WINDOW = int(os.getenv("ALGO_EMA_FAST_WINDOW", "12"))
SLOW_WINDOW = int(os.getenv("ALGO_EMA_SLOW_WINDOW", "26"))


def _submit_order(side: str) -> None:
    payload = {
        "user_id": USER_ID,
        "symbol": SYMBOL,
        "side": side,
        "order_type": "market",
        "price": None,
        "quantity": ORDER_QTY,
    }
    request = urllib_request.Request(
        f"{API_URL}/api/orders",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib_request.urlopen(request, timeout=10):
        pass


def _has_inventory() -> bool:
    request = urllib_request.Request(f"{API_URL}/api/portfolio/{USER_ID}", method="GET")
    with urllib_request.urlopen(request, timeout=10) as response:
        payload = json.loads(response.read().decode("utf-8"))
    for position in payload.get("positions", []):
        if position.get("symbol") == SYMBOL and int(position.get("quantity", 0)) >= ORDER_QTY:
            return True
    return False


def _ema(previous: float | None, value: float, window: int) -> float:
    multiplier = 2 / (window + 1)
    if previous is None:
        return value
    return ((value - previous) * multiplier) + previous


async def run() -> None:
    fast_ema: float | None = None
    slow_ema: float | None = None
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

                        close = float(bar["close"])
                        fast_ema = _ema(fast_ema, close, FAST_WINDOW)
                        slow_ema = _ema(slow_ema, close, SLOW_WINDOW)

                        if previous_fast is not None and previous_slow is not None:
                            crossed_up = previous_fast <= previous_slow and fast_ema > slow_ema
                            crossed_down = previous_fast >= previous_slow and fast_ema < slow_ema

                            if crossed_up:
                                _submit_order("buy")
                            elif crossed_down and _has_inventory():
                                _submit_order("sell")

                        previous_fast = fast_ema
                        previous_slow = slow_ema

        except Exception as exc:
            print(f"[algo-ema] reconnecting after error: {exc}")
            await asyncio.sleep(2)


if __name__ == "__main__":
    asyncio.run(run())
