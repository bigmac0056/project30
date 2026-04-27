# Phantom Rehab — Arduino Sensor System

Real-time sensor data pipeline for stroke rehabilitation.

```
Arduino ──USB──► Python Bridge ──WebSocket──► FastAPI ──WebSocket──► React / React Native
```

---

## Folder Structure

```
sensor-system/
├── arduino/
│   └── sensor.ino          Arduino sketch (ECG / analog sensor)
├── bridge/
│   ├── bridge.py           Main bridge process
│   ├── serial_reader.py    Serial port wrapper with auto-reconnect
│   ├── config.py           Bridge settings (port, baudrate, WS URL)
│   └── requirements.txt
├── backend/
│   ├── main.py             FastAPI app
│   ├── config.py           Backend settings
│   ├── manager.py          WebSocket connection manager
│   ├── models.py           Pydantic schemas
│   ├── routers/
│   │   └── sensor.py       /ws/device  /ws/client  /api/status
│   └── requirements.txt
├── web/
│   └── src/
│       ├── hooks/useSensor.js          WebSocket hook
│       └── components/
│           ├── DeviceStatus.jsx        Connection status UI
│           ├── SensorDisplay.jsx       Live readout + canvas waveform
│           └── RehabGame.jsx           Squeeze-to-lift game
└── mobile/
    └── src/
        ├── hooks/useSensor.js          WebSocket hook (React Native)
        └── components/
            ├── DeviceStatus.js
            ├── SensorDisplay.js
            └── RehabGame.js            Same game, native Animated API
```

---

## Step-by-step Setup

### 1 — Arduino

1. Open `arduino/sensor.ino` in the Arduino IDE.
2. Select your board (e.g. **Arduino Uno**) and the correct COM port.
3. Upload the sketch.
4. Open Serial Monitor at **9600 baud** and verify you see JSON lines:
   ```
   {"ecg":512,"norm":0.5005,"v":2.500,"ms":4230}
   ```
5. Close Serial Monitor — the bridge needs exclusive access to the port.

---

### 2 — Python Bridge

```bash
cd sensor-system/bridge
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Edit `config.py`:
```python
"serial_port": "/dev/tty.usbmodem14101",   # your port
"ws_url"     : "ws://localhost:8000/ws/device",
```

Find your Arduino port:
- **macOS / Linux**: `ls /dev/tty.*` or `ls /dev/ttyACM*`
- **Windows**: Device Manager → Ports (COM & LPT)

---

### 3 — Backend

```bash
cd sensor-system/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Test health check:
```bash
curl http://localhost:8000/health
# → {"status":"ok"}
```

---

### 4 — Start the Bridge

```bash
cd sensor-system/bridge
python bridge.py
```

Expected log output:
```
12:00:01 [bridge] Connecting to backend: ws://localhost:8000/ws/device
12:00:01 [bridge] Backend WebSocket connected ✓
12:00:01 [serial] opened /dev/tty.usbmodem14101 @ 9600 baud
```

Check device status:
```bash
curl http://localhost:8000/api/status
# → {"device_connected":true,"client_count":0,...}
```

---

### 5 — React Web

In your existing React app, add the hook and components from `web/src/`.

Minimal usage in any component:
```jsx
import { useSensor }    from './hooks/useSensor';
import DeviceStatus     from './components/DeviceStatus';
import SensorDisplay    from './components/SensorDisplay';
import RehabGame        from './components/RehabGame';

export default function App() {
  const { wsConnected, deviceConnected, sensorData } = useSensor();

  return (
    <div>
      <DeviceStatus wsConnected={wsConnected} deviceConnected={deviceConnected} />
      <SensorDisplay sensorData={sensorData} deviceConnected={deviceConnected} />
      <RehabGame     sensorData={sensorData} deviceConnected={deviceConnected} />
    </div>
  );
}
```

Set your backend URL in `.env`:
```
REACT_APP_WS_URL=ws://localhost:8000/ws/client
```

---

### 6 — React Native (Mobile)

1. Copy `mobile/src/hooks/useSensor.js` and `mobile/src/components/` into your project.

2. **Edit the WS URL** — iPhone cannot use `localhost`:
   ```js
   // mobile/src/hooks/useSensor.js
   const WS_URL = 'ws://192.168.1.100:8000/ws/client';
   //                   ↑ your laptop's LAN IP
   ```
   Find your IP: `ifconfig | grep "inet "` (macOS) or `ipconfig` (Windows)

3. Your laptop and iPhone must be on the **same Wi-Fi network**.

4. Drop components into any screen:
   ```jsx
   import { useSensor }  from '../hooks/useSensor';
   import DeviceStatus   from '../components/DeviceStatus';
   import SensorDisplay  from '../components/SensorDisplay';
   import RehabGame      from '../components/RehabGame';

   export default function SensorScreen() {
     const { wsConnected, deviceConnected, sensorData } = useSensor();
     return (
       <SafeAreaView>
         <DeviceStatus wsConnected={wsConnected} deviceConnected={deviceConnected} />
         <SensorDisplay sensorData={sensorData} deviceConnected={deviceConnected} />
         <RehabGame     sensorData={sensorData} deviceConnected={deviceConnected} />
       </SafeAreaView>
     );
   }
   ```

---

## WebSocket Message Reference

### Bridge → Backend (`/ws/device`)

```json
{
  "type": "data",
  "payload": { "ecg": 512, "norm": 0.5005, "v": 2.5, "ms": 4230 },
  "ts": 1714300000.123
}
```
Authentication: HTTP header `X-Device-Token: phantom-bridge-secret`

### Backend → Clients (`/ws/client`)

**On connect / device status change:**
```json
{ "type": "device_status", "connected": true, "latest": { ... } }
```

**Every sensor reading (~50 Hz):**
```json
{ "type": "sensor_data", "payload": { "ecg": 512, "norm": 0.5005, "v": 2.5 }, "ts": 1714300000.123 }
```

---

## REST Endpoints

| Method | Path          | Description                              |
|--------|---------------|------------------------------------------|
| GET    | /health       | Health check → `{"status":"ok"}`         |
| GET    | /api/status   | Device + client count + last reading     |
| GET    | /api/latest   | Most recent sensor payload               |

---

## Integrating Real Sensor Data into Existing Games

Your existing games use touch simulation (onPressIn / onPressOut). Replace:

```js
// BEFORE (simulated)
onPressIn  = () => { emgRef.current = 0.8; }
onPressOut = () => { emgRef.current = 0; }

// AFTER (real sensor)
const { sensorData } = useSensor();
useEffect(() => {
  emgRef.current = sensorData?.norm ?? 0;
}, [sensorData]);
```

The `norm` field is already 0.0–1.0, matching the existing game thresholds.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `cannot open /dev/tty…` | Wrong port in `bridge/config.py`. Check with `ls /dev/tty.*` |
| `device_connected: false` | Bridge not running, or wrong token |
| iPhone can't connect | Use laptop LAN IP, not `localhost`. Same Wi-Fi required. |
| `EACCES` on serial port (Linux) | `sudo usermod -a -G dialout $USER` then re-login |
| Data but no game response | Check `norm` field: should be `0.0–1.0`. Adjust Arduino sketch if needed |
| High latency | Lower `SAMPLE_MS` in Arduino sketch (min ~10ms / 100 Hz) |
