/**
 * useSensor.js  (React Native)
 * ─────────────────────────────
 * Identical logic to the web version.
 * React Native ships its own WebSocket API, so no extra libraries needed.
 *
 * IMPORTANT: Change WS_URL to your laptop's LAN IP.
 *   iPhone cannot use "localhost" — it must reach the backend over Wi-Fi.
 *
 * Usage:
 *   const { wsConnected, deviceConnected, sensorData } = useSensor();
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// ← Replace with your laptop's local IP address
const WS_URL = 'ws://192.168.1.100:8000/ws/client';

const RECONNECT_DELAY_MS = 3000;

export function useSensor() {
  const [wsConnected,     setWsConnected]     = useState(false);
  const [deviceConnected, setDeviceConnected] = useState(false);
  const [sensorData,      setSensorData]      = useState(null);

  const wsRef          = useRef(null);
  const reconnectTimer = useRef(null);
  const alive          = useRef(true);

  const connect = useCallback(() => {
    if (!alive.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!alive.current) return;
      setWsConnected(true);
      clearTimeout(reconnectTimer.current);
    };

    ws.onmessage = ({ data }) => {
      if (!alive.current) return;
      try {
        const msg = JSON.parse(data);

        if (msg.type === 'device_status') {
          setDeviceConnected(msg.connected);
          if (msg.latest) setSensorData(msg.latest);

        } else if (msg.type === 'sensor_data') {
          setSensorData(msg.payload);
        }
      } catch {
        // ignore malformed frames
      }
    };

    ws.onerror = () => ws.close();

    ws.onclose = () => {
      if (!alive.current) return;
      setWsConnected(false);
      setDeviceConnected(false);
      reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY_MS);
    };
  }, []);

  useEffect(() => {
    alive.current = true;
    connect();
    return () => {
      alive.current = false;
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { wsConnected, deviceConnected, sensorData };
}
