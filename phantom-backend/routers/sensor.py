"""
routers/sensor.py — phantom-backend
──────────────────────────────────────
Real-time sensor WebSocket endpoints (bridge + clients) and status REST API.

/ws/device   ← Python bridge authenticates with X-Device-Token header
/ws/client   ← React / React Native clients receive live data
/api/status  → device + client connection stats
/api/latest  → last sensor reading
"""
from __future__ import annotations

import json
import logging
import time
from typing import Any

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from pydantic import BaseModel, field_validator

from config import DEVICE_TOKEN
from manager import manager

router = APIRouter(tags=["sensor"])
logger = logging.getLogger(__name__)


# ── Internal message schema (bridge → backend) ────────────────────────────────

class BridgeMessage(BaseModel):
    type   : str
    payload: dict[str, Any]
    ts     : float = 0.0

    @field_validator("ts", mode="before")
    @classmethod
    def _default_ts(cls, v: float) -> float:
        return v or time.time()


# ── Device WebSocket ──────────────────────────────────────────────────────────

@router.websocket("/ws/device")
async def device_ws(ws: WebSocket) -> None:
    """
    The Python bridge connects here.
    Authenticates via X-Device-Token header.
    One bridge at a time — second connection replaces the first.
    """
    if ws.headers.get("X-Device-Token", "") != DEVICE_TOKEN:
        await ws.close(code=4001, reason="Unauthorized")
        logger.warning("[ws/device] rejected — bad token")
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


# ── Client WebSocket ──────────────────────────────────────────────────────────

@router.websocket("/ws/client")
async def client_ws(ws: WebSocket) -> None:
    """
    React (web) and React Native mobile clients connect here.
    Clients only receive data; the loop detects disconnects.
    """
    await manager.client_connect(ws)
    try:
        while True:
            await ws.receive_text()   # keeps connection alive, detects close
    except WebSocketDisconnect:
        pass
    except Exception as exc:
        logger.debug(f"[ws/client] disconnected: {exc}")
    finally:
        manager.client_disconnect(ws)


# ── REST ──────────────────────────────────────────────────────────────────────

@router.get("/api/status")
def get_status() -> JSONResponse:
    return JSONResponse({
        "device_connected": manager.device_connected,
        "client_count"    : manager.client_count,
        "last_seen_ts"    : manager.last_seen_ts,
        "latest_reading"  : manager.latest_reading,
    })


@router.get("/api/latest")
def get_latest() -> JSONResponse:
    if manager.latest_reading is None:
        raise HTTPException(status_code=404, detail="No data received yet")
    return JSONResponse({"payload": manager.latest_reading, "ts": manager.last_seen_ts})
