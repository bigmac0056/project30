"""
routers/sensor.py
─────────────────
WebSocket + REST endpoints for sensor data.

/ws/device   ← bridge (authenticated, one at a time)
/ws/client   ← React / RN clients (many, unauthenticated)
/api/status  → device + client stats
/api/latest  → last sensor reading
"""
from __future__ import annotations

import json
import logging
import time

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse

from config import DEVICE_TOKEN
from manager import manager
from models import BridgeMessage

router = APIRouter()
logger = logging.getLogger(__name__)


# ── Device WebSocket (Bridge → Backend) ───────────────────────────────────────

@router.websocket("/ws/device")
async def device_ws(ws: WebSocket) -> None:
    """
    The Python bridge connects here.
    Authentication: X-Device-Token header must match DEVICE_TOKEN.
    Only one bridge is expected; if a second connects the first is simply replaced
    (the manager will handle the old one being closed gracefully on disconnect).
    """
    token = ws.headers.get("X-Device-Token", "")
    if token != DEVICE_TOKEN:
        await ws.close(code=4001, reason="Unauthorized")
        logger.warning("[ws/device] rejected connection — bad token")
        return

    await manager.device_connect(ws)
    try:
        while True:
            raw = await ws.receive_text()

            try:
                msg = BridgeMessage.model_validate_json(raw)
            except Exception as exc:
                logger.debug(f"[ws/device] bad message: {exc}")
                continue

            if msg.type == "data":
                await manager.handle_sensor_data(msg.payload, msg.ts)

    except WebSocketDisconnect:
        pass
    except Exception as exc:
        logger.error(f"[ws/device] error: {exc}")
    finally:
        await manager.device_disconnect()


# ── Client WebSocket (Backend → React / RN) ───────────────────────────────────

@router.websocket("/ws/client")
async def client_ws(ws: WebSocket) -> None:
    """
    React (web) and React Native clients connect here.
    They only receive — the while-True loop just keeps the connection
    alive and handles ping / pong frames automatically via FastAPI.
    """
    await manager.client_connect(ws)
    try:
        while True:
            # We don't expect data from clients, but we must await to detect disconnect
            await ws.receive_text()
    except WebSocketDisconnect:
        pass
    except Exception as exc:
        logger.debug(f"[ws/client] error: {exc}")
    finally:
        manager.client_disconnect(ws)


# ── REST endpoints ────────────────────────────────────────────────────────────

@router.get("/api/status")
def get_status() -> JSONResponse:
    """Overall device + server status."""
    return JSONResponse({
        "device_connected": manager.device_connected,
        "client_count"    : manager.client_count,
        "last_seen_ts"    : manager.last_seen_ts,
        "latest_reading"  : manager.latest_reading,
    })


@router.get("/api/latest")
def get_latest() -> JSONResponse:
    """Returns the most recent sensor reading, or 404 if none yet."""
    if manager.latest_reading is None:
        raise HTTPException(status_code=404, detail="No data received yet")
    return JSONResponse({
        "payload": manager.latest_reading,
        "ts"     : manager.last_seen_ts,
    })
