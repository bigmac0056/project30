"""
manager.py — phantom-backend
──────────────────────────────
Central in-memory WebSocket state + fan-out.

Responsibilities:
  - Track ONE device (bridge) WebSocket connection
  - Track N client (React / RN) WebSocket connections
  - Broadcast sensor data & status changes to all clients
  - Store last reading for late-joining clients
"""
from __future__ import annotations

import logging
import time
from typing import Any

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self) -> None:
        self._device_ws      : WebSocket | None = None
        self.device_connected: bool             = False
        self._clients        : set[WebSocket]   = set()
        self.latest_reading  : dict[str, Any] | None = None
        self.last_seen_ts    : float | None     = None

    # ── Device (bridge) ───────────────────────────────────────────────────────

    async def device_connect(self, ws: WebSocket) -> None:
        await ws.accept()
        self._device_ws       = ws
        self.device_connected = True
        logger.info("[manager] bridge connected")
        await self._broadcast_status()

    async def device_disconnect(self) -> None:
        self._device_ws       = None
        self.device_connected = False
        logger.info("[manager] bridge disconnected")
        await self._broadcast_status()

    # ── Clients ───────────────────────────────────────────────────────────────

    async def client_connect(self, ws: WebSocket) -> None:
        await ws.accept()
        self._clients.add(ws)
        # Greet with current state so the client isn't blank until the next event
        try:
            await ws.send_json({
                "type"     : "device_status",
                "connected": self.device_connected,
                "latest"   : self.latest_reading,
            })
        except Exception:
            pass

    def client_disconnect(self, ws: WebSocket) -> None:
        self._clients.discard(ws)

    # ── Sensor data ───────────────────────────────────────────────────────────

    async def handle_sensor_data(self, payload: dict[str, Any], ts: float) -> None:
        self.latest_reading = payload
        self.last_seen_ts   = ts or time.time()
        await self._broadcast({
            "type"   : "sensor_data",
            "payload": payload,
            "ts"     : self.last_seen_ts,
        })

    # ── Helpers ───────────────────────────────────────────────────────────────

    async def _broadcast_status(self) -> None:
        await self._broadcast({
            "type"     : "device_status",
            "connected": self.device_connected,
            "latest"   : self.latest_reading,
        })

    async def _broadcast(self, message: dict[str, Any]) -> None:
        dead: set[WebSocket] = set()
        for ws in list(self._clients):
            try:
                await ws.send_json(message)
            except Exception:
                dead.add(ws)
        self._clients -= dead

    @property
    def client_count(self) -> int:
        return len(self._clients)


# Singleton — imported by the sensor router
manager = ConnectionManager()
