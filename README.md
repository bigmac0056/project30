# Phantom — EMG Rehabilitation App

A full-stack rehabilitation system for stroke patients and amputees. Patients train their residual limb muscles through biofeedback games, preparing for a bionic prosthetic.

```
Arduino ──USB──► Bridge laptop ──────────────────────────────────────────┐
                 (Python bridge)    (FastAPI, port 8000)                  │
                      │                   │                               │
                 serial read         REST API + WebSocket                 │
                      └──► /ws/device ──►  /ws/client ◄──────────────────┤
                                                │                         │
                                    React Native (phone, Wi-Fi) ◄────────┘
                                    React Web (desktop game, Wi-Fi)
```

**One backend, one port.** The same FastAPI process handles auth/sessions/calibration (REST) and real-time sensor data (WebSocket). The bridge laptop runs both the backend and the Python serial bridge.

---

## Project Structure

```
insult-project/
├── phantom-backend/          FastAPI — REST + JWT + sensor WebSocket (unified)
│   ├── main.py               App factory + router mount
│   ├── config.py             All settings from env vars
│   ├── manager.py            ConnectionManager (WS fan-out)
│   ├── routers/
│   │   ├── auth_router.py    POST /auth/register, /auth/login
│   │   ├── users.py          GET/PATCH /users/me
│   │   ├── sessions.py       POST /sessions, GET /sessions, GET /sessions/progress
│   │   ├── calibration.py    POST /calibration, GET /calibration/latest
│   │   └── sensor.py         WS /ws/device, WS /ws/client, GET /api/status
│   └── tests/
│       └── test_api.py       pytest — auth, sessions, calibration, sensor status
│
├── sensor-system/
│   ├── arduino/              Arduino IDE sketch (.ino) — reads EMG sensor
│   └── bridge/               Python serial-to-WebSocket bridge
│       ├── bridge.py         Main loop (serial → WS → backend)
│       ├── serial_reader.py  Thin pyserial wrapper with JSON parsing
│       ├── config.py         All settings from env vars
│       └── tests/
│           └── test_bridge.py  pytest — SerialReader unit tests
│
├── phantom-mobile/           Expo React Native app (iOS / Android)
│   └── src/
│       ├── config.js         BASE_URL + WS_URL from EXPO_PUBLIC_* env vars
│       ├── hooks/useSensor.js  WS hook — exposes wsConnected, deviceConnected, sensorData
│       ├── services/api.js   All REST calls (auth, sessions, calibration)
│       └── screens/          Game screens + CalibrationScreen + ProgressScreen …
│
├── phantom-desktop-games/    Vite + React — browser-based games
│   └── src/
│       ├── hooks/useSensor.js  Same WS hook (reads VITE_WS_URL)
│       ├── App.jsx           Launcher with live sensor status badge
│       └── games/            Sparrow, PulseRun, SteadyClimb — sensor-wired
│
└── components/               Shared design assets / mockup frames
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile app | Expo SDK 54 · React Native 0.81 |
| Navigation | React Navigation 6 (stack + bottom tabs) |
| Auth | JWT (python-jose) · AsyncStorage token persistence |
| Backend | FastAPI · SQLAlchemy · SQLite (swap to Postgres for prod) |
| Real-time | WebSocket (`/ws/device` for bridge · `/ws/client` for apps) |
| Bridge | Python · pyserial · websockets |
| Arduino | EMG sensor → JSON over Serial at 9600 baud |
| Fonts | Space Grotesk · JetBrains Mono |

---

## Deployment Flow (bridge laptop)

Everything runs on one laptop connected to the Arduino via USB. Phones and desktops connect over Wi-Fi.

```
Bridge laptop
├── uvicorn main:app --host 0.0.0.0 --port 8000   (phantom-backend)
└── python bridge.py                                (sensor-system/bridge)

Phone / desktop (same Wi-Fi network)
└── connects to http://LAPTOP_IP:8000  (REST)
    and         ws://LAPTOP_IP:8000/ws/client  (live sensor)
