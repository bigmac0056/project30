"""
Bridge configuration.
Edit SERIAL_PORT to match your Arduino's port:
  macOS / Linux : /dev/tty.usbmodem14101  or  /dev/ttyACM0
  Windows       : COM3  (or COM4, COM5 …)
"""

BRIDGE_CONFIG = {
    # ── Serial ────────────────────────────────────────────────
    "serial_port"  : "/dev/tty.usbmodem14101",  # ← change me
    "baudrate"     : 9600,
    "read_timeout" : 1,          # seconds before readline gives up

    # ── Backend WebSocket ─────────────────────────────────────
    "ws_url"       : "ws://localhost:8000/ws/device",

    # Must match DEVICE_TOKEN in backend/config.py
    "device_token" : "phantom-bridge-secret",

    # ── Behaviour ─────────────────────────────────────────────
    "sample_hz"         : 50,    # target sampling rate
    "serial_retry_sec"  : 2,     # wait before retrying serial open
    "ws_retry_sec"      : 3,     # wait before retrying WS connect
}
