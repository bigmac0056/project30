/**
 * GamePulseRun — Ghost Mode + Live EMG Sensor only
 * ──────────────────────────────────────────────────
 * Input: Live Arduino via useSensor() exclusively.
 * Sharp EMG spike → jump. Ghost mode (flash, no death).
 * When device not connected → overlay blocks game.
 */
import React, { useRef, useEffect, useState } from 'react';
import { PH } from '../../theme';
import EMGWave from '../../shared/EMGWave';
import { useSensor } from '../../hooks/useSensor';

const W = window.innerWidth, H = window.innerHeight;
const GROUND = H - 120;
const RUNNER_X = 200;
const OBS_W = 44, SPEED = 3.8;
const THRESHOLD = 0.55;
const INVINCIBLE_MS = 1000;

function makeObs() {
  return [
    { x: W + 100, h: 60 + Math.random() * 50, scored: false },
    { x: W + 100 + W * 0.5, h: 50 + Math.random() * 60, scored: false },
    { x: W + 100 + W, h: 55 + Math.random() * 55, scored: false },
  ];
}

export default function GamePulseRun({ onBack }) {
  const { deviceConnected, sensorData } = useSensor();

  const canvasRef = useRef(null);
  const stateRef = useRef({
    emg: 0, runnerY: 0, vel: 0,
    jumping: false, obs: makeObs(),
    score: 0, phase: 'idle',
    lastTime: null, hitTime: 0, runnerFlash: 0,
  });
  const [ui, setUi] = useState({ score: 0, emg: 0, phase: 'idle', jumping: false });
  const rafRef = useRef(null);

  const setPhase = (p) => { stateRef.current.phase = p; setUi(u => ({ ...u, phase: p })); };
  const reset = () => {
    const st = stateRef.current;
    st.obs = makeObs(); st.runnerY = 0; st.vel = 0;
    st.jumping = false; st.emg = 0; st.score = 0;
    st.lastTime = null; st.phase = 'idle';
    st.hitTime = 0; st.runnerFlash = 0;
    setUi({ score: 0, emg: 0, phase: 'idle', jumping: false });
  };

  // Live sensor → stateRef.current.emg
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
      const dt = Math.min((time - st.lastTime) / 16.67, 3);
      st.lastTime = time;

      if (st.phase === 'playing') {
        // Jump trigger — higher jump
        if (!st.jumping && st.emg > THRESHOLD) {
          st.vel = -22; st.jumping = true;
        }
        if (st.jumping) {
          st.vel = Math.min(st.vel + 0.55 * dt, 16);
          st.runnerY = Math.min(0, st.runnerY + st.vel * dt);
          if (st.runnerY >= 0) { st.runnerY = 0; st.vel = 0; st.jumping = false; }
        }

        for (const o of st.obs) {
          o.x -= SPEED * dt;
          if (o.x < RUNNER_X + 20 && !o.scored) { o.scored = true; st.score += 15; }
          if (o.x < -OBS_W) { o.x = W + 80; o.h = 50 + Math.random() * 60; o.scored = false; }
        }

        // Ghost collision — flash, no death
        const now = Date.now();
        const isInvincible = now - st.hitTime < INVINCIBLE_MS;
        if (!isInvincible) {
          const ry = st.runnerY;
          for (const o of st.obs) {
            const ho = RUNNER_X + 20 > o.x && RUNNER_X - 16 < o.x + OBS_W;
            const bottomOfRunner = GROUND + ry;
            const topOfObs = GROUND - o.h;
            if (ho && bottomOfRunner > topOfObs + 8 && ry > -o.h + 10) {
              st.hitTime = now; st.runnerFlash = 1; break;
            }
          }
        }
        if (st.runnerFlash > 0) st.runnerFlash = Math.max(0, st.runnerFlash - 0.08 * dt);
      }

      // ─── DRAW ───
      ctx.clearRect(0, 0, W, H);
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#E9DFFB'); sky.addColorStop(1, '#FFE5D6');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = `${PH.violet}28`; ctx.lineWidth = 2;
      [H * 0.32, H * 0.44, H * 0.55, H * 0.65, H * 0.75].forEach(y => {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      });

      drawHill(ctx, '#E9DFFB', 0.15, H * 0.63);
      drawHill(ctx, `${PH.violet}28`, 0.28, H * 0.72);

      const gg = ctx.createLinearGradient(0, GROUND, 0, H);
      gg.addColorStop(0, '#B5A6E8'); gg.addColorStop(1, '#8870D8');
      ctx.fillStyle = gg; ctx.fillRect(0, GROUND, W, H - GROUND);
      ctx.fillStyle = PH.violet; ctx.fillRect(0, GROUND, W, 4);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      for (let x = 0; x < W; x += 200) ctx.fillRect(x, GROUND + 32, 80, 4);

      for (const o of st.obs) drawObstacle(ctx, o.x, o.h);

      // Runner flash on hit
      ctx.globalAlpha = st.runnerFlash > 0 ? 0.3 + (1 - st.runnerFlash) * 0.7 : 1;
      drawRunner(ctx, RUNNER_X, GROUND + st.runnerY, st.jumping, st.runnerFlash > 0);
      ctx.globalAlpha = 1;

      drawImpulseBar(ctx, st.emg, THRESHOLD, st.jumping);

      setUi(u => ({ ...u, score: st.score, emg: st.emg, phase: st.phase, jumping: st.jumping }));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const { score, emg, phase, jumping } = ui;
  const pct = Math.round(emg * 100);

  return (
    <div style={css.root}>
      <canvas ref={canvasRef} style={css.canvas} />

      <div style={css.hud}>
        <button style={css.pauseBtn} onClick={onBack}>◀ Выйти</button>
        <div style={css.scoreBox}>
          <div style={css.scoreItem}>
            <span style={css.scoreLbl}>SCORE</span>
            <span style={{ ...css.scoreVal, color: PH.violet }}>{score.toLocaleString()}</span>
          </div>
          <div style={css.div} />
          <div style={css.scoreItem}>
            <span style={css.scoreLbl}>ИМПУЛЬС</span>
            <span style={{ ...css.scoreVal, color: jumping ? PH.violet : PH.ink }}>{jumping ? '⚡' : `${pct}%`}</span>
          </div>
        </div>
        <div style={{ ...css.sensorPill, borderColor: deviceConnected ? `${PH.violet}55` : `${PH.coral}55` }}>
          <span style={{ ...css.sensorDot, background: deviceConnected ? PH.violet : PH.coral, boxShadow: deviceConnected ? `0 0 10px ${PH.violet}` : 'none' }} />
          {deviceConnected ? 'ДАТЧИК · ПОДКЛЮЧЁН' : 'ДАТЧИК · НЕТ'}
        </div>
      </div>

      {phase === 'idle' && deviceConnected && (
        <div style={css.hint}>
          <span style={{ ...css.hintDot, background: PH.violet, boxShadow: `0 0 8px ${PH.violet}` }} />
          Резкое сжатие мышцы — прыжок!
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

function drawHill(ctx, color, opacity, baseY) {
  ctx.fillStyle = color; ctx.globalAlpha = opacity;
  ctx.beginPath(); ctx.moveTo(0, H);
  ctx.bezierCurveTo(W * 0.15, baseY - 60, W * 0.35, baseY + 20, W * 0.5, baseY - 80);
  ctx.bezierCurveTo(W * 0.65, baseY - 40, W * 0.8, baseY + 10, W, baseY - 50);
  ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
  ctx.globalAlpha = 1;
}

function drawObstacle(ctx, x, h) {
  const botY = GROUND - h;
  ctx.fillStyle = PH.coral;
  ctx.beginPath(); ctx.roundRect(x, botY, OBS_W, h, [4, 4, 0, 0]); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fillRect(x, botY + h - 4, OBS_W, 4);
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(x + 4, botY, 4, h);
  ctx.fillStyle = PH.coral;
  ctx.beginPath(); ctx.roundRect(x - 6, botY - 10, OBS_W + 12, 14, 4); ctx.fill();
}

function drawRunner(ctx, x, groundY, jumping, isHit) {
  const runY = groundY - 80;
  if (!jumping) {
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath(); ctx.ellipse(x, groundY, 30, 4, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = isHit ? PH.coral : PH.violet;
  ctx.beginPath(); ctx.arc(x, runY + 14, 12, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath();
  if (jumping) {
    ctx.moveTo(x - 10, runY + 26); ctx.lineTo(x - 18, runY + 52);
    ctx.lineTo(x - 6, runY + 52); ctx.lineTo(x - 12, runY + 72);
    ctx.lineTo(x, runY + 62); ctx.lineTo(x + 12, runY + 52);
    ctx.lineTo(x + 18, runY + 52); ctx.lineTo(x + 10, runY + 26); ctx.closePath();
  } else {
    ctx.moveTo(x - 10, runY + 26); ctx.lineTo(x - 14, runY + 52);
    ctx.lineTo(x - 4, runY + 52); ctx.lineTo(x - 8, runY + 74);
    ctx.lineTo(x, runY + 74); ctx.lineTo(x + 8, runY + 52);
    ctx.lineTo(x + 14, runY + 26); ctx.closePath();
  }
  ctx.fill();
  ctx.strokeStyle = isHit ? PH.coral : PH.violet; ctx.lineWidth = 8; ctx.lineCap = 'round';
  ctx.beginPath();
  if (jumping) { ctx.moveTo(x - 6, runY + 36); ctx.lineTo(x + 20, runY + 20); }
  else { ctx.moveTo(x - 6, runY + 40); ctx.lineTo(x - 22, runY + 46); }
  ctx.stroke();
}

function drawImpulseBar(ctx, emg, threshold, jumping) {
  const bx = 110, by = H - 80, bw = W - 140, bh = 14, br = 7;
  ctx.font = `500 10px ${PH.fontMono}`; ctx.fillStyle = PH.inkDim; ctx.textAlign = 'left';
  ctx.fillText('СИГНАЛ ИМПУЛЬСА', bx, by - 10);
  const stateText = jumping ? '⚡ ПРЫЖОК' : `${Math.round(emg * 100)}% — копи импульс`;
  ctx.textAlign = 'right'; ctx.fillStyle = jumping ? PH.violet : PH.inkFaint;
  ctx.font = `700 11px ${PH.fontMono}`; ctx.fillText(stateText, bx + bw, by - 10);
  ctx.fillStyle = PH.bgSoft;
  ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, br); ctx.fill();
  ctx.fillStyle = jumping ? PH.violet : PH.violetSoft;
  ctx.beginPath(); ctx.roundRect(bx, by, bw * emg, bh, br); ctx.fill();
  ctx.strokeStyle = PH.coral; ctx.lineWidth = 3;
  ctx.shadowColor = PH.coral; ctx.shadowBlur = 8;
  const tx = bx + bw * threshold;
  ctx.beginPath(); ctx.moveTo(tx, by - 2); ctx.lineTo(tx, by + bh + 2); ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.font = `400 9px ${PH.fontMono}`; ctx.fillStyle = PH.inkFaint;
  ctx.textAlign = 'left'; ctx.fillText('покой', bx, by + bh + 16);
  ctx.textAlign = 'center'; ctx.fillStyle = PH.coral; ctx.fillText('↑ порог прыжка', tx, by + bh + 16);
  ctx.textAlign = 'right'; ctx.fillStyle = PH.inkFaint; ctx.fillText('макс', bx + bw, by + bh + 16);
}

const css = {
  root: { width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', userSelect: 'none' },
  canvas: { position: 'absolute', inset: 0, width: '100%', height: '100%' },
  hud: { position: 'absolute', top: 16, left: 16, right: 16, display: 'flex', alignItems: 'center', gap: 12, zIndex: 10 },
  pauseBtn: { padding: '8px 14px', borderRadius: 999, border: `1px solid ${PH.hair}`, background: 'rgba(255,255,255,0.92)', fontFamily: PH.fontMono, fontSize: 12, color: PH.ink, cursor: 'pointer', letterSpacing: '0.05em' },
  scoreBox: { display: 'flex', alignItems: 'center', gap: 16, padding: '8px 18px', borderRadius: 999, background: 'rgba(255,255,255,0.92)', border: `1px solid ${PH.hair}` },
  scoreItem: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  scoreLbl: { fontFamily: PH.fontMono, fontSize: 9, color: PH.inkFaint, letterSpacing: '0.1em' },
  scoreVal: { fontFamily: PH.fontSans, fontSize: 22, fontWeight: 700, color: PH.ink, lineHeight: 1 },
  div: { width: 1, height: 28, background: PH.hair },
  sensorPill: { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.92)', border: `1px solid ${PH.hair}`, fontFamily: PH.fontMono, fontSize: 10, color: PH.ink },
  sensorDot: { width: 8, height: 8, borderRadius: '50%', display: 'inline-block' },
  hint: { position: 'absolute', bottom: 120, left: '50%', transform: 'translateX(-50%)', padding: '10px 20px', borderRadius: 999, background: 'rgba(255,255,255,0.94)', border: `1px solid ${PH.hair}`, fontFamily: PH.fontSans, fontSize: 14, color: PH.ink, display: 'flex', alignItems: 'center', gap: 8, zIndex: 8, whiteSpace: 'nowrap' },
  hintDot: { width: 8, height: 8, borderRadius: '50%', display: 'inline-block' },
  overlay: { position: 'absolute', inset: 0, background: 'rgba(245,242,236,0.97)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, zIndex: 20 },
  ovTitle: { fontFamily: PH.fontSans, fontSize: 32, fontWeight: 700, color: PH.ink, letterSpacing: '-0.03em' },
  ovSub: { fontFamily: PH.fontSans, fontSize: 15, color: PH.inkDim, textAlign: 'center', lineHeight: 1.6, maxWidth: 400 },
  ovBtn: { padding: '12px 28px', borderRadius: 12, border: 'none', cursor: 'pointer', fontFamily: PH.fontSans, fontSize: 16, fontWeight: 600, color: '#FFF' },
};
