/**
 * useSensor.js
 * ────────────
 * Custom hook that manages the WebSocket connection to the backend
 * and exposes live sensor data + device/connection status.
 *
 * Usage:
 *   const { wsConnected, deviceConnected, sensorData } = useSensor();
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// Set via .env:  REACT_APP_WS_URL=ws://192.168.1.x:8000/ws/client
const WS_URL =
  process.env.REACT_APP_WS_URL || 'ws://localhost:8000/ws/client';

const RECONNECT_DELAY_MS = 3000;

export function useSensor() {
  const [wsConnected,     setWsConnected]     = useState(false);
  const [deviceConnected, setDeviceConnected] = useState(false);
  const [sensorData,      setSensorData]      = useState(null);   // latest payload dict

  const wsRef          = useRef(null);
  const reconnectTimer = useRef(null);
  const alive          = useRef(true);   // becomes false when component unmounts

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
        // malformed frame — ignore
      }
    };

    ws.onerror = () => ws.close();

    ws.onclose = () => {
      if (!alive.current) return;
      setWsConnected(false);
      setDeviceConnected(false);
      reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY_MS);
    };
  }, []); // no deps — stable reference

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
