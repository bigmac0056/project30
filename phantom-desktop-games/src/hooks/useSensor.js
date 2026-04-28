/**
 * useSensor.js — phantom-desktop-games
 * ──────────────────────────────────────
 * WebSocket hook that connects to the unified backend and exposes live EMG data.
 *
 * Env var: VITE_WS_URL   (e.g. ws://192.168.1.x:8000/ws/client)
 * Falls back to localhost if not set.
 *
 * Returns:
 *   wsConnected     — WebSocket is open (backend reachable)
 *   deviceConnected — Arduino bridge is connected to the backend
 *   sensorData      — latest { ecg, norm, v, ms } (norm is 0–1)
 *
 * When the backend is unreachable the games stay in keyboard/mouse mode silently.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8000/ws/client';
const RECONNECT_MS = 3000;

export function useSensor() {
  const [wsConnected,     setWsConnected]     = useState(false);
  const [deviceConnected, setDeviceConnected] = useState(false);
  const [sensorData,      setSensorData]      = useState(null);

  const wsRef  = useRef(null);
  const timer  = useRef(null);
  const alive  = useRef(true);

  const connect = useCallback(() => {
    if (!alive.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!alive.current) return;
      setWsConnected(true);
      clearTimeout(timer.current);
    };

    ws.onmessage = ({ data }) => {
      if (!alive.current) return;
      try {
        const msg = JSON.parse(data);
        if (msg.type === 'device_status') {
          setDeviceConnected(!!msg.connected);
          if (msg.latest) setSensorData(msg.latest);
        } else if (msg.type === 'sensor_data') {
          setSensorData(msg.payload);
        }
      } catch { /* ignore malformed frames */ }
    };

    ws.onerror = () => ws.close();

    ws.onclose = () => {
      if (!alive.current) return;
      setWsConnected(false);
      setDeviceConnected(false);
      timer.current = setTimeout(connect, RECONNECT_MS);
    };
  }, []);

  useEffect(() => {
    alive.current = true;
    connect();
    return () => {
      alive.current = false;
      clearTimeout(timer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { wsConnected, deviceConnected, sensorData };
}
