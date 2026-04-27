"""
manager.py
──────────
Central in-memory state + WebSocket fan-out.

Responsibilities:
  - Track ONE device (bridge) WebSocket connection
  - Track N client WebSocket connections
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
        # Device (bridge) state
        self._device_ws    : WebSocket | None = None
        self.device_connected: bool = False

        # Client (React / RN) connections
        self._clients: set[WebSocket] = set()

        # Last known reading
        self.latest_reading : dict[str, Any] | None = None
        self.last_seen_ts   : float | None = None

    # ── Device (bridge) ───────────────────────────────────────

    async def device_connect(self, ws: WebSocket) -> None:
        """Called when the bridge establishes its WebSocket."""
        await ws.accept()
        self._device_ws      = ws
        self.device_connected = True
        logger.info("[manager] bridge connected")
        await self._broadcast_status()

    async def device_disconnect(self) -> None:
        """Called when the bridge WebSocket closes."""
        self._device_ws       = None
        self.device_connected = False
        logger.info("[manager] bridge disconnected")
        await self._broadcast_status()

    # ── Clients ───────────────────────────────────────────────

    async def client_connect(self, ws: WebSocket) -> None:
        """Accept a new client and send it the current state immediately."""
        await ws.accept()
        self._clients.add(ws)
        # Greet the client with the current device status and last reading
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

    # ── Sensor data ───────────────────────────────────────────

    async def handle_sensor_data(
        self,
        payload: dict[str, Any],
        ts     : float,
    ) -> None:
        """Store the latest reading and fan-out to all clients."""
        self.latest_reading = payload
        self.last_seen_ts   = ts or time.time()

        await self._broadcast({
            "type"   : "sensor_data",
            "payload": payload,
            "ts"     : self.last_seen_ts,
        })

    # ── Internal helpers ──────────────────────────────────────

    async def _broadcast_status(self) -> None:
        await self._broadcast({
            "type"     : "device_status",
            "connected": self.device_connected,
            "latest"   : self.latest_reading,
        })

    async def _broadcast(self, message: dict[str, Any]) -> None:
        """Send a JSON message to every connected client. Drop dead sockets."""
        dead: set[WebSocket] = set()
        for ws in self._clients:
            try:
                await ws.send_json(message)
            except Exception:
                dead.add(ws)
        self._clients -= dead

    # ── Stats ─────────────────────────────────────────────────

    @property
    def client_count(self) -> int:
        return len(self._clients)


# Singleton — imported everywhere
manager = ConnectionManager()
