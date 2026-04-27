from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from database import get_db
import models, schemas
from auth import get_current_user

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post("", response_model=schemas.SessionOut)
def create_session(
    body: schemas.SessionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    s = models.GameSession(user_id=current_user.id, **body.model_dump())
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


@router.get("", response_model=list[schemas.SessionOut])
def list_sessions(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return (
        db.query(models.GameSession)
        .filter(
            models.GameSession.user_id == current_user.id,
            models.GameSession.game != '_calibration',
        )
        .order_by(models.GameSession.played_at.desc())
        .limit(limit)
        .all()
    )


@router.get("/progress", response_model=schemas.ProgressOut)
def get_progress(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    now = datetime.utcnow()
    week_start = now - timedelta(days=7)
    prev_week_start = now - timedelta(days=14)

    all_sessions = (
        db.query(models.GameSession)
        .filter(
            models.GameSession.user_id == current_user.id,
            models.GameSession.game != '_calibration',
        )
        .order_by(models.GameSession.played_at.desc())
        .all()
    )

    week_sessions = [s for s in all_sessions if s.played_at >= week_start]
    prev_sessions = [s for s in all_sessions if prev_week_start <= s.played_at < week_start]

    week_minutes = sum(s.duration_sec for s in week_sessions) // 60
    prev_minutes = sum(s.duration_sec for s in prev_sessions) // 60
    pct = int(((week_minutes - prev_minutes) / max(prev_minutes, 1)) * 100)

    # Skills avg (last 20 sessions)
    recent = all_sessions[:20]

    def avg(lst, field):
        vals = [getattr(s, field) for s in lst if getattr(s, field) > 0]
        return round(sum(vals) / max(len(vals), 1), 1)

    def avg_delta(recent_lst, field):
        half = max(len(recent_lst) // 2, 1)
        new_half = recent_lst[:half]
        old_half = recent_lst[half:]
        new_avg = avg(new_half, field)
        old_avg = avg(old_half, field)
        return round(new_avg - old_avg, 1)

    # Daily minutes for last 7 days
    daily = []
    for i in range(6, -1, -1):
        day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0)
        day_end = day_start + timedelta(days=1)
        mins = sum(
            s.duration_sec for s in all_sessions
            if day_start <= s.played_at < day_end
        ) // 60
        daily.append(mins)

    # Streak
    streak = 0
    check_day = now.date()
    session_dates = {s.played_at.date() for s in all_sessions}
    while check_day in session_dates:
        streak += 1
        check_day -= timedelta(days=1)

    weeks_elapsed = max(1, (now - current_user.created_at).days // 7)

    return schemas.ProgressOut(
        total_sessions=len(all_sessions),
        total_minutes=sum(s.duration_sec for s in all_sessions) // 60,
        streak_days=streak,
        week_minutes=week_minutes,
        week_minutes_prev=prev_minutes,
        week_pct_change=pct,
        activation_avg=avg(recent, "activation_score"),
        precision_avg=avg(recent, "precision_score"),
        dosing_avg=avg(recent, "dosing_score"),
        activation_delta=avg_delta(recent, "activation_score"),
        precision_delta=avg_delta(recent, "precision_score"),
        dosing_delta=avg_delta(recent, "dosing_score"),
        daily_minutes=daily,
        current_week=weeks_elapsed,
    )
