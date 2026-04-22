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
USER_ID = os.getenv("ALGO_RSI_USER_ID", "algo-rsi")
SYMBOL = os.getenv("ALGO_RSI_SYMBOL", "AAPL")
ORDER_QTY = int(os.getenv("ALGO_RSI_ORDER_QTY", "10"))
WINDOW = int(os.getenv("ALGO_RSI_WINDOW", "14"))


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


def _rsi(values: deque[float]) -> float | None:
    if len(values) < WINDOW + 1:
        return None

    gains = 0.0
    losses = 0.0
    previous = None
    for value in list(values)[-WINDOW - 1 :]:
        if previous is not None:
            delta = value - previous
            if delta > 0:
                gains += delta
            else:
                losses += abs(delta)
        previous = value

    if losses == 0:
        return 100.0

    rs = gains / losses
    return 100.0 - (100.0 / (1.0 + rs))


async def run() -> None:
    closes: deque[float] = deque(maxlen=WINDOW + 1)
    previous_rsi: float | None = None

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
                        current_rsi = _rsi(closes)
                        if current_rsi is None:
                            continue

                        if previous_rsi is not None:
                            if previous_rsi <= 30.0 and current_rsi > 30.0:
                                _submit_order("buy")
                            elif previous_rsi >= 70.0 and current_rsi < 70.0 and _has_inventory():
                                _submit_order("sell")

                        previous_rsi = current_rsi

        except Exception as exc:
            print(f"[algo-rsi] reconnecting after error: {exc}")
            await asyncio.sleep(2)


if __name__ == "__main__":
    asyncio.run(run())
