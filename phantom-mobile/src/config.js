/**
 * config.js
 * ──────────
 * All deployment-specific values in one place.
 *
 * In Expo SDK 49+, set EXPO_PUBLIC_* variables in a .env file and they are
 * automatically available via process.env.EXPO_PUBLIC_*.
 *
 * Copy .env.example → .env and set your bridge laptop's LAN IP.
 *
 * Finding your bridge laptop's IP:
 *   macOS/Linux : ip route get 1 | awk '{print $7}'  OR  hostname -I
 *   Windows     : ipconfig | findstr "IPv4"
 */

// REST API base URL — phantom-backend on the bridge laptop
export const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.0.1:8000';

// WebSocket URL for live sensor data (same backend, different path)
export const WS_URL =
  process.env.EXPO_PUBLIC_WS_URL ?? `ws://${(BASE_URL.replace(/^https?:\/\//, ''))}/ws/client`;

/**
 * Default activation threshold (0–1).
 * This is overridden at runtime by the user's saved calibration from the API.
 */
export const DEFAULT_THRESHOLD = 0.35;
