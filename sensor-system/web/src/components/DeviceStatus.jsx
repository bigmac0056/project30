/**
 * DeviceStatus.jsx
 * ────────────────
 * Shows whether the backend WebSocket is reachable AND
 * whether the Arduino bridge is connected.
 */

import React from 'react';

const dot = {
  display      : 'inline-block',
  width        : 10,
  height       : 10,
  borderRadius : '50%',
  marginRight  : 8,
};

export default function DeviceStatus({ wsConnected, deviceConnected }) {
  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 24 }}>
      {/* Backend connection */}
      <div style={{ display: 'flex', alignItems: 'center', fontSize: 13 }}>
        <span
          style={{
            ...dot,
            background: wsConnected ? '#A8CC5C' : '#FF6B6B',
            boxShadow : wsConnected ? '0 0 6px #A8CC5C' : 'none',
          }}
        />
        {wsConnected ? 'Backend connected' : 'Backend disconnected'}
      </div>

      {/* Arduino / device */}
      <div style={{ display: 'flex', alignItems: 'center', fontSize: 13 }}>
        <span
          style={{
            ...dot,
            background: deviceConnected ? '#A8CC5C' : '#aaa',
            boxShadow : deviceConnected ? '0 0 6px #A8CC5C' : 'none',
          }}
        />
        {deviceConnected ? 'Arduino connected' : 'Arduino not connected'}
      </div>
    </div>
  );
}
