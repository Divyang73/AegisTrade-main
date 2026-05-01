from __future__ import annotations

import asyncio
import os
from typing import Any

import websockets  # pyright: ignore[reportMissingImports]

import http_client
from strategy_telemetry import StrategyTelemetryClient


API_URL = os.getenv("API_URL", "http://localhost:8000")
WS_URL = os.getenv("WS_URL", "ws://localhost:8000/ws/market")
USER_ID = os.getenv("ALGO_EMA_USER_ID", "algo-ema")
SYMBOL = os.getenv("ALGO_EMA_SYMBOL", "AAPL")
ORDER_QTY = int(os.getenv("ALGO_EMA_ORDER_QTY", "10"))
FAST_WINDOW = int(os.getenv("ALGO_EMA_FAST_WINDOW", "12"))
SLOW_WINDOW = int(os.getenv("ALGO_EMA_SLOW_WINDOW", "26"))
STRATEGY_NAME = "EMA"
STRATEGY_SLUG = "ema-crossover"

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


def _ema(previous: float | None, value: float, window: int) -> float:
    multiplier = 2 / (window + 1)
    if previous is None:
        return value
    return ((value - previous) * multiplier) + previous


async def run() -> None:
    telemetry.init()
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

                        timestamp = str(bar.get("timestamp") or payload.get("timestamp") or "")
                        telemetry.run(timestamp)
                        close = float(bar["close"])
                        fast_ema = _ema(fast_ema, close, FAST_WINDOW)
                        slow_ema = _ema(slow_ema, close, SLOW_WINDOW)
                        indicators = {"fast_ema": fast_ema, "slow_ema": slow_ema, "fast_window": FAST_WINDOW, "slow_window": SLOW_WINDOW}

                        if fast_ema is None or slow_ema is None:
                            telemetry.no_data("Waiting for EMA windows to warm up", timestamp)
                            continue

                        if previous_fast is not None and previous_slow is not None:
                            crossed_up = previous_fast <= previous_slow and fast_ema > slow_ema
                            crossed_down = previous_fast >= previous_slow and fast_ema < slow_ema

                            if crossed_up:
                                signal_payload = telemetry.signal(
                                    price=close,
                                    indicators=indicators,
                                    decision="BUY",
                                    reason="Fast EMA crossed above slow EMA",
                                    timestamp=timestamp,
                                    input_data={"price": close, "fast_ema": fast_ema, "slow_ema": slow_ema},
                                )
                                telemetry.trade_attempt(signal_payload, timestamp)
                                _submit_order("buy")
                                telemetry.trade_success(timestamp=timestamp)
                            elif crossed_down and _has_inventory():
                                signal_payload = telemetry.signal(
                                    price=close,
                                    indicators=indicators,
                                    decision="SELL",
                                    reason="Fast EMA crossed below slow EMA",
                                    timestamp=timestamp,
                                    input_data={"price": close, "fast_ema": fast_ema, "slow_ema": slow_ema},
                                )
                                telemetry.trade_attempt(signal_payload, timestamp)
                                _submit_order("sell")
                                telemetry.trade_success(timestamp=timestamp)
                            else:
                                telemetry.signal(
                                    price=close,
                                    indicators=indicators,
                                    decision="NO TRADE",
                                    reason="EMA crossover not confirmed",
                                    timestamp=timestamp,
                                    input_data={"price": close, "fast_ema": fast_ema, "slow_ema": slow_ema},
                                )
                        else:
                            telemetry.signal(
                                price=close,
                                indicators=indicators,
                                decision="NO TRADE",
                                reason="Waiting for prior EMA values",
                                timestamp=timestamp,
                                input_data={"price": close, "fast_ema": fast_ema, "slow_ema": slow_ema},
                            )

                        previous_fast = fast_ema
                        previous_slow = slow_ema

        except Exception as exc:
            telemetry.crash(exc)
            print(f"[algo-ema] reconnecting after error: {exc}")
            await asyncio.sleep(2)


if __name__ == "__main__":
    asyncio.run(run())
