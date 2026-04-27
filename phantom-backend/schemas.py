from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


class UserRegister(BaseModel):
    email: EmailStr
    name: str
    password: str
    amputation_level: Optional[str] = ""
    weeks_to_fitting: Optional[int] = 16


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: str
    name: str
    amputation_level: str
    weeks_to_fitting: int
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class UserUpdate(BaseModel):
    name: Optional[str] = None
    amputation_level: Optional[str] = None
    weeks_to_fitting: Optional[int] = None


class SessionCreate(BaseModel):
    game: str
    score: int
    duration_sec: int
    emg_peak: float = 0.0
    emg_avg: float = 0.0
    activation_score: float = 0.0
    precision_score: float = 0.0
    dosing_score: float = 0.0


class SessionOut(BaseModel):
    id: int
    game: str
    score: int
    duration_sec: int
    emg_peak: float
    emg_avg: float
    activation_score: float
    precision_score: float
    dosing_score: float
    played_at: datetime

    model_config = {"from_attributes": True}


class ProgressOut(BaseModel):
    total_sessions: int
    total_minutes: int
    streak_days: int
    week_minutes: int
    week_minutes_prev: int
    week_pct_change: int
    activation_avg: float
    precision_avg: float
    dosing_avg: float
    activation_delta: float
    precision_delta: float
    dosing_delta: float
    daily_minutes: list[int]
    current_week: int
