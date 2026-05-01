from __future__ import annotations

import asyncio
import json
import os
from collections import deque
from statistics import pstdev
from typing import Any

import requests
import websockets

from strategy_telemetry import StrategyTelemetryClient


API_URL = os.getenv("API_URL", "http://localhost:8000")
WS_URL = os.getenv("WS_URL", "ws://localhost:8000/ws/market")
USER_ID = os.getenv("ALGO_BOLLINGER_USER_ID", "algo-bollinger")
SYMBOL = os.getenv("ALGO_BOLLINGER_SYMBOL", "AAPL")
ORDER_QTY = int(os.getenv("ALGO_BOLLINGER_ORDER_QTY", "10"))
WINDOW = int(os.getenv("ALGO_BOLLINGER_WINDOW", "20"))
STD_MULTIPLIER = float(os.getenv("ALGO_BOLLINGER_STD", "2.0"))
STRATEGY_NAME = "Bollinger"
STRATEGY_SLUG = "bollinger-reversion"

telemetry = StrategyTelemetryClient(STRATEGY_NAME, STRATEGY_SLUG, USER_ID)


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


def _bands(values: deque[float]) -> tuple[float, float, float] | None:
    if len(values) < WINDOW:
        return None
    segment = list(values)[-WINDOW:]
    middle = sum(segment) / WINDOW
    deviation = pstdev(segment) if len(segment) > 1 else 0.0
    upper = middle + (STD_MULTIPLIER * deviation)
    lower = middle - (STD_MULTIPLIER * deviation)
    return middle, upper, lower


async def run() -> None:
    telemetry.init()
    closes: deque[float] = deque(maxlen=WINDOW)

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

                        timestamp = str(bar.get("timestamp") or payload.get("timestamp") or "")
                        telemetry.run(timestamp)
                        close = float(bar["close"])
                        closes.append(close)
                        computed = _bands(closes)
                        if computed is None:
                            telemetry.no_data("Waiting for Bollinger window to warm up", timestamp)
                            continue

                        middle, upper, lower = computed
                        indicators = {"middle": middle, "upper": upper, "lower": lower, "window": WINDOW, "std_multiplier": STD_MULTIPLIER}
                        if close < lower:
                            signal_payload = telemetry.signal(
                                price=close,
                                indicators=indicators,
                                decision="BUY",
                                reason="Price broke below the lower Bollinger band",
                                timestamp=timestamp,
                                input_data={"price": close, "close_history": list(closes)},
                            )
                            telemetry.trade_attempt(signal_payload, timestamp)
                            _submit_order("buy")
                            telemetry.trade_success(timestamp=timestamp)
                        elif close > upper and _has_inventory():
                            signal_payload = telemetry.signal(
                                price=close,
                                indicators=indicators,
                                decision="SELL",
                                reason="Price broke above the upper Bollinger band",
                                timestamp=timestamp,
                                input_data={"price": close, "close_history": list(closes)},
                            )
                            telemetry.trade_attempt(signal_payload, timestamp)
                            _submit_order("sell")
                            telemetry.trade_success(timestamp=timestamp)
                        else:
                            telemetry.signal(
                                price=close,
                                indicators=indicators,
                                decision="NO TRADE",
                                reason="Price stayed within Bollinger bands",
                                timestamp=timestamp,
                                input_data={"price": close, "close_history": list(closes)},
                            )

        except Exception as exc:
            telemetry.crash(exc)
            print(f"[algo-bollinger] reconnecting after error: {exc}")
            await asyncio.sleep(2)


if __name__ == "__main__":
    asyncio.run(run())
