"""
Backend configuration.
In production, load these from environment variables.
"""

# Secret token the bridge must send in the X-Device-Token header.
# Must match BRIDGE_CONFIG["device_token"] in bridge/config.py
DEVICE_TOKEN = "phantom-bridge-secret"

# CORS origins allowed to connect (React dev server, production URL, etc.)
ALLOWED_ORIGINS = ["*"]
