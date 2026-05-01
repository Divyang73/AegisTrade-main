from __future__ import annotations

import asyncio
import json
import os
from collections import deque
from typing import Any

import http_client
import websockets

from strategy_telemetry import StrategyTelemetryClient


API_URL = os.getenv("API_URL", "http://localhost:8000")
WS_URL = os.getenv("WS_URL", "ws://localhost:8000/ws/market")
USER_ID = os.getenv("ALGO_RSI_USER_ID", "algo-rsi")
SYMBOL = os.getenv("ALGO_RSI_SYMBOL", "AAPL")
ORDER_QTY = int(os.getenv("ALGO_RSI_ORDER_QTY", "10"))
WINDOW = int(os.getenv("ALGO_RSI_WINDOW", "14"))
STRATEGY_NAME = "RSI"
STRATEGY_SLUG = "rsi"

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
    response = http_client.post(f"{API_URL}/api/orders", json=payload, timeout=10)
    response.raise_for_status()


def _has_inventory() -> bool:
    response = http_client.get(f"{API_URL}/api/portfolio/{USER_ID}", timeout=10)
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
    telemetry.init()
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

                        timestamp = str(bar.get("timestamp") or payload.get("timestamp") or "")
                        telemetry.run(timestamp)
                        closes.append(float(bar["close"]))
                        current_rsi = _rsi(closes)
                        if current_rsi is None:
                            telemetry.no_data("Waiting for RSI warmup window", timestamp)
                            continue

                        indicators = {"rsi": current_rsi, "window": WINDOW, "closes": list(closes)}

                        if previous_rsi is not None:
                            if previous_rsi <= 30.0 and current_rsi > 30.0:
                                signal_payload = telemetry.signal(
                                    price=float(bar["close"]),
                                    indicators=indicators,
                                    decision="BUY",
                                    reason="RSI crossed above oversold threshold",
                                    timestamp=timestamp,
                                    input_data={"price": float(bar["close"]), "close_history": list(closes)},
                                )
                                telemetry.trade_attempt(signal_payload, timestamp)
                                _submit_order("buy")
                                telemetry.trade_success(timestamp=timestamp)
                            elif previous_rsi >= 70.0 and current_rsi < 70.0 and _has_inventory():
                                signal_payload = telemetry.signal(
                                    price=float(bar["close"]),
                                    indicators=indicators,
                                    decision="SELL",
                                    reason="RSI crossed below overbought threshold",
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
                                    reason="RSI stayed inside thresholds",
                                    timestamp=timestamp,
                                    input_data={"price": float(bar["close"]), "close_history": list(closes)},
                                )
                        else:
                            telemetry.signal(
                                price=float(bar["close"]),
                                indicators=indicators,
                                decision="NO TRADE",
                                reason="Waiting for prior RSI value",
                                timestamp=timestamp,
                                input_data={"price": float(bar["close"]), "close_history": list(closes)},
                            )

                        previous_rsi = current_rsi

        except Exception as exc:
            telemetry.crash(exc)
            print(f"[algo-rsi] reconnecting after error: {exc}")
            await asyncio.sleep(2)


if __name__ == "__main__":
    asyncio.run(run())
