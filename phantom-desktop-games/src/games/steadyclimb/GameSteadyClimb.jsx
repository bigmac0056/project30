import React, { useRef, useEffect, useState } from 'react';
import { PH } from '../../theme';
import { useSensor } from '../../hooks/useSensor';

const W = window.innerWidth, H = window.innerHeight;
const TARGET_MIN = 0.40, TARGET_MAX = 0.62;
const METER_X = W - 120, METER_Y = 110, METER_H = H - 220, METER_W = 40;

// Climbing path checkpoints (from bottom to top)
const CHECKPOINTS = [
  { x: W * 0.25, y: H * 0.82 },
  { x: W * 0.38, y: H * 0.62 },
  { x: W * 0.52, y: H * 0.42 },
  { x: W * 0.44, y: H * 0.22 },
  { x: W * 0.55, y: H * 0.10 },
];

export default function GameSteadyClimb({ onBack }) {
  const { deviceConnected, sensorData } = useSensor();

  const canvasRef = useRef(null);
  const stateRef = useRef({
    emg: 0, score: 0, hold: 0, meters: 0,
    phase: 'idle', lastTime: null,
    climberProgress: 0,
  });
  const [ui, setUi] = useState({ score: 0, hold: 0, meters: 0, emg: 0, phase: 'idle', inZone: false });
  const rafRef = useRef(null);

  const setPhase = (p) => { stateRef.current.phase = p; setUi(u => ({ ...u, phase: p })); };
  const reset = () => {
    const st = stateRef.current;
    st.emg = 0; st.score = 0; st.hold = 0; st.meters = 0;
    st.climberProgress = 0; st.lastTime = null; st.phase = 'idle';
    setUi({ score: 0, hold: 0, meters: 0, emg: 0, phase: 'idle', inZone: false });
  };

  // Live sensor (only input source) → stateRef.current.emg
  useEffect(() => {
    if (!deviceConnected || !sensorData) {
      stateRef.current.emg = 0;
      return;
    }
    const norm = Math.max(0, Math.min(1, sensorData.norm ?? 0));
    stateRef.current.emg = norm;
    if (norm > 0.15 && stateRef.current.phase === 'idle') setPhase('playing');
  }, [sensorData, deviceConnected]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = W; canvas.height = H;

    const tick = (time) => {
      const st = stateRef.current;
      if (!st.lastTime) st.lastTime = time;
      const dt = Math.min((time - st.lastTime) / 1000, 0.1); // in seconds
      st.lastTime = time;

      const inZone = st.emg >= TARGET_MIN && st.emg <= TARGET_MAX;

      if (st.phase === 'playing') {
        if (inZone) {
          st.hold += rawDt;
          st.meters += rawDt; // 1 sec = 1 metre
          st.score += rawDt * 20;
          st.climberProgress = Math.min(st.climberProgress + rawDt * 0.04, 1);
        } else {
          st.hold = Math.max(0, st.hold - rawDt * 0.5);
          st.climberProgress = Math.max(0, st.climberProgress - rawDt * 0.01);
        }
      }

      // ─── DRAW ───
      ctx.clearRect(0, 0, W, H);

      // Sky
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#FFE5D6'); sky.addColorStop(0.5, '#FCD8C2'); sky.addColorStop(1, '#E89E7E');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

      // Sun glow
      const sg = ctx.createRadialGradient(W - 130, 90, 0, W - 130, 90, 130);
      sg.addColorStop(0, 'rgba(255,224,122,0.85)'); sg.addColorStop(1, 'rgba(255,224,122,0)');
      ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(W - 130, 90, 130, 0, Math.PI * 2); ctx.fill();

      // Mountains
      drawMountains(ctx);

      // Rope path
      drawRopePath(ctx);

      // Height ladder (left side)
      drawHeightLadder(ctx, st.climberProgress);

      // Climber
      const cpIdx = Math.floor(st.climberProgress * (CHECKPOINTS.length - 1));
      const cpFrac = (st.climberProgress * (CHECKPOINTS.length - 1)) % 1;
      const cp0 = CHECKPOINTS[Math.min(cpIdx, CHECKPOINTS.length - 1)];
      const cp1 = CHECKPOINTS[Math.min(cpIdx + 1, CHECKPOINTS.length - 1)];
      const clX = cp0.x + (cp1.x - cp0.x) * cpFrac;
      const clY = cp0.y + (cp1.y - cp0.y) * cpFrac;
      drawClimber(ctx, clX, clY, inZone);

      // Zone meter (right)
      drawZoneMeter(ctx, st.emg, inZone);

      // Bottom info
      drawBottomInfo(ctx, inZone, st.hold, st.meters);

      setUi({
        score: Math.round(st.score), hold: +st.hold.toFixed(1),
        meters: Math.round(st.meters), emg: st.emg,
        phase: st.phase, inZone,
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const { score, hold, meters, phase, inZone } = ui;

  return (
    <div style={css.root}>
      <canvas ref={canvasRef} style={css.canvas} />

      <div style={css.hud}>
        <button style={css.pauseBtn} onClick={onBack}>◀ Выйти</button>
        <div style={css.scoreBox}>
          <div style={css.scoreItem}>
            <span style={css.scoreLbl}>SCORE</span>
            <span style={{ ...css.scoreVal, color: PH.coral }}>{score.toLocaleString()}</span>
          </div>
          <div style={css.div} />
          <div style={css.scoreItem}>
            <span style={css.scoreLbl}>HOLD</span>
            <span style={{ ...css.scoreVal, color: PH.coral }}>{hold}s</span>
          </div>
          <div style={css.div} />
          <div style={css.scoreItem}>
            <span style={css.scoreLbl}>МЕТРОВ</span>
            <span style={{ ...css.scoreVal, color: PH.coral }}>{meters}m</span>
          </div>
        </div>
        <div style={{ ...css.sensorPill, borderColor: deviceConnected ? `${PH.coral}55` : `${PH.coral}55` }}>
          <span style={{ ...css.sensorDot, background: deviceConnected ? PH.coral : PH.coral, boxShadow: deviceConnected ? `0 0 10px ${PH.coral}` : 'none' }} />
          {deviceConnected ? 'ДАТЧИК · ПОДКЛЮЧЁН' : 'ДАТЧИК · НЕТ'}
        </div>
      </div>

      {phase === 'idle' && deviceConnected && (
        <div style={css.hint}>
          <span style={{ ...css.hintDot, background: PH.coral, boxShadow: `0 0 8px ${PH.coral}` }} />
          Удерживай сжатие в зелёной зоне — чем дольше, тем выше!
        </div>
      )}

      {/* Device not connected overlay */}
      {!deviceConnected && (
        <div style={css.overlay}>
          <span style={{ fontSize: 56 }}>🦾</span>
          <span style={css.ovTitle}>Подключи EMG датчик</span>
          <span style={css.ovSub}>Игра управляется только через датчик мышц.<br />Подключи Arduino — игра стартует автоматически.</span>
          <button style={{ ...css.ovBtn, background: PH.ink, marginTop: 8 }} onClick={onBack}>← Назад в меню</button>
        </div>
      )}
    </div>
  );
}

function drawMountains(ctx) {
  // Back layer
  ctx.fillStyle = '#D67555'; ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.moveTo(-50, H);
  ctx.lineTo(W * 0.06, H * 0.38); ctx.lineTo(W * 0.14, H * 0.47);
  ctx.lineTo(W * 0.24, H * 0.20); ctx.lineTo(W * 0.36, H * 0.35);
  ctx.lineTo(W * 0.48, H * 0.10); ctx.lineTo(W * 0.62, H * 0.28);
  ctx.lineTo(W * 0.76, H * 0.18); ctx.lineTo(W * 0.88, H * 0.32);
  ctx.lineTo(W + 50, H);
  ctx.closePath(); ctx.fill();

  // Snow caps
  ctx.fillStyle = '#FFF'; ctx.globalAlpha = 0.75;
  [[W * 0.24, H * 0.20], [W * 0.48, H * 0.10], [W * 0.76, H * 0.18]].forEach(([px, py]) => {
    ctx.beginPath();
    ctx.moveTo(px, py); ctx.lineTo(px + 24, py + 36); ctx.lineTo(px - 24, py + 36); ctx.closePath(); ctx.fill();
  });

  // Front layer
  ctx.fillStyle = '#B85839'; ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.moveTo(-50, H);
  ctx.lineTo(W * 0.04, H * 0.54); ctx.lineTo(W * 0.13, H * 0.69);
  ctx.lineTo(W * 0.24, H * 0.45); ctx.lineTo(W * 0.35, H * 0.65);
  ctx.lineTo(W * 0.48, H * 0.32); ctx.lineTo(W * 0.62, H * 0.43);
  ctx.lineTo(W * 0.76, H * 0.36); ctx.lineTo(W * 0.88, H * 0.46);
  ctx.lineTo(W + 50, H * 0.77);
  ctx.lineTo(W + 50, H);
  ctx.closePath(); ctx.fill();
  ctx.globalAlpha = 1;
}

function drawRopePath(ctx) {
  ctx.strokeStyle = 'rgba(184,88,57,0.5)'; ctx.lineWidth = 4;
  ctx.setLineDash([8, 6]); ctx.lineCap = 'round';
  ctx.beginPath();
  CHECKPOINTS.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.stroke();
  ctx.setLineDash([]);

  // Checkpoints
  CHECKPOINTS.forEach((p, i) => {
    const isTop = i === CHECKPOINTS.length - 1;
    ctx.beginPath(); ctx.arc(p.x, p.y, 9, 0, Math.PI * 2);
    ctx.fillStyle = isTop ? PH.coral : '#FFF';
    ctx.fill();
    ctx.strokeStyle = PH.coral; ctx.lineWidth = 2.5; ctx.stroke();

    if (isTop) {
      // Flag
      ctx.strokeStyle = PH.lime; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(p.x, p.y - 9); ctx.lineTo(p.x, p.y - 36); ctx.stroke();
      ctx.fillStyle = PH.lime;
      ctx.beginPath(); ctx.moveTo(p.x, p.y - 36); ctx.lineTo(p.x + 20, p.y - 28); ctx.lineTo(p.x, p.y - 20); ctx.closePath(); ctx.fill();
    }
  });
}

function drawHeightLadder(ctx, progress) {
  const lx = 40, ly = 110, lh = H - 220;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath(); ctx.roundRect(lx - 16, ly - 28, 60, 22, 11); ctx.fill();
  ctx.fillStyle = PH.ink; ctx.font = `700 9px ${PH.fontMono}`;
  ctx.textAlign = 'center'; ctx.fillText('ВЫСОТА', lx + 2, ly - 12);

  // Track
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.beginPath(); ctx.roundRect(lx, ly, 4, lh, 2); ctx.fill();

  // Ticks
  [100, 75, 50, 25, 0].forEach(p => {
    const y = ly + lh * (1 - p / 100);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(lx - 6, y - 1, 10, 2);
    ctx.fillStyle = PH.inkDim; ctx.font = `400 9px ${PH.fontMono}`;
    ctx.textAlign = 'left'; ctx.fillText(p + 'm', lx + 10, y + 3);
  });

  // Marker
  const markerY = ly + lh * (1 - progress);
  ctx.fillStyle = PH.coral;
  ctx.shadowColor = PH.coral; ctx.shadowBlur = 10;
  ctx.beginPath(); ctx.arc(lx + 2, markerY, 7, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
}

function drawClimber(ctx, x, y, inZone) {
  // Glow
  if (inZone) {
    ctx.shadowColor = PH.lime; ctx.shadowBlur = 20;
  }
  ctx.fillStyle = PH.ink;
  ctx.beginPath(); ctx.arc(x, y - 55, 11, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 9, y - 44); ctx.lineTo(x - 14, y - 22);
  ctx.lineTo(x - 5, y - 22); ctx.lineTo(x - 9, y - 5);
  ctx.lineTo(x - 1, y - 8); ctx.lineTo(x + 7, y - 22);
  ctx.lineTo(x + 14, y - 22); ctx.lineTo(x + 9, y - 44); ctx.closePath(); ctx.fill();
  ctx.shadowBlur = 0;

  // Rope arm
  ctx.strokeStyle = PH.coral; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - 4, y - 36); ctx.lineTo(x + 24, y - 56); ctx.stroke();
  ctx.setLineDash([4, 3]);
  ctx.beginPath(); ctx.moveTo(x, y - 28); ctx.lineTo(x + 18, y - 42); ctx.stroke();
  ctx.setLineDash([]);

  // Helmet light
  ctx.fillStyle = inZone ? PH.limeBright : PH.coral;
  ctx.shadowColor = inZone ? PH.limeBright : PH.coral; ctx.shadowBlur = 8;
  ctx.beginPath(); ctx.arc(x + 4, y - 60, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
}

function drawZoneMeter(ctx, emg, inZone) {
  const mx = METER_X, my = METER_Y, mw = METER_W, mh = METER_H, mr = 20;

  // Label
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.beginPath(); ctx.roundRect(mx - 10, my - 32, mw + 20, 24, 12); ctx.fill();
  ctx.fillStyle = PH.ink; ctx.font = `700 10px ${PH.fontMono}`; ctx.textAlign = 'center';
  ctx.fillText('ДЕРЖИ В ЗОНЕ', mx + mw / 2, my - 14);

  // Track bg
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.beginPath(); ctx.roundRect(mx, my, mw, mh, mr); ctx.fill();
  ctx.strokeStyle = PH.hair; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(mx, my, mw, mh, mr); ctx.stroke();

  // Target zone
  const zBot = my + mh - TARGET_MIN * mh;
  const zTop = my + mh - TARGET_MAX * mh;
  const zH = zBot - zTop;
  ctx.fillStyle = inZone ? `${PH.limeBright}55` : `${PH.lime}22`;
  ctx.fillRect(mx - 6, zTop, mw + 12, zH);
  ctx.strokeStyle = PH.lime; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
  ctx.beginPath(); ctx.moveTo(mx - 8, zTop); ctx.lineTo(mx + mw + 8, zTop); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(mx - 8, zBot); ctx.lineTo(mx + mw + 8, zBot); ctx.stroke();
  ctx.setLineDash([]);

  // Цель label
  const midZone = (zTop + zBot) / 2;
  ctx.save(); ctx.translate(mx - 16, midZone); ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = PH.lime; ctx.font = `700 10px ${PH.fontMono}`; ctx.textAlign = 'center';
  ctx.fillText('ЦЕЛЬ', 0, 0);
  ctx.restore();

  // Marker
  const markerY = my + mh - emg * mh;
  ctx.fillStyle = inZone ? PH.lime : PH.coral;
  ctx.shadowColor = inZone ? PH.lime : PH.coral; ctx.shadowBlur = 12;
  ctx.beginPath(); ctx.roundRect(mx - 10, markerY - 3, mw + 20, 6, 3); ctx.fill();
  ctx.shadowBlur = 0;

  // Tick marks
  ctx.strokeStyle = 'rgba(0,0,0,0.08)'; ctx.lineWidth = 1;
  [0.25, 0.5, 0.75].forEach(t => {
    const y = my + mh - t * mh;
    ctx.beginPath(); ctx.moveTo(mx, y); ctx.lineTo(mx + mw - 10, y); ctx.stroke();
  });

  // Status pill
  const pillW = 100, pillX = mx + mw / 2 - pillW / 2;
  ctx.fillStyle = inZone ? PH.limeSoft : '#FCE6DD';
  ctx.beginPath(); ctx.roundRect(pillX, my + mh + 14, pillW, 28, 14); ctx.fill();
  ctx.strokeStyle = inZone ? `${PH.lime}44` : `${PH.coral}44`; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(pillX, my + mh + 14, pillW, 28, 14); ctx.stroke();
  ctx.fillStyle = inZone ? PH.lime : PH.coral;
  ctx.font = `700 11px ${PH.fontMono}`; ctx.textAlign = 'center';
  ctx.fillText(inZone ? '● В ЦЕЛИ' : '✕ ВНЕ ЗОНЫ', mx + mw / 2, my + mh + 33);

  // EMG value
  ctx.fillStyle = PH.inkDim; ctx.font = `400 10px ${PH.fontMono}`;
  ctx.fillText(`${Math.round(emg * 100)}%  цель 40–62`, mx + mw / 2, my + mh + 58);
}

function drawBottomInfo(ctx, inZone, hold, meters) {
  const bx = 80, by = H - 80, bw = METER_X - bx - 30, bh = 60, br = 14;
  ctx.fillStyle = 'rgba(255,255,255,0.94)';
  ctx.beginPath(); ctx.roundRect(bx, by - bh, bw, bh, br); ctx.fill();
  ctx.strokeStyle = PH.hair; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(bx, by - bh, bw, bh, br); ctx.stroke();

  ctx.fillStyle = PH.ink; ctx.font = `600 14px ${PH.fontSans}`;
  ctx.textAlign = 'left';
  ctx.fillText(inZone ? 'В зоне! Держи мышцу...' : 'Не слишком сильно, не слишком слабо', bx + 16, by - bh + 24);
  ctx.fillStyle = PH.inkDim; ctx.font = `400 12px ${PH.fontSans}`;
  ctx.fillText('Каждая секунда в зоне = 1 метр вверх. Тренирует дозирование.', bx + 16, by - bh + 44);

  // Stats right
  ctx.fillStyle = PH.inkFaint; ctx.font = `500 9px ${PH.fontMono}`; ctx.textAlign = 'right';
  ctx.fillText('УДЕРЖАНИЕ', bx + bw - 16, by - bh + 20);
  ctx.fillStyle = PH.coral; ctx.font = `700 22px ${PH.fontSans}`;
  ctx.fillText(`${hold.toFixed(1)}s`, bx + bw - 16, by - bh + 46);
}

const css = {
  root: { width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', userSelect: 'none' },
  canvas: { position: 'absolute', inset: 0, width: '100%', height: '100%' },
  hud: {
    position: 'absolute', top: 16, left: 16, right: 16,
    display: 'flex', alignItems: 'center', gap: 12, zIndex: 10,
  },
  pauseBtn: {
    padding: '8px 14px', borderRadius: 999, border: `1px solid ${PH.hair}`,
    background: 'rgba(255,255,255,0.92)', fontFamily: PH.fontMono,
    fontSize: 12, color: PH.ink, cursor: 'pointer', letterSpacing: '0.05em',
  },
  scoreBox: {
    display: 'flex', alignItems: 'center', gap: 16, padding: '8px 18px',
    borderRadius: 999, background: 'rgba(255,255,255,0.92)', border: `1px solid ${PH.hair}`,
  },
  scoreItem: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  scoreLbl: { fontFamily: PH.fontMono, fontSize: 9, color: PH.inkFaint, letterSpacing: '0.1em' },
  scoreVal: { fontFamily: PH.fontSans, fontSize: 22, fontWeight: 700, lineHeight: 1 },
  div: { width: 1, height: 28, background: PH.hair },
  sensorPill: {
    marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8,
    padding: '8px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.92)',
    border: `1px solid ${PH.hair}`, fontFamily: PH.fontMono, fontSize: 10, color: PH.ink,
  },
  sensorDot: { width: 8, height: 8, borderRadius: '50%', background: PH.limeBright, display: 'inline-block' },
  hint: {
    position: 'absolute', bottom: 110, left: '50%', transform: 'translateX(-50%)',
    padding: '10px 20px', borderRadius: 999,
    background: 'rgba(255,255,255,0.94)', border: `1px solid ${PH.hair}`,
    fontFamily: PH.fontSans, fontSize: 14, color: PH.ink,
    display: 'flex', alignItems: 'center', gap: 8, zIndex: 8, whiteSpace: 'nowrap',
  },
  hintDot: { width: 8, height: 8, borderRadius: '50%', display: 'inline-block' },
  overlay: { position: 'absolute', inset: 0, background: 'rgba(245,242,236,0.97)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, zIndex: 20 },
  ovTitle: { fontFamily: PH.fontSans, fontSize: 32, fontWeight: 700, color: PH.ink, letterSpacing: '-0.03em' },
  ovSub: { fontFamily: PH.fontSans, fontSize: 15, color: PH.inkDim, textAlign: 'center', lineHeight: 1.6, maxWidth: 400 },
  ovBtn: { padding: '12px 28px', borderRadius: 12, border: 'none', cursor: 'pointer', fontFamily: PH.fontSans, fontSize: 16, fontWeight: 600, color: '#FFF' },
};
