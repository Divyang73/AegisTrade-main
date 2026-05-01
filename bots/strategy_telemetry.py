from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from typing import Any

import requests


API_URL = os.getenv("API_URL", "http://localhost:8000")


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class StrategyTelemetryClient:
    def __init__(self, strategy_name: str, strategy_slug: str, user_id: str) -> None:
        self.strategy_name = strategy_name
        self.strategy_slug = strategy_slug
        self.user_id = user_id

    def _publish(self, event_type: str, payload: dict[str, Any], timestamp: str | None = None) -> None:
        body = {
            "strategy": self.strategy_slug,
            "strategy_name": self.strategy_name,
            "user_id": self.user_id,
            "event_type": event_type,
            "timestamp": timestamp or _now_iso(),
            "payload": payload,
        }
        try:
            requests.post(f"{API_URL}/api/strategy-events", json=body, timeout=5).raise_for_status()
        except Exception as exc:
            print(f"[TELEMETRY] {self.strategy_name} publish failed: {exc}")

    def init(self) -> None:
        timestamp = _now_iso()
        print(f"[BOT INIT] Strategy {self.strategy_name} initialized")
        self._publish("init", {"message": f"{self.strategy_name} initialized"}, timestamp=timestamp)

    def run(self, timestamp: str | None = None) -> None:
        run_timestamp = timestamp or _now_iso()
        print(f"[BOT RUN] Strategy {self.strategy_name} running at {run_timestamp}")
        self._publish("run", {"message": f"{self.strategy_name} running"}, timestamp=run_timestamp)

    def signal(
        self,
        *,
        price: float,
        indicators: dict[str, Any],
        decision: str,
        reason: str,
        timestamp: str | None = None,
        input_data: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        signal_payload = {
            "price": price,
            "indicators": indicators,
            "signal": decision,
            "decision": decision,
            "reason": reason,
            "input": input_data or {"price": price},
        }
        print(f"[SIGNAL] {self.strategy_name} {json.dumps(signal_payload, default=str)}")
        self._publish("signal", signal_payload, timestamp=timestamp)
        return signal_payload

    def trade_attempt(self, signal_payload: dict[str, Any], timestamp: str | None = None) -> None:
        print(f"[TRADE ATTEMPT] {self.strategy_name} {json.dumps(signal_payload, default=str)}")
        self._publish("trade_attempt", {"signal": signal_payload}, timestamp=timestamp)

    def trade_success(self, trade_ref: str | None = None, timestamp: str | None = None) -> None:
        print(f"[TRADE SUCCESS] {self.strategy_name} {trade_ref or 'order-accepted'}")
        self._publish("trade_success", {"tradeId": trade_ref or "order-accepted"}, timestamp=timestamp)

    def no_data(self, reason: str, timestamp: str | None = None) -> None:
        print(f"[ERROR] No data for {self.strategy_name}: {reason}")
        self._publish(
            "signal",
            {
                "price": None,
                "indicators": {},
                "signal": "NO TRADE",
                "decision": "NO TRADE",
                "reason": reason,
                "input": {},
            },
            timestamp=timestamp,
        )

    def crash(self, error: Exception, timestamp: str | None = None) -> None:
        print(f"[CRASH] {self.strategy_name} {error}")
        self._publish("error", {"error": str(error)}, timestamp=timestamp)