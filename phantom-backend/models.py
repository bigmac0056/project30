from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    amputation_level = Column(String, default="")
    weeks_to_fitting = Column(Integer, default=16)
    created_at = Column(DateTime, default=datetime.utcnow)

    sessions = relationship("GameSession", back_populates="user")
    calibrations = relationship("Calibration", back_populates="user")


class GameSession(Base):
    __tablename__ = "game_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    game = Column(String, nullable=False)  # Sparrow | PulseRun | SteadyClimb
    score = Column(Integer, default=0)
    duration_sec = Column(Integer, default=0)
    emg_peak = Column(Float, default=0.0)
    emg_avg = Column(Float, default=0.0)
    activation_score = Column(Float, default=0.0)
    precision_score = Column(Float, default=0.0)
    dosing_score = Column(Float, default=0.0)
    played_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="sessions")


class Calibration(Base):
    __tablename__ = "calibrations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    threshold = Column(Float, default=0.42)
    max_emg = Column(Float, default=1.0)
    calibrated_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="calibrations")