```

---

## Setup

### 1. Find your laptop's LAN IP

```bash
# macOS / Linux
ip route get 1 | awk '{print $7; exit}'
# or
hostname -I | awk '{print $1}'

# Windows (PowerShell)
(Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias Wi-Fi).IPAddress
```

Use this IP everywhere below. We'll call it `LAPTOP_IP`.

---

### 2. Backend (unified REST + WebSocket)

```bash
cd phantom-backend
cp .env.example .env           # edit SECRET_KEY, DEVICE_TOKEN, ALLOWED_ORIGINS
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Health check:**
```bash
curl http://localhost:8000/health   # → {"status":"ok"}
curl http://localhost:8000/api/status  # → {"device_connected":false,...}
```

`phantom-backend/.env.example`:
```
SECRET_KEY=change-me-to-a-random-32-char-string
DEVICE_TOKEN=bridge-secret-token
DATABASE_URL=sqlite:///./phantom.db
ALLOWED_ORIGINS=*
```

---

### 3. Arduino sketch

Open `sensor-system/arduino/sensor.ino` in Arduino IDE 2.x.
Select your board (e.g. Arduino Uno) and the correct port, then upload.

Expected Serial output at **9600 baud**:
```json
{"ecg":512,"norm":0.5005,"v":2.500,"ms":4230}
```

- `ecg` — raw ADC value (0–1023)
- `norm` — normalised 0.0–1.0 (used directly as game input)
- `v` — voltage in volts
- `ms` — millis() timestamp

---

### 4. Python bridge (serial → backend WebSocket)

```bash
cd sensor-system/bridge
cp .env.example .env      # set SERIAL_PORT + DEVICE_TOKEN (must match backend .env)
pip install -r requirements.txt
python bridge.py
```

**Find your serial port:**

| OS | Command |
|---|---|
| macOS | `ls /dev/tty.*` → usually `/dev/tty.usbmodem*` |
| Linux | `ls /dev/ttyACM*` → usually `/dev/ttyACM0` |
| Windows | Device Manager → Ports (COM & LPT) |

`sensor-system/bridge/.env.example`:
```
SERIAL_PORT=/dev/ttyACM0
BAUDRATE=9600
WS_URL=ws://localhost:8000/ws/device
DEVICE_TOKEN=bridge-secret-token
SAMPLE_HZ=50
```

---

### 5. Mobile app (Expo)

```bash
cd phantom-mobile
cp .env.example .env       # set EXPO_PUBLIC_API_URL and EXPO_PUBLIC_WS_URL
npm install
npx expo start
```

Scan the QR code with **Expo Go** on your phone. Your phone must be on the **same Wi-Fi** as the bridge laptop.

`phantom-mobile/.env.example`:
```
EXPO_PUBLIC_API_URL=http://192.168.1.x:8000
EXPO_PUBLIC_WS_URL=ws://192.168.1.x:8000/ws/client
```

---

### 6. Desktop games (Vite)

```bash
cd phantom-desktop-games
cp .env.example .env       # set VITE_WS_URL
npm install
npm run dev                # opens at http://localhost:5173
```

`phantom-desktop-games/.env.example`:
```
VITE_WS_URL=ws://192.168.1.x:8000/ws/client
```

---

## EMG Input — Sensor vs Touch Fallback

All game screens and the calibration screen automatically select the input source:

| State | Input |
|---|---|
| `deviceConnected = true` | Live `sensorData.norm` (0–1) from Arduino |
| `deviceConnected = false, wsConnected = true` | Touch / keyboard simulation + disconnect overlay |
| `wsConnected = false` | Touch / keyboard simulation (backend unreachable — silent) |

**Only when `wsConnected && !deviceConnected`** does the game pause and show the "Device disconnected" overlay. If the backend is simply unreachable (offline dev), the app stays in silent touch mode.

**Auto-start:** When `sensorData.norm > 0.15` fires while a game is in `idle` phase, the game starts automatically — no screen tap needed.

---

## Calibration

The calibration screen captures the user's **maximum voluntary contraction**, then sets:

```
threshold = peak * 0.60
```

