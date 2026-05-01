from __future__ import annotations

from collections import deque
from dataclasses import dataclass, field
from datetime import datetime, timezone
from threading import RLock
from typing import Any


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _parse_timestamp(value: str | None) -> datetime:
    if not value:
        return datetime.now(timezone.utc)
    normalized = value.replace("Z", "+00:00")
    return datetime.fromisoformat(normalized)


@dataclass(slots=True)
class StrategyRuntimeState:
    strategy: str
    user_id: str
    status: str = "not_running"
    last_run: str | None = None
    last_signal: dict[str, Any] | None = None
    latest_input: dict[str, Any] | None = None
    indicators: dict[str, Any] | None = None
    reason: str | None = None
    error: str | None = None
    last_trade: dict[str, Any] | None = None
    trade_count: int = 0
    recent_events: deque[dict[str, Any]] = field(default_factory=lambda: deque(maxlen=25))
    last_seen_at: datetime | None = None

    def to_dict(self, stale_after_seconds: float = 12.0) -> dict[str, Any]:
        stale = False
        if self.last_seen_at is None:
            stale = True
        else:
            stale = (datetime.now(timezone.utc) - self.last_seen_at).total_seconds() > stale_after_seconds

        status = self.status
        if self.error:
            status = "error"
        elif stale and status != "error":
            status = "not_running"

        return {
            "strategy": self.strategy,
            "user_id": self.user_id,
            "status": status,
            "last_run": self.last_run,
            "last_signal": self.last_signal,
            "latest_input": self.latest_input,
            "indicators": self.indicators,
            "reason": self.reason,
            "error": self.error,
            "last_trade": self.last_trade,
            "trade_count": self.trade_count,
            "recent_events": list(self.recent_events),
        }


class StrategyRuntimeStore:
    def __init__(self) -> None:
        self._lock = RLock()
        self._states: dict[str, StrategyRuntimeState] = {}

    def ensure(self, strategy: str, user_id: str) -> StrategyRuntimeState:
        with self._lock:
            state = self._states.get(strategy)
            if state is None:
                state = StrategyRuntimeState(strategy=strategy, user_id=user_id)
                self._states[strategy] = state
            else:
                state.user_id = user_id
            return state

    def record_event(
        self,
        strategy: str,
        user_id: str,
        event_type: str,
        payload: dict[str, Any] | None = None,
        timestamp: str | None = None,
    ) -> StrategyRuntimeState:
        state = self.ensure(strategy, user_id)
        payload = payload or {}
        event_timestamp = timestamp or _now_iso()

        with self._lock:
            state.last_seen_at = _parse_timestamp(event_timestamp)
            state.recent_events.append(
                {
                    "type": event_type,
                    "timestamp": event_timestamp,
                    "payload": payload,
                }
            )

            if event_type in {"init", "run", "heartbeat"}:
                state.last_run = event_timestamp
                if state.status in {"not_running", "active"}:
                    state.status = "active"

            if event_type == "signal":
                state.last_run = event_timestamp
                state.last_signal = payload
                state.latest_input = payload.get("input") if isinstance(payload.get("input"), dict) else payload.get("input")
                state.indicators = payload.get("indicators") if isinstance(payload.get("indicators"), dict) else payload.get("indicators")
                state.reason = payload.get("reason")
                decision = str(payload.get("decision") or "NO TRADE").upper()
                state.status = "active" if decision in {"BUY", "SELL"} else "no_signals"

            if event_type == "trade_attempt":
                state.last_run = event_timestamp
                if payload.get("signal") is not None:
                    state.last_signal = payload.get("signal")
                if payload.get("reason") is not None:
                    state.reason = str(payload.get("reason"))
                state.status = "active"

            if event_type == "trade_success":
                state.last_run = event_timestamp
                state.last_trade = payload
                state.trade_count += 1
                state.status = "active"

            if event_type == "error":
                state.last_run = event_timestamp
                state.error = payload.get("error") or payload.get("message") or "Unknown error"
                state.status = "error"

            return state

    def get(self, strategy: str) -> StrategyRuntimeState | None:
        with self._lock:
            return self._states.get(strategy)

    def snapshot(self, strategy: str) -> dict[str, Any] | None:
        state = self.get(strategy)
        if state is None:
            return None
        return state.to_dict()

    def snapshots(self) -> list[dict[str, Any]]:
        with self._lock:
            return [state.to_dict() for state in self._states.values()]


strategy_runtime_store = StrategyRuntimeStore()