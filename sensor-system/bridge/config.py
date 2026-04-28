"""
sensor-system/bridge/config.py
────────────────────────────────
Bridge configuration loaded from environment variables.
Copy .env.example → .env and fill in your values, then run:
  python bridge.py
"""
import os

BRIDGE_CONFIG = {
    # ── Serial ────────────────────────────────────────────────────────────────
    # macOS / Linux: /dev/tty.usbmodem14101  or  /dev/ttyACM0
    # Windows:       COM3  (Device Manager → Ports)
    "serial_port"  : os.environ.get("SERIAL_PORT",   "/dev/tty.usbmodem14101"),
    "baudrate"     : int(os.environ.get("BAUDRATE",   "9600")),
    "read_timeout" : float(os.environ.get("READ_TIMEOUT", "1")),

    # ── Backend WebSocket ─────────────────────────────────────────────────────
    # Point to the bridge laptop's phantom-backend — e.g. ws://localhost:8000/ws/device
    "ws_url"       : os.environ.get("WS_URL", "ws://localhost:8000/ws/device"),

    # Must match DEVICE_TOKEN in phantom-backend/.env
    "device_token" : os.environ.get("DEVICE_TOKEN", "phantom-bridge-secret"),

    # ── Behaviour ─────────────────────────────────────────────────────────────
    "sample_hz"       : int(os.environ.get("SAMPLE_HZ",        "50")),
    "serial_retry_sec": float(os.environ.get("SERIAL_RETRY_SEC", "2")),
    "ws_retry_sec"    : float(os.environ.get("WS_RETRY_SEC",     "3")),
}
