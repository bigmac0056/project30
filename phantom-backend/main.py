"""
main.py — phantom-backend
───────────────────────────
Single FastAPI application that serves:
  • auth + users + sessions + calibration (REST, JWT-protected)
  • real-time sensor WebSocket (/ws/device, /ws/client)
  • sensor status REST (/api/status, /api/latest)

Start on the bridge laptop:
  uvicorn main:app --host 0.0.0.0 --port 8000 --reload

Copy .env.example → .env and set your values before starting.
"""
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import ALLOWED_ORIGINS
from database import engine
import models
from routers import auth_router, users, sessions
from routers.calibration import router as calibration_router
from routers.sensor import router as sensor_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [backend] %(levelname)s %(message)s",
    datefmt="%H:%M:%S",
)

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title       = "Phantom EMG API",
    description = "Rehab backend — auth, sessions, calibration, real-time sensor WebSocket",
    version     = "1.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins     = ALLOWED_ORIGINS,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
    allow_credentials = True,
)

# ── REST routers ──────────────────────────────────────────────────────────────
app.include_router(auth_router.router)
app.include_router(users.router)
app.include_router(sessions.router)
app.include_router(calibration_router)

# ── Sensor WebSocket + status REST ───────────────────────────────────────────
app.include_router(sensor_router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
