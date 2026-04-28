"""
sensor-system/backend/config.py
─────────────────────────────────
Standalone sensor backend configuration (used when running sensor-system/backend
independently for testing/demo). Production deployments use phantom-backend instead.
"""
import os

DEVICE_TOKEN  : str       = os.environ.get("DEVICE_TOKEN",  "phantom-bridge-secret")
_orig         : str       = os.environ.get("ALLOWED_ORIGINS", "*")
ALLOWED_ORIGINS: list[str] = (
    ["*"] if _orig == "*"
    else [o.strip() for o in _orig.split(",") if o.strip()]
)
