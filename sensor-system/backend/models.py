"""
Pydantic models for sensor data validation and serialisation.
"""
from __future__ import annotations

from typing import Any
import time

from pydantic import BaseModel, field_validator


class SensorPayload(BaseModel):
    """Raw reading coming from the Arduino (via bridge)."""
    ecg : float | None = None   # raw ADC value
    norm: float | None = None   # 0.0 – 1.0 normalised
    v   : float | None = None   # voltage (V)
    ms  : int   | None = None   # Arduino millis()

    # Allow any extra sensor fields (acc, gyro, temp …)
    model_config = {"extra": "allow"}


class BridgeMessage(BaseModel):
    """Message format the bridge sends over its WebSocket."""
    type   : str
    payload: dict[str, Any]
    ts     : float = 0.0        # Unix timestamp from bridge

    @field_validator("ts", mode="before")
    @classmethod
    def default_ts(cls, v: float) -> float:
        return v or time.time()


class DeviceStatusMessage(BaseModel):
    """Broadcast to clients when device connects / disconnects."""
    type     : str = "device_status"
    connected: bool
    latest   : dict[str, Any] | None = None


class SensorDataMessage(BaseModel):
    """Broadcast to clients on every sensor reading."""
    type   : str = "sensor_data"
    payload: dict[str, Any]
    ts     : float
