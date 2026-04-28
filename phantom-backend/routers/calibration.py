"""
routers/calibration.py — phantom-backend
──────────────────────────────────────────
Calibration endpoints — save and retrieve a user's EMG calibration.

POST /calibration        — save a new calibration reading
GET  /calibration/latest — get the most recent calibration for this user
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
from auth import get_current_user

router = APIRouter(prefix="/calibration", tags=["calibration"])


@router.post("", response_model=schemas.CalibrationOut)
def save_calibration(
    body: schemas.CalibrationCreate,
    db  : Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    """
    Save a new calibration for the current user.
    threshold   — normalised EMG value (0–1) at 60 % of peak; used as game activation threshold
    max_emg     — normalised peak reading observed during calibration
    """
    c = models.Calibration(
        user_id   = user.id,
        threshold = max(0.05, min(0.95, body.threshold)),
        max_emg   = max(0.1,  min(1.0,  body.max_emg)),
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


@router.get("/latest", response_model=schemas.CalibrationOut)
def get_latest_calibration(
    db  : Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    """
    Returns the most recent calibration for this user, or 404 if none saved yet.
    Games use this to set their activation threshold.
    """
    c = (
        db.query(models.Calibration)
        .filter(models.Calibration.user_id == user.id)
        .order_by(models.Calibration.calibrated_at.desc())
        .first()
    )
    if not c:
        raise HTTPException(status_code=404, detail="No calibration found — run calibration first")
    return c
