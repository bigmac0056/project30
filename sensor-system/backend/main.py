"""
main.py
───────
FastAPI application entry point.

Start with:
  uvicorn main:app --host 0.0.0.0 --port 8000 --reload
"""
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import ALLOWED_ORIGINS
from routers.sensor import router as sensor_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [backend] %(levelname)s %(message)s",
    datefmt="%H:%M:%S",
)

app = FastAPI(
    title       = "Phantom Rehab — Sensor API",
    description = "Real-time Arduino sensor bridge for stroke rehabilitation",
    version     = "1.0.0",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins    = ALLOWED_ORIGINS,
    allow_methods    = ["*"],
    allow_headers    = ["*"],
    allow_credentials= True,
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(sensor_router)


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
