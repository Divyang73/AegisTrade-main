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
USER_ID = os.getenv("ALGO_USER_ID", "algo-sma")
SYMBOL = os.getenv("ALGO_SYMBOL", "AAPL")
ORDER_QTY = int(os.getenv("ALGO_ORDER_QTY", "10"))
STRATEGY_NAME = "SMA"
STRATEGY_SLUG = "sma-crossover"

telemetry = StrategyTelemetryClient(STRATEGY_NAME, STRATEGY_SLUG, USER_ID)


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
    telemetry.init()
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

                        timestamp = str(bar.get("timestamp") or payload.get("timestamp") or "")
                        telemetry.run(timestamp)
                        closes.append(float(bar["close"]))
                        fast = _sma(closes, 10)
                        slow = _sma(closes, 50)
                        indicators = {"fast_sma": fast, "slow_sma": slow, "window": len(closes)}
                        if fast is None or slow is None:
                            telemetry.no_data("Waiting for SMA windows to warm up", timestamp)
                            continue

                        if previous_fast is None or previous_slow is None:
                            telemetry.signal(
                                price=float(bar["close"]),
                                indicators=indicators,
                                decision="NO TRADE",
                                reason="Awaiting prior SMA values to detect a crossover",
                                timestamp=timestamp,
                                input_data={"price": float(bar["close"]), "close_history": list(closes)},
                            )
                        else:
                            crossed_up = previous_fast <= previous_slow and fast > slow
                            crossed_down = previous_fast >= previous_slow and fast < slow
                            if crossed_up:
                                signal_payload = telemetry.signal(
                                    price=float(bar["close"]),
                                    indicators=indicators,
                                    decision="BUY",
                                    reason="Fast SMA crossed above slow SMA",
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
                                    reason="Fast SMA crossed below slow SMA",
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
                                    reason="SMA crossover not confirmed",
                                    timestamp=timestamp,
                                    input_data={"price": float(bar["close"]), "close_history": list(closes)},
                                )

                        previous_fast = fast
                        previous_slow = slow

        except Exception as exc:
            telemetry.crash(exc)
            print(f"[algo-sma] reconnecting after error: {exc}")
            await asyncio.sleep(2)


if __name__ == "__main__":
    asyncio.run(run())
