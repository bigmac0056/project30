"""
tests/test_bridge.py — sensor-system/bridge
─────────────────────────────────────────────
Unit tests for the Arduino bridge components.

Tests serial_reader.SerialReader JSON parsing without any real hardware:
  - Valid JSON lines are parsed correctly
  - Malformed / empty / non-ASCII lines return None (no crash)
  - Connection state is tracked accurately

Run from the bridge/ directory:
    pip install pytest
    pytest tests/ -v
"""
import json
import sys
import types
from unittest.mock import MagicMock, patch, PropertyMock

import pytest

# ── Stub out pyserial so tests run without hardware ───────────────────────────
serial_stub = types.ModuleType("serial")

class SerialExceptionStub(Exception):
    pass

serial_stub.SerialException = SerialExceptionStub
serial_stub.Serial = MagicMock
sys.modules.setdefault("serial", serial_stub)

from serial_reader import SerialReader  # noqa: E402 — must import after stub


# ── Helpers ───────────────────────────────────────────────────────────────────

def _make_reader_with_line(line_bytes: bytes) -> SerialReader:
    """Return a SerialReader whose underlying serial port yields one line."""
    reader = SerialReader("/dev/ttyFAKE", baudrate=9600)
    mock_ser = MagicMock()
    mock_ser.is_open = True
    mock_ser.readline.return_value = line_bytes
    reader._ser = mock_ser
    return reader


# ── SerialReader.read_json ────────────────────────────────────────────────────

class TestReadJson:
    def test_valid_json_line(self):
        payload = {"ecg": 512, "norm": 0.62, "v": 2.48, "ms": 12345}
        reader = _make_reader_with_line(json.dumps(payload).encode() + b"\n")
        result = reader.read_json()
        assert result == payload

    def test_valid_json_with_all_fields(self):
        payload = {"ecg": 300, "norm": 0.30, "v": 1.46, "ms": 99000}
        reader = _make_reader_with_line(json.dumps(payload).encode() + b"\n")
        result = reader.read_json()
        assert result["norm"] == pytest.approx(0.30, abs=0.001)
        assert result["ecg"] == 300

    def test_malformed_json_returns_none(self):
        reader = _make_reader_with_line(b"not json at all\n")
        assert reader.read_json() is None

    def test_empty_line_returns_none(self):
        reader = _make_reader_with_line(b"\n")
        assert reader.read_json() is None

    def test_no_data_timeout_returns_none(self):
        """readline returning b'' means serial timeout — should return None."""
        reader = _make_reader_with_line(b"")
        assert reader.read_json() is None

    def test_partial_json_returns_none(self):
        reader = _make_reader_with_line(b'{"ecg": 512\n')
        assert reader.read_json() is None

    def test_non_ascii_bytes_do_not_crash(self):
        reader = _make_reader_with_line(b"\xff\xfe\x00\x01garbage\n")
        # Must not raise; must return None (garbled = not valid JSON)
        result = reader.read_json()
        assert result is None

    def test_not_connected_returns_none(self):
        reader = SerialReader("/dev/ttyFAKE")
        reader._ser = None
        assert reader.read_json() is None

    def test_serial_exception_disconnects(self):
        reader = _make_reader_with_line(b"irrelevant")
        reader._ser.readline.side_effect = serial_stub.SerialException("device gone")
        result = reader.read_json()
        assert result is None
        # After a SerialException the reader should have closed the port
        assert not reader.is_connected

    def test_extra_whitespace_stripped(self):
        payload = {"ecg": 100, "norm": 0.1, "v": 0.49, "ms": 1}
        line = b"  " + json.dumps(payload).encode() + b"  \r\n"
        reader = _make_reader_with_line(line)
        result = reader.read_json()
        assert result is not None
        assert result["ecg"] == 100


# ── SerialReader connection state ─────────────────────────────────────────────

class TestConnectionState:
    def test_is_connected_true_when_port_open(self):
        reader = SerialReader("/dev/ttyFAKE")
        mock_ser = MagicMock()
        mock_ser.is_open = True
        reader._ser = mock_ser
        assert reader.is_connected is True

    def test_is_connected_false_with_no_serial(self):
        reader = SerialReader("/dev/ttyFAKE")
        reader._ser = None
        assert reader.is_connected is False

    def test_is_connected_false_when_port_closed(self):
        reader = SerialReader("/dev/ttyFAKE")
        mock_ser = MagicMock()
        mock_ser.is_open = False
        reader._ser = mock_ser
        assert reader.is_connected is False

    def test_connect_failure_returns_false(self):
        reader = SerialReader("/dev/ttyNONEXISTENT")
        with patch("serial.Serial", side_effect=serial_stub.SerialException("no port")):
            # Re-patch the module-level serial in serial_reader
            import serial_reader as sr
            original = sr.serial
            try:
                mock_serial_mod = MagicMock()
                mock_serial_mod.SerialException = serial_stub.SerialException
                mock_serial_mod.Serial.side_effect = serial_stub.SerialException("no port")
                sr.serial = mock_serial_mod
                result = reader.connect()
            finally:
                sr.serial = original
        assert result is False
        assert reader._ser is None

    def test_disconnect_clears_ser(self):
        reader = _make_reader_with_line(b"")
        reader.disconnect()
        assert reader._ser is None


# ── JSON normalisation round-trip ─────────────────────────────────────────────

class TestNormValue:
    """norm field semantics — should be a float in [0, 1]."""

    @pytest.mark.parametrize("norm", [0.0, 0.01, 0.5, 0.999, 1.0])
    def test_norm_range(self, norm):
        payload = {"ecg": 512, "norm": norm, "v": norm * 4.96, "ms": 10000}
        reader = _make_reader_with_line(json.dumps(payload).encode() + b"\n")
        result = reader.read_json()
        assert result is not None
        assert 0.0 <= result["norm"] <= 1.0
