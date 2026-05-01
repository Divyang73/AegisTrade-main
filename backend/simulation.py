from __future__ import annotations

import asyncio
from collections.abc import Iterable
from dataclasses import dataclass, field
from datetime import datetime

import asyncpg
from fastapi import WebSocket


def _to_iso(value: datetime | None) -> str | None:
    return value.isoformat() if value else None


@dataclass(slots=True)
class MarketStreamer:
    pool: asyncpg.Pool
    interval_seconds: float = 1.0
    clients: set[WebSocket] = field(default_factory=set)
    _task: asyncio.Task | None = None
    _running: bool = False
    _snapshots: list[dict] = field(default_factory=list)
    _index: int = 0
    latest_snapshot: dict | None = None

    async def start(self) -> None:
        if self._task is not None:
            return
        await self._load_snapshots()
        self._running = True
        self._task = asyncio.create_task(self._run(), name="market-streamer")

    async def stop(self) -> None:
        self._running = False
        if self._task is not None:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            self._task = None

    async def register(self, websocket: WebSocket) -> None:
        self.clients.add(websocket)
        if self.latest_snapshot is not None:
            await websocket.send_json(self.latest_snapshot)

    def unregister(self, websocket: WebSocket) -> None:
        self.clients.discard(websocket)

    async def get_snapshot(self) -> dict | None:
        if self.latest_snapshot is not None:
            return self.latest_snapshot
        if not self._snapshots:
            await self._load_snapshots()
        return self._snapshots[0] if self._snapshots else None

    async def _load_snapshots(self) -> None:
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT "timestamp", symbol, open, high, low, close, volume
                FROM historical_data
                ORDER BY "timestamp" ASC, symbol ASC
                """
            )

        grouped: dict[datetime, list[dict]] = {}
        for row in rows:
            timestamp = row["timestamp"]
            grouped.setdefault(timestamp, []).append(
                {
                    "symbol": row["symbol"],
                    "timestamp": _to_iso(timestamp),
                    "open": float(row["open"]),
                    "high": float(row["high"]),
                    "low": float(row["low"]),
                    "close": float(row["close"]),
                    "volume": int(row["volume"]),
                }
            )

        self._snapshots = [
            {"type": "tick", "timestamp": _to_iso(timestamp), "bars": bars}
            for timestamp, bars in grouped.items()
        ]

    async def _run(self) -> None:
        while self._running:
            if not self._snapshots:
                await asyncio.sleep(self.interval_seconds)
                continue

            if self._index >= len(self._snapshots):
                self._running = False
                return

            snapshot = self._snapshots[self._index]
            self.latest_snapshot = snapshot
            await self.broadcast(snapshot)
            self._index += 1
            if self._index >= len(self._snapshots):
                self._running = False
                return
            await asyncio.sleep(self.interval_seconds)

    async def broadcast(self, payload: dict) -> None:
        if not self.clients:
            return

        stale_clients: list[WebSocket] = []
        for websocket in list(self.clients):
            try:
                await websocket.send_json(payload)
            except Exception:
                stale_clients.append(websocket)

        for websocket in stale_clients:
            self.clients.discard(websocket)
