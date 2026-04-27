/**
 * SensorDisplay.jsx
 * ─────────────────
 * Renders live ECG / sensor values as a numeric readout and an
 * animated signal bar.
 */

import React, { useEffect, useRef } from 'react';

const BAR_COLOR_LOW  = '#A8CC5C';
const BAR_COLOR_HIGH = '#FF6B6B';
const CANVAS_W       = 400;
const CANVAS_H       = 80;
const HISTORY        = 200;   // data points kept in ring buffer

export default function SensorDisplay({ sensorData, deviceConnected }) {
  const canvasRef = useRef(null);
  const history   = useRef([]);   // ring buffer of normalised values

  // Push latest value into ring buffer and redraw canvas
  useEffect(() => {
    if (!sensorData) return;

    const norm = typeof sensorData.norm === 'number'
      ? sensorData.norm
      : (sensorData.ecg ?? 0) / 1023;

    history.current.push(norm);
    if (history.current.length > HISTORY) history.current.shift();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#0E0E14';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Grid lines
    ctx.strokeStyle = '#1E1E28';
    ctx.lineWidth   = 1;
    for (let i = 0; i <= 4; i++) {
      const y = (i / 4) * CANVAS_H;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_W, y);
      ctx.stroke();
    }

    // Signal wave
    const pts = history.current;
    if (pts.length < 2) return;

    ctx.beginPath();
    ctx.lineWidth   = 2;
    ctx.strokeStyle = '#A8CC5C';
    ctx.shadowBlur  = 6;
    ctx.shadowColor = '#A8CC5C';

    pts.forEach((v, i) => {
      const x = (i / (HISTORY - 1)) * CANVAS_W;
      const y = CANVAS_H - v * CANVAS_H;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.shadowBlur = 0;
  }, [sensorData]);

  if (!deviceConnected) {
    return (
      <div style={styles.placeholder}>
        Waiting for Arduino sensor data …
      </div>
    );
  }

  const norm    = sensorData?.norm   ?? 0;
  const raw     = sensorData?.ecg    ?? '—';
  const voltage = sensorData?.v      ?? '—';
  const barPct  = Math.round(norm * 100);
  const barColor = norm > 0.75 ? BAR_COLOR_HIGH : BAR_COLOR_LOW;

  return (
    <div style={styles.card}>
      {/* Numeric readouts */}
      <div style={styles.row}>
        <Stat label="RAW ADC" value={raw}                    />
        <Stat label="NORM"    value={`${(norm * 100).toFixed(1)}%`} />
        <Stat label="VOLTAGE" value={typeof voltage === 'number' ? `${voltage.toFixed(2)} V` : voltage} />
      </div>

      {/* Bar meter */}
      <div style={styles.barWrap}>
        <div style={{ ...styles.barFill, width: `${barPct}%`, background: barColor }} />
      </div>

      {/* Oscilloscope-style canvas */}
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        style={{ width: '100%', borderRadius: 8, marginTop: 12 }}
      />
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 10, color: '#888', letterSpacing: 1, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', fontVariant: 'tabular-nums' }}>
        {value}
      </div>
    </div>
  );
}

const styles = {
  placeholder: {
    padding      : 32,
    textAlign    : 'center',
    color        : '#555',
    border       : '1px dashed #333',
    borderRadius : 12,
  },
  card: {
    background   : '#12121A',
    borderRadius : 14,
    padding      : 20,
    border       : '1px solid #1E1E28',
  },
  row: {
    display        : 'flex',
    justifyContent : 'space-around',
    marginBottom   : 16,
  },
  barWrap: {
    height       : 10,
    background   : '#1E1E28',
    borderRadius : 5,
    overflow     : 'hidden',
  },
  barFill: {
    height         : '100%',
    borderRadius   : 5,
    transition     : 'width 80ms linear, background 200ms',
  },
};
