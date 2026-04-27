/**
 * RehabGame.jsx
 * ─────────────
 * Minimal "squeeze to lift" rehabilitation game driven by the Arduino sensor.
 *
 * Mechanics:
 *   - Patient squeezes the sensor → norm value rises → ball lifts
 *   - A target zone (green band) is shown at a random height
 *   - Holding the ball inside the zone for 2 seconds scores a point
 *   - Works in full demo mode with a slider when no device is connected
 */

import React, { useState, useEffect, useRef } from 'react';

const CANVAS_W      = 360;
const CANVAS_H      = 500;
const BALL_R        = 22;
const ZONE_HEIGHT   = 80;
const HOLD_MS       = 2000;   // hold in zone for 2s to score

export default function RehabGame({ sensorData, deviceConnected }) {
  const canvasRef    = useRef(null);
  const normRef      = useRef(0);       // current normalised value (0–1)
  const zoneTopRef   = useRef(0.35);    // zone top in 0–1 coords
  const holdStart    = useRef(null);
  const animRef      = useRef(null);

  const [score,     setScore]     = useState(0);
  const [holdPct,   setHoldPct]   = useState(0);   // 0–100 hold progress
  const [manualNorm,setManualNorm]= useState(0);    // slider for demo

  // Update normRef from sensor or slider
  useEffect(() => {
    normRef.current = deviceConnected
      ? (sensorData?.norm ?? 0)
      : manualNorm;
  }, [sensorData, deviceConnected, manualNorm]);

  // Randomise zone on mount and after each score
  const randomiseZone = () => {
    zoneTopRef.current = 0.15 + Math.random() * 0.55;
  };
  useEffect(() => { randomiseZone(); }, []);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let lastTime = 0;

    function draw(ts) {
      const dt = ts - lastTime;
      lastTime = ts;

      const norm      = normRef.current;               // 0–1
      const ballY     = CANVAS_H - norm * CANVAS_H;    // 0=top, H=bottom
      const zoneTop   = zoneTopRef.current * CANVAS_H;
      const zoneBot   = zoneTop + ZONE_HEIGHT;
      const inZone    = ballY >= zoneTop && ballY <= zoneBot;

      // ── Hold timer logic ──────────────────────────────────
      if (inZone) {
        if (!holdStart.current) holdStart.current = ts;
        const elapsed = ts - holdStart.current;
        const pct     = Math.min((elapsed / HOLD_MS) * 100, 100);
        setHoldPct(Math.round(pct));
        if (elapsed >= HOLD_MS) {
          setScore(s => s + 1);
          holdStart.current = null;
          randomiseZone();
        }
      } else {
        holdStart.current = null;
        setHoldPct(0);
      }

      // ── Draw ──────────────────────────────────────────────

      // Background
      ctx.fillStyle = '#0E0E14';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Vertical guide rail
      ctx.strokeStyle = '#1E1E28';
      ctx.lineWidth   = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(CANVAS_W / 2, 0);
      ctx.lineTo(CANVAS_W / 2, CANVAS_H);
      ctx.stroke();
      ctx.setLineDash([]);

      // Target zone (green band)
      ctx.fillStyle   = inZone ? 'rgba(168,204,92,0.25)' : 'rgba(168,204,92,0.10)';
      ctx.strokeStyle = inZone ? '#A8CC5C' : '#A8CC5C55';
      ctx.lineWidth   = 2;
      ctx.beginPath();
      ctx.roundRect(CANVAS_W / 2 - 60, zoneTop, 120, ZONE_HEIGHT, 8);
      ctx.fill();
      ctx.stroke();

      // Zone label
      ctx.fillStyle  = '#A8CC5C';
      ctx.font       = '11px monospace';
      ctx.textAlign  = 'center';
      ctx.fillText('TARGET', CANVAS_W / 2, zoneTop - 8);

      // Ball
      const ballX = CANVAS_W / 2;
      const grd   = ctx.createRadialGradient(ballX - 6, ballY - 6, 2, ballX, ballY, BALL_R);
      grd.addColorStop(0, '#ffffff');
      grd.addColorStop(1, inZone ? '#A8CC5C' : '#7B8BFF');
      ctx.shadowBlur  = inZone ? 20 : 8;
      ctx.shadowColor = inZone ? '#A8CC5C' : '#7B8BFF';
      ctx.fillStyle   = grd;
      ctx.beginPath();
      ctx.arc(ballX, ballY, BALL_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur  = 0;

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, []);   // runs once — reads normRef reactively via closure

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <span style={styles.scoreLabel}>SCORE</span>
        <span style={styles.scoreValue}>{score}</span>
      </div>

      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        style={{ borderRadius: 16, display: 'block' }}
      />

      {/* Hold progress bar */}
      {holdPct > 0 && (
        <div style={styles.holdWrap}>
          <div style={{ ...styles.holdFill, width: `${holdPct}%` }} />
        </div>
      )}

      {/* Demo slider when no device */}
      {!deviceConnected && (
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <p style={{ color: '#666', fontSize: 12, marginBottom: 8 }}>
            No device — use slider to simulate squeeze
          </p>
          <input
            type="range" min="0" max="1" step="0.01"
            value={manualNorm}
            onChange={e => setManualNorm(parseFloat(e.target.value))}
            style={{ width: '80%' }}
          />
        </div>
      )}
    </div>
  );
}

const styles = {
  wrap: {
    display       : 'flex',
    flexDirection : 'column',
    alignItems    : 'center',
    gap           : 12,
  },
  header: {
    display        : 'flex',
    alignItems     : 'baseline',
    gap            : 10,
    marginBottom   : 4,
  },
  scoreLabel: { fontSize: 11, color: '#666', letterSpacing: 2 },
  scoreValue: { fontSize: 36, fontWeight: 800, color: '#fff' },
  holdWrap: {
    width        : CANVAS_W,
    height       : 8,
    background   : '#1E1E28',
    borderRadius : 4,
    overflow     : 'hidden',
  },
  holdFill: {
    height     : '100%',
    background : '#A8CC5C',
    borderRadius: 4,
    transition : 'width 100ms linear',
  },
};
