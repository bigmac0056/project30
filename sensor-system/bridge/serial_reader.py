"""
serial_reader.py
────────────────
Thin wrapper around pyserial.
Handles:
  - port open / close
  - line-by-line JSON parsing
  - graceful error recovery (no crash on disconnect)
"""

import json
import logging
import serial

logger = logging.getLogger(__name__)


class SerialReader:
    def __init__(self, port: str, baudrate: int = 9600, timeout: float = 1.0):
        self.port     = port
        self.baudrate = baudrate
        self.timeout  = timeout
        self._ser: serial.Serial | None = None

    # ── Connection ────────────────────────────────────────────

    def connect(self) -> bool:
        """Open the serial port. Returns True on success."""
        try:
            self._ser = serial.Serial(
                self.port,
                self.baudrate,
                timeout=self.timeout,
            )
            # Flush any stale bytes left in the hardware buffer
            self._ser.reset_input_buffer()
            logger.info(f"[serial] opened {self.port} @ {self.baudrate} baud")
            return True
        except serial.SerialException as exc:
            logger.warning(f"[serial] cannot open {self.port}: {exc}")
            self._ser = None
            return False

    def disconnect(self) -> None:
        if self._ser and self._ser.is_open:
            try:
                self._ser.close()
            except Exception:
                pass
        self._ser = None
        logger.info("[serial] port closed")

    @property
    def is_connected(self) -> bool:
        return self._ser is not None and self._ser.is_open

    # ── Reading ───────────────────────────────────────────────

    def read_json(self) -> dict | None:
        """
        Read one line and parse as JSON.
        Returns a dict on success, None otherwise.
        Automatically marks the connection as broken on serial errors.
        """
        if not self.is_connected:
            return None

        try:
            raw = self._ser.readline()          # bytes, up to \n or timeout
            if not raw:
                return None

            line = raw.decode("utf-8", errors="replace").strip()
            if not line:
                return None

            return json.loads(line)

        except json.JSONDecodeError:
            logger.debug(f"[serial] bad JSON: {raw!r}")
            return None
        except UnicodeDecodeError as exc:
            logger.debug(f"[serial] decode error: {exc}")
            return None
        except serial.SerialException as exc:
            logger.error(f"[serial] read error (device unplugged?): {exc}")
            self.disconnect()
            return None
