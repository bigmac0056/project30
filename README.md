# Phantom — EMG Rehabilitation App

A full-stack rehabilitation system for stroke patients and amputees. Patients train their residual limb muscles through biofeedback games — preparing for a bionic prosthetic.

```
Arduino Sensor ──USB──► Python Bridge ──WS──► FastAPI ──WS──► React Native App
                                                   └──────────────► React Web (desktop)
```

---

## Project Structure

```
insult-project/
├── phantom-backend/        FastAPI REST + JWT auth + session tracking
├── phantom-mobile/         Expo React Native app (iOS / Android)
├── phantom-desktop-games/  Web-based game prototypes
├── sensor-system/          Arduino → real-time sensor pipeline
│   ├── arduino/            Sensor sketch (.ino)
│   ├── bridge/             Python serial-to-WebSocket bridge
│   ├── backend/            Standalone FastAPI for real-time sensor streaming
│   ├── web/                React hooks + components for live sensor data
│   └── mobile/             React Native hooks + components for live sensor data
└── components/             Shared design assets / frames
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile app | Expo SDK 54 · React Native 0.81 |
| Navigation | React Navigation 6 (stack + bottom tabs) |
| Auth | JWT (python-jose) · AsyncStorage token persistence |
| Backend | FastAPI · SQLAlchemy · SQLite |
| Password hashing | PBKDF2-HMAC-SHA256 (native Python hashlib) |
| PDF reports | expo-print · expo-sharing |
| Real-time sensor | WebSocket · pyserial |
| Fonts | Space Grotesk · JetBrains Mono |

---

## Quick Start

### 1. Backend (REST API)

```bash
cd phantom-backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

> **Health check:** `curl http://localhost:8000/health` → `{"status":"ok"}`

**Edit the IP in mobile app** — `phantom-mobile/src/services/api.js`:
```js
export const BASE_URL = 'http://YOUR_LAPTOP_IP:8000';
```

---

### 2. Mobile App

```bash
cd phantom-mobile
npm install
npx expo start
```

Scan the QR code with **Expo Go** (iOS / Android). Make sure your phone and laptop are on the **same Wi-Fi**.

---

### 3. Sensor Bridge (Arduino → App)

Only needed when connecting a real Arduino EMG/ECG sensor.

**a) Upload the sketch**

Open `sensor-system/arduino/sensor.ino` in Arduino IDE, select your board and port, upload.

Expected Serial output at 9600 baud:
```
{"ecg":512,"norm":0.5005,"v":2.500,"ms":4230}
```

**b) Start the backend**
```bash
cd sensor-system/backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

**c) Start the bridge**
```bash
cd sensor-system/bridge
pip install -r requirements.txt
# Edit serial_port in config.py first!
python bridge.py
```

**d) Find your serial port**

| OS | Command |
|---|---|
| macOS | `ls /dev/tty.*` |
| Linux | `ls /dev/ttyACM*` |
| Windows | Device Manager → Ports (COM & LPT) |

---

## Features

### Auth Flow
- **Register** with name, email, password, amputation level
- **Login** → JWT stored in AsyncStorage → auto-restored on next launch
- Profile editing (name, amputation level, weeks to fitting)
- Logout with confirmation

### Games
All games use EMG signal (simulated via touch, or real Arduino sensor):

| Game | Skill trained | Mechanic |
|---|---|---|
| **Sparrow** | Muscle activation | Hold squeeze → bird flies, release → bird falls |
| **Pulse Run** | Impulse precision | Short contractions → jump over obstacles |
| **Steady Climb** | Force dosing | Keep signal in narrow target range |

- Adjustable difficulty (Beginner / Advanced)
- Each session saves: score, duration, EMG peak/avg, skill scores
- Post-game Results screen with EMG wave chart

### Progress Tracking
- 7-day bar chart (daily minutes)
- Streak counter
- 3 skill bars with delta vs previous sessions
- Week-over-week % change
- Pull-to-refresh

### Doctor PDF Report
- Generates a real PDF from live API data
- Includes: patient info, 7-day summary, skill bars, notes
- Native share sheet (iOS / Android)

### Real-time Sensor (Arduino)
- 50 Hz data stream: Arduino → Python bridge → FastAPI WebSocket → app
- Auto-reconnects on serial disconnect or network drop
- Device status indicator (connected / not connected)
- Drop-in hook: `const { sensorData, deviceConnected } = useSensor()`

---

## API Reference

### Auth
| Method | Endpoint | Body | Returns |
|---|---|---|---|
| POST | `/auth/register` | `{email, name, password, amputation_level?, weeks_to_fitting?}` | `{access_token, user}` |
| POST | `/auth/login` | `{email, password}` | `{access_token, user}` |

### Users
| Method | Endpoint | Returns |
|---|---|---|
| GET | `/users/me` | User object |
| PATCH | `/users/me` | Updated user |

### Sessions
| Method | Endpoint | Returns |
|---|---|---|
| POST | `/sessions` | Created session |
| GET | `/sessions` | List (last 50, no calibration) |
| GET | `/sessions/progress` | Streak, skill avgs, daily chart |

### Sensor (sensor-system/backend)
| Type | Endpoint | Description |
|---|---|---|
| WebSocket | `/ws/device` | Bridge → backend (auth token required) |
| WebSocket | `/ws/client` | App → receive live data |
| GET | `/api/status` | Device + client count |
| GET | `/api/latest` | Last sensor reading |
| GET | `/health` | Health check |

---

## WebSocket Message Format

**From backend to clients:**
```json
// On connect or device state change:
{ "type": "device_status", "connected": true, "latest": {...} }

// Every sensor reading (~50 Hz):
{ "type": "sensor_data", "payload": { "ecg": 512, "norm": 0.5005, "v": 2.5 }, "ts": 1714300000.1 }
```

---

## Integrating Real Sensor into Games

The existing games use touch simulation. To switch to real Arduino data:

```js
// In any game screen:
import { useSensor } from '../hooks/useSensor';  // sensor-system/mobile/src/hooks

const { sensorData, deviceConnected } = useSensor();

useEffect(() => {
  // norm is already 0.0–1.0, same scale the games expect
  emgRef.current = sensorData?.norm ?? 0;
}, [sensorData]);
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| "Cannot connect to server" on iPhone | Use laptop LAN IP, not `localhost`. Same Wi-Fi required. |
| `EACCES` on serial port (Linux) | `sudo usermod -a -G dialout $USER` then re-login |
| Expo SDK mismatch | `cd phantom-mobile && npx expo install --fix` |
| `python-jose` or `bcrypt` error on Python 3.13 | Already fixed — uses native `hashlib.pbkdf2_hmac` |
| Serial port busy | Close Arduino IDE Serial Monitor before running bridge |
| PDF share not available | Runs on device only — simulator has no share sheet |

---

## Environment

- Python 3.11+ recommended (3.13 works)
- Node.js 18+
- Expo Go app on your phone
- Arduino IDE 2.x for uploading the sketch

---

## License

MIT
