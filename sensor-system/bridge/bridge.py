"""
bridge.py
─────────
Entry point for the Arduino → Backend bridge.

Data flow:
  Arduino --serial/USB--> SerialReader --JSON--> WebSocket --> FastAPI backend

Run:
  python bridge.py
"""

import asyncio
import json
import logging
import time

import websockets
from websockets.exceptions import ConnectionClosed

from config import BRIDGE_CONFIG
from serial_reader import SerialReader

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [bridge] %(levelname)s %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

SAMPLE_INTERVAL = 1.0 / BRIDGE_CONFIG["sample_hz"]   # seconds between sends


async def run_bridge() -> None:
    """
    Outer loop  : keeps the WebSocket to the backend alive (reconnects on drop)
    Inner loop  : reads serial and forwards every packet to the backend WS
    """
    reader = SerialReader(
        port     = BRIDGE_CONFIG["serial_port"],
        baudrate = BRIDGE_CONFIG["baudrate"],
        timeout  = BRIDGE_CONFIG["read_timeout"],
    )
    ws_url = BRIDGE_CONFIG["ws_url"]
    token  = BRIDGE_CONFIG["device_token"]

    while True:
        # ── Try to connect to backend ─────────────────────────
        logger.info(f"Connecting to backend: {ws_url}")
        try:
            async with websockets.connect(
                ws_url,
                extra_headers={"X-Device-Token": token},
                ping_interval=20,
                ping_timeout=10,
            ) as ws:
                logger.info("Backend WebSocket connected ✓")

                # ── Inner serial loop ─────────────────────────
                while True:
                    loop_start = time.monotonic()

                    # Ensure serial is open
                    if not reader.is_connected:
                        logger.info(f"Opening serial port {BRIDGE_CONFIG['serial_port']} …")
                        if not reader.connect():
                            await asyncio.sleep(BRIDGE_CONFIG["serial_retry_sec"])
                            continue

                    # Read one JSON line from Arduino
                    data = reader.read_json()
                    if data is not None:
                        message = json.dumps({
                            "type"    : "data",
                            "payload" : data,
                            "ts"      : time.time(),
                        })
                        try:
                            await ws.send(message)
                        except ConnectionClosed:
                            logger.warning("Backend WS closed — reconnecting …")
                            break   # break inner loop → reconnect outer loop

                    # Pace to target sample rate (non-blocking)
                    elapsed = time.monotonic() - loop_start
                    sleep_for = SAMPLE_INTERVAL - elapsed
                    if sleep_for > 0:
                        await asyncio.sleep(sleep_for)

        except (OSError, ConnectionClosed, websockets.exceptions.WebSocketException) as exc:
            logger.error(f"WS error: {exc}")
        except Exception as exc:
            logger.exception(f"Unexpected error: {exc}")
        finally:
            reader.disconnect()

        logger.info(f"Retrying in {BRIDGE_CONFIG['ws_retry_sec']} s …")
        await asyncio.sleep(BRIDGE_CONFIG["ws_retry_sec"])


if __name__ == "__main__":
    try:
        asyncio.run(run_bridge())
    except KeyboardInterrupt:
        logger.info("Bridge stopped.")
