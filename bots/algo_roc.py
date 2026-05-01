from __future__ import annotations

import asyncio
import json
import os
from collections import deque
from typing import Any

import requests
import websockets

from strategy_telemetry import StrategyTelemetryClient


API_URL = os.getenv("API_URL", "http://localhost:8000")
WS_URL = os.getenv("WS_URL", "ws://localhost:8000/ws/market")
USER_ID = os.getenv("ALGO_ROC_USER_ID", "algo-roc")
SYMBOL = os.getenv("ALGO_ROC_SYMBOL", "AAPL")
ORDER_QTY = int(os.getenv("ALGO_ROC_ORDER_QTY", "10"))
WINDOW = int(os.getenv("ALGO_ROC_WINDOW", "12"))
BUY_THRESHOLD = float(os.getenv("ALGO_ROC_BUY_THRESHOLD", "0.5"))
SELL_THRESHOLD = float(os.getenv("ALGO_ROC_SELL_THRESHOLD", "-0.5"))
STRATEGY_NAME = "ROC"
STRATEGY_SLUG = "roc-momentum"

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


def _roc(values: deque[float]) -> float | None:
    if len(values) < WINDOW + 1:
        return None

    now = values[-1]
    base = values[-1 - WINDOW]
    if base == 0:
        return None

    return ((now - base) / base) * 100


async def run() -> None:
    telemetry.init()
    closes: deque[float] = deque(maxlen=WINDOW + 1)
    previous_roc: float | None = None

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
                        closes.append(float(bar["close"]))
                        current_roc = _roc(closes)
                        if current_roc is None:
                            telemetry.no_data("Waiting for ROC window to warm up", timestamp)
                            continue

                        indicators = {"roc": current_roc, "window": WINDOW, "buy_threshold": BUY_THRESHOLD, "sell_threshold": SELL_THRESHOLD}

                        if previous_roc is not None:
                            crossed_up = previous_roc <= BUY_THRESHOLD and current_roc > BUY_THRESHOLD
                            crossed_down = previous_roc >= SELL_THRESHOLD and current_roc < SELL_THRESHOLD

                            if crossed_up:
                                signal_payload = telemetry.signal(
                                    price=float(bar["close"]),
                                    indicators=indicators,
                                    decision="BUY",
                                    reason="ROC crossed above the buy threshold",
                                    timestamp=timestamp,
                                    input_data={"price": float(bar["close"]), "close_history": list(closes)},
                                )
                                telemetry.trade_attempt(signal_payload, timestamp)
                                _submit_order("buy")
                                telemetry.trade_success(timestamp=timestamp)
                            elif crossed_down and _has_inventory():
                                signal_payload = telemetry.signal(
                                    price=float(bar["close"]),
                                    indicators=indicators,
                                    decision="SELL",
                                    reason="ROC crossed below the sell threshold",
                                    timestamp=timestamp,
                                    input_data={"price": float(bar["close"]), "close_history": list(closes)},
                                )
                                telemetry.trade_attempt(signal_payload, timestamp)
                                _submit_order("sell")
                                telemetry.trade_success(timestamp=timestamp)
                            else:
                                telemetry.signal(
                                    price=float(bar["close"]),
                                    indicators=indicators,
                                    decision="NO TRADE",
                                    reason="ROC remained inside thresholds",
                                    timestamp=timestamp,
                                    input_data={"price": float(bar["close"]), "close_history": list(closes)},
                                )
                        else:
                            telemetry.signal(
                                price=float(bar["close"]),
                                indicators=indicators,
                                decision="NO TRADE",
                                reason="Waiting for prior ROC value",
                                timestamp=timestamp,
                                input_data={"price": float(bar["close"]), "close_history": list(closes)},
                            )

                        previous_roc = current_roc

        except Exception as exc:
            telemetry.crash(exc)
            print(f"[algo-roc] reconnecting after error: {exc}")
            await asyncio.sleep(2)


if __name__ == "__main__":
    asyncio.run(run())
