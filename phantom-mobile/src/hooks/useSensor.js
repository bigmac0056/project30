/**
 * useSensor.js — phantom-mobile
 * ──────────────────────────────
 * WebSocket hook that connects to the sensor backend and exposes live data.
 *
 * States:
 *   wsConnected     — WebSocket is open (backend reachable)
 *   deviceConnected — Arduino bridge is connected to the backend
 *   sensorData      — latest { ecg, norm, v, ms } reading (norm is 0–1)
 *
 * When the backend is unreachable or the Arduino is unplugged:
 *   wsConnected / deviceConnected flip to false.
 *   Games fall back to touch-based EMG simulation automatically.
 *
 * URL is read from src/config.js which loads EXPO_PUBLIC_WS_URL from .env.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { WS_URL } from '../config';

const RECONNECT_MS = 3000;

export function useSensor() {
  const [wsConnected,     setWsConnected]     = useState(false);
  const [deviceConnected, setDeviceConnected] = useState(false);
  const [sensorData,      setSensorData]      = useState(null);

  const wsRef    = useRef(null);
  const timer    = useRef(null);
  const alive    = useRef(true);

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
