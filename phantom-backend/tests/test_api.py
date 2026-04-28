"""
tests/test_api.py — phantom-backend
─────────────────────────────────────
Integration tests using httpx + TestClient with an in-memory SQLite DB.

Run from the phantom-backend/ directory:
    pip install pytest httpx
    pytest tests/ -v
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# ── Override DB before importing app ─────────────────────────────────────────
TEST_DB_URL = "sqlite:///./test_phantom.db"
test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

import database
import models

database.engine = test_engine
database.SessionLocal = TestSessionLocal

def override_get_db():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()

from database import get_db
from main import app
app.dependency_overrides[get_db] = override_get_db

# Create tables in test DB
models.Base.metadata.create_all(bind=test_engine)

client = TestClient(app)


# ── Helpers ───────────────────────────────────────────────────────────────────

def register_and_login(email="test@example.com", password="testpass123", name="Test User"):
    client.post("/auth/register", json={"email": email, "name": name, "password": password})
    res = client.post("/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, res.text
    return res.json()["access_token"]


def auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# ── Auth tests ────────────────────────────────────────────────────────────────

class TestAuth:
    def test_register_and_login(self):
        token = register_and_login("auth1@example.com")
        assert token

    def test_duplicate_email(self):
        register_and_login("dup@example.com")
        res = client.post("/auth/register", json={
            "email": "dup@example.com", "name": "Dup", "password": "pass"
        })
        assert res.status_code == 400

    def test_wrong_password(self):
        register_and_login("wrong@example.com")
        res = client.post("/auth/login", json={"email": "wrong@example.com", "password": "bad"})
        assert res.status_code == 401

    def test_get_me(self):
        token = register_and_login("me@example.com")
        res = client.get("/users/me", headers=auth_headers(token))
        assert res.status_code == 200
        assert res.json()["email"] == "me@example.com"


# ── Session tests ─────────────────────────────────────────────────────────────

class TestSessions:
    def test_create_session(self):
        token = register_and_login("sess1@example.com")
        res = client.post("/sessions", json={
            "game": "Sparrow", "score": 420, "duration_sec": 90,
            "emg_peak": 0.82, "emg_avg": 0.54,
            "activation_score": 0.9, "precision_score": 0.7, "dosing_score": 0.6,
        }, headers=auth_headers(token))
        assert res.status_code == 200
        data = res.json()
        assert data["game"] == "Sparrow"
        assert data["score"] == 420
        assert data["emg_peak"] == pytest.approx(0.82, abs=0.01)

    def test_list_sessions(self):
        token = register_and_login("sess2@example.com")
        client.post("/sessions", json={
            "game": "PulseRun", "score": 200, "duration_sec": 60,
            "emg_peak": 0.7, "emg_avg": 0.4,
            "activation_score": 0.8, "precision_score": 0.6, "dosing_score": 0.5,
        }, headers=auth_headers(token))
        res = client.get("/sessions", headers=auth_headers(token))
        assert res.status_code == 200
        assert len(res.json()) >= 1

    def test_progress_endpoint(self):
        token = register_and_login("prog@example.com")
        res = client.get("/sessions/progress", headers=auth_headers(token))
        assert res.status_code == 200
        data = res.json()
        assert "total_sessions" in data
        assert "streak_days" in data

    def test_sessions_are_user_scoped(self):
        """Sessions from user A must not be visible to user B."""
        token_a = register_and_login("scopeA@example.com")
        token_b = register_and_login("scopeB@example.com")
        client.post("/sessions", json={
            "game": "SteadyClimb", "score": 999, "duration_sec": 300,
            "emg_peak": 0.9, "emg_avg": 0.5,
            "activation_score": 1.0, "precision_score": 0.9, "dosing_score": 0.8,
        }, headers=auth_headers(token_a))
        res_b = client.get("/sessions", headers=auth_headers(token_b))
        games_b = [s["game"] for s in res_b.json()]
        # B's session list should not contain A's session (score 999 SteadyClimb)
        scores_b = [s["score"] for s in res_b.json()]
        assert 999 not in scores_b


# ── Calibration tests ─────────────────────────────────────────────────────────

class TestCalibration:
    def test_save_calibration(self):
        token = register_and_login("cal1@example.com")
        res = client.post("/calibration", json={"threshold": 0.48, "max_emg": 0.80},
                          headers=auth_headers(token))
        assert res.status_code == 200
        data = res.json()
        assert data["threshold"] == pytest.approx(0.48, abs=0.01)
        assert data["max_emg"] == pytest.approx(0.80, abs=0.01)
        assert "calibrated_at" in data

    def test_get_latest_calibration(self):
        token = register_and_login("cal2@example.com")
        client.post("/calibration", json={"threshold": 0.3, "max_emg": 0.5},
                    headers=auth_headers(token))
        client.post("/calibration", json={"threshold": 0.5, "max_emg": 0.9},
                    headers=auth_headers(token))
        res = client.get("/calibration/latest", headers=auth_headers(token))
        assert res.status_code == 200
        # Should return the most recent one
        assert res.json()["threshold"] == pytest.approx(0.5, abs=0.01)

    def test_calibration_404_if_none(self):
        token = register_and_login("cal3@example.com")
        res = client.get("/calibration/latest", headers=auth_headers(token))
        assert res.status_code == 404

    def test_calibration_clamped(self):
        """threshold and max_emg should be clamped to valid range by the endpoint."""
        token = register_and_login("cal4@example.com")
        res = client.post("/calibration", json={"threshold": 2.0, "max_emg": -1.0},
                          headers=auth_headers(token))
        assert res.status_code == 200
        data = res.json()
        assert data["threshold"] <= 0.95
        assert data["max_emg"] >= 0.1

    def test_calibration_requires_auth(self):
        res = client.post("/calibration", json={"threshold": 0.4, "max_emg": 0.7})
        assert res.status_code == 401

    def test_calibration_scoped_to_user(self):
        """User B should not see user A's calibration."""
        token_a = register_and_login("calA@example.com")
        token_b = register_and_login("calB@example.com")
        client.post("/calibration", json={"threshold": 0.6, "max_emg": 1.0},
                    headers=auth_headers(token_a))
        res_b = client.get("/calibration/latest", headers=auth_headers(token_b))
        assert res_b.status_code == 404


# ── Sensor status tests ───────────────────────────────────────────────────────

class TestSensorStatus:
    def test_status_endpoint(self):
        res = client.get("/api/status")
        assert res.status_code == 200
        data = res.json()
        assert "device_connected" in data
        assert data["device_connected"] is False   # no bridge in test env

    def test_latest_endpoint_no_data(self):
        res = client.get("/api/latest")
        # Either 200 with null/empty payload or 404 — both acceptable
        assert res.status_code in (200, 404)

    def test_health(self):
        res = client.get("/health")
        assert res.status_code == 200
        assert res.json()["status"] == "ok"
