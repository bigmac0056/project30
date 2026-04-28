"""
config.py — phantom-backend
────────────────────────────
All sensitive/deployment values come from environment variables.
Defaults allow the server to start in development without a .env file.

Copy .env.example → .env and fill in real values for production.
"""
import os

# ── JWT ───────────────────────────────────────────────────────────────────────
SECRET_KEY  : str = os.environ.get("SECRET_KEY",    "phantom-emg-secret-key-change-in-production")
ALGORITHM   : str = "HS256"
TOKEN_DAYS  : int = int(os.environ.get("TOKEN_DAYS", "30"))

# ── Bridge auth ───────────────────────────────────────────────────────────────
# Must match DEVICE_TOKEN in sensor-system/bridge/.env (or config.py fallback)
DEVICE_TOKEN: str = os.environ.get("DEVICE_TOKEN",  "phantom-bridge-secret")

# ── Database ──────────────────────────────────────────────────────────────────
DATABASE_URL: str = os.environ.get("DATABASE_URL",  "sqlite:///./phantom.db")

# ── CORS ──────────────────────────────────────────────────────────────────────
_origins_raw: str = os.environ.get("ALLOWED_ORIGINS", "*")
ALLOWED_ORIGINS: list[str] = (
    ["*"] if _origins_raw == "*"
    else [o.strip() for o in _origins_raw.split(",") if o.strip()]
)
