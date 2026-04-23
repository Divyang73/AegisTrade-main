from __future__ import annotations

import asyncio
import json
import os
from typing import Any

import requests
import websockets


API_URL = os.getenv("API_URL", "http://localhost:8000")
WS_URL = os.getenv("WS_URL", "ws://localhost:8000/ws/market")
USER_ID = os.getenv("ALGO_MACD_USER_ID", "algo-macd")
SYMBOL = os.getenv("ALGO_MACD_SYMBOL", "AAPL")
ORDER_QTY = int(os.getenv("ALGO_MACD_ORDER_QTY", "10"))
FAST_WINDOW = int(os.getenv("ALGO_MACD_FAST_WINDOW", "12"))
SLOW_WINDOW = int(os.getenv("ALGO_MACD_SLOW_WINDOW", "26"))
SIGNAL_WINDOW = int(os.getenv("ALGO_MACD_SIGNAL_WINDOW", "9"))


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


def _ema(previous: float | None, value: float, window: int) -> float:
    multiplier = 2 / (window + 1)
    if previous is None:
        return value
    return ((value - previous) * multiplier) + previous


async def run() -> None:
    fast_ema: float | None = None
    slow_ema: float | None = None
    signal_ema: float | None = None
    previous_macd: float | None = None
    previous_signal: float | None = None
    seeded_macd_points = 0

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
                        macd_value = fast_ema - slow_ema

                        signal_ema = _ema(signal_ema, macd_value, SIGNAL_WINDOW)
                        seeded_macd_points += 1
                        if seeded_macd_points < SIGNAL_WINDOW:
                            continue

                        if previous_macd is not None and previous_signal is not None:
                            crossed_up = previous_macd <= previous_signal and macd_value > signal_ema
                            crossed_down = previous_macd >= previous_signal and macd_value < signal_ema

                            if crossed_up:
                                _submit_order("buy")
                            elif crossed_down and _has_inventory():
                                _submit_order("sell")

                        previous_macd = macd_value
                        previous_signal = signal_ema

        except Exception as exc:
            print(f"[algo-macd] reconnecting after error: {exc}")
            await asyncio.sleep(2)


if __name__ == "__main__":
    asyncio.run(run())