The result is saved via `POST /calibration` (not as a game session).

**Sensor mode** (device connected): watch the live EMG bar rise, press "Захватить пик" at maximum contraction.  
**Touch fallback** (no device): press and hold the touch target to simulate the signal, release to capture.

The saved calibration is retrieved via `GET /calibration/latest` — future game screens can use this to adapt their THRESHOLD dynamically.

---

## API Reference

### Auth
| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/auth/register` | `{email, name, password, amputation_level?, weeks_to_fitting?}` | `{access_token, user}` |
| POST | `/auth/login` | `{email, password}` | `{access_token, user}` |

### Users
| Method | Path | Returns |
|---|---|---|
| GET | `/users/me` | User object |
| PATCH | `/users/me` | Updated user |

### Sessions
| Method | Path | Returns |
|---|---|---|
| POST | `/sessions` | Created session |
| GET | `/sessions` | Last 50 sessions |
| GET | `/sessions/progress` | Streak, skill avgs, daily chart |

### Calibration
| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/calibration` | `{threshold, max_emg}` | Calibration record |
| GET | `/calibration/latest` | — | Most recent calibration or 404 |

### Sensor (real-time)
| Type | Path | Description |
|---|---|---|
| WebSocket | `/ws/device` | Bridge → backend (`X-Device-Token` header required) |
| WebSocket | `/ws/client` | Apps ← receive live sensor data |
| GET | `/api/status` | `{device_connected, clients_connected, latest}` |
| GET | `/api/latest` | Last sensor reading |
| GET | `/health` | `{"status":"ok"}` |

---

## WebSocket Message Format

**Backend → clients (fan-out):**
```json
// On client connect or device state change:
{"type":"device_status","connected":true,"latest":{"ecg":512,"norm":0.5,"v":2.5,"ms":12345}}

// Every sensor reading (~50 Hz):
{"type":"sensor_data","payload":{"ecg":512,"norm":0.5,"v":2.5,"ms":12345},"ts":1714300000.1}
```

**Bridge → backend (`/ws/device`):**
```json
{"type":"data","payload":{"ecg":512,"norm":0.5,"v":2.5,"ms":12345},"ts":1714300000.1}
```

---

## Games

| Game | Skill | Mechanic | Input |
|---|---|---|---|
| **Sparrow** | Activation | Hold squeeze → bird flies; release → falls | `norm > THRESHOLD` → lift |
| **Pulse Run** | Impulse precision | Sharp contraction → jump over obstacles | `norm > THRESHOLD` → jump trigger |
| **Steady Climb** | Force dosing | Keep signal in target zone (30–68 % of max) | `norm ∈ [TARGET_MIN, TARGET_MAX]` → score |

All games record: score, duration, EMG peak, EMG average, activation/precision/dosing skill scores.

---

## Running Tests

**Backend (from `phantom-backend/`):**
```bash
pip install pytest httpx
pytest tests/ -v
```

**Bridge (from `sensor-system/bridge/`):**
```bash
pip install pytest
pytest tests/ -v
```

No hardware required — tests use in-memory SQLite and pyserial mocks.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| "Cannot connect to server" on phone | Use LAN IP (not `localhost`). Phone and laptop must be on same Wi-Fi. |
| `EACCES` on serial port (Linux) | `sudo usermod -a -G dialout $USER` then re-login |
| `permission denied` on serial (macOS) | Run bridge from Terminal, not an IDE terminal |
| Serial port busy | Close Arduino IDE Serial Monitor before running bridge |
| WS sensor pill shows "SIM" | Backend not reachable, or bridge not running. Check `.env` IPs. |
| `DEVICE_TOKEN` mismatch | Backend `.env` and bridge `.env` must have same token value |
| PDF share not available | Runs on device only — simulator has no share sheet |
| Expo SDK mismatch | `cd phantom-mobile && npx expo install --fix` |

---

## Environment Requirements

- Python 3.11+ (3.13 works)
- Node.js 18+
- Expo Go on your phone (iOS / Android)
- Arduino IDE 2.x for uploading the sketch

---

## License

MIT
