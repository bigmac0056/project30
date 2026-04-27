import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PH } from '../../theme';
import EMGWave from '../../shared/EMGWave';

const W = window.innerWidth, H = window.innerHeight;
const GROUND = H - 100;
const PIPE_W = 80, GAP = 220, SPEED = 3.2;
const THRESHOLD = 0.42;
const BIRD_X = 200;

function makePipes() {
  return [
    { x: W + 100, topH: 100 + Math.random() * 180, scored: false },
    { x: W + 100 + W * 0.55, topH: 90 + Math.random() * 200, scored: false },
  ];
}

export default function GameSparrow({ onBack }) {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    emg: 0, birdY: H * 0.42, vel: 0,
    pipes: makePipes(), score: 0, combo: 0,
    phase: 'idle', pressing: false,
    lastTime: null,
  });
  const [ui, setUi] = useState({ score: 0, combo: 0, emg: 0, phase: 'idle' });
  const rafRef = useRef(null);

  const setPhase = (p) => { stateRef.current.phase = p; setUi(u => ({ ...u, phase: p })); };
  const reset = () => {
    const st = stateRef.current;
    st.pipes = makePipes(); st.birdY = H * 0.42; st.vel = 0;
    st.emg = 0; st.score = 0; st.combo = 0; st.lastTime = null;
    setUi({ score: 0, combo: 0, emg: 0, phase: 'idle' });
    st.phase = 'idle';
  };

  // EMG simulation via SPACE or LMB
  useEffect(() => {
    const onDown = (e) => {
      if (e.code === 'Space') e.preventDefault();
      if (e.code === 'Space' || e.button === 0) {
        stateRef.current.pressing = true;
        if (stateRef.current.phase === 'idle') setPhase('playing');
      }
    };
    const onUp = (e) => {
      if (e.code === 'Space' || e.button === 0) stateRef.current.pressing = false;
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  // Game loop on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = W; canvas.height = H;

    const tick = (time) => {
      const st = stateRef.current;
      if (!st.lastTime) st.lastTime = time;
      const dt = Math.min((time - st.lastTime) / 16.67, 3);
      st.lastTime = time;

      // EMG rise/fall
      if (st.pressing) st.emg = Math.min(st.emg + 0.05 * dt, 1);
      else st.emg = Math.max(st.emg - 0.04 * dt, 0);

      if (st.phase === 'playing') {
        // Physics
        if (st.emg > THRESHOLD) st.vel = Math.max(st.vel - 0.65 * dt, -11);
        else st.vel = Math.min(st.vel + 0.55 * dt, 13);
        st.birdY = Math.max(60, Math.min(GROUND - 50, st.birdY + st.vel * dt));

        // Pipes
        for (const p of st.pipes) {
          p.x -= SPEED * dt;
          if (p.x < BIRD_X + 10 && !p.scored) {
            p.scored = true; st.score += 10; st.combo += 1;
          }
          if (p.x < -PIPE_W) {
            p.x = W + 80; p.topH = 90 + Math.random() * 200; p.scored = false;
          }
        }

        // Collision
        for (const p of st.pipes) {
          const ho = BIRD_X + 22 > p.x && BIRD_X - 22 < p.x + PIPE_W;
          if (ho && (st.birdY - 22 < p.topH || st.birdY + 22 > p.topH + GAP)) {
            setPhase('dead'); break;
          }
        }
        if (st.birdY >= GROUND - 48) setPhase('dead');
      }

      // ─── DRAW ───
      ctx.clearRect(0, 0, W, H);

      // Sky gradient
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#DCE8F2'); sky.addColorStop(1, '#F2D998');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

      // Sun
      const sg = ctx.createRadialGradient(W - 120, 100, 0, W - 120, 100, 90);
      sg.addColorStop(0, '#FFE07A'); sg.addColorStop(1, 'rgba(244,184,80,0)');
      ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(W - 120, 100, 90, 0, Math.PI * 2); ctx.fill();

      // Clouds
      drawCloud(ctx, 100, 130, 90);
      drawCloud(ctx, W * 0.55, 200, 70);
      drawCloud(ctx, W * 0.3, 260, 60);

      // Hills
      const hg = ctx.createLinearGradient(0, GROUND - 90, 0, GROUND + 50);
      hg.addColorStop(0, '#88C36F'); hg.addColorStop(1, '#4F8B3D');
      ctx.fillStyle = hg;
      ctx.beginPath();
      ctx.moveTo(0, GROUND);
      ctx.bezierCurveTo(W * 0.15, GROUND - 90, W * 0.3, GROUND - 50, W * 0.5, GROUND - 130);
      ctx.bezierCurveTo(W * 0.65, GROUND - 50, W * 0.8, GROUND - 110, W, GROUND - 60);
      ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();

      // Pipes
      for (const p of st.pipes) drawPipe(ctx, p.x, p.topH);

      // Bird
      drawBird(ctx, BIRD_X, st.birdY, st.vel);

      // EMG meter (left)
      drawEMGMeter(ctx, 22, 110, H - 210, st.emg, THRESHOLD);

      // Update UI state every 4 frames
      setUi(u => ({ ...u, score: st.score, combo: st.combo, emg: st.emg, phase: st.phase }));

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const { score, combo, emg, phase } = ui;

  return (
    <div style={css.root}>
      <canvas ref={canvasRef} style={css.canvas} />

      {/* HUD overlay */}
      <div style={css.hud}>
        <button style={css.pauseBtn} onClick={onBack}>◀ Выйти</button>
        <div style={css.scoreBox}>
          <div style={css.scoreItem}>
            <span style={css.scoreLbl}>SCORE</span>
            <span style={{ ...css.scoreVal, color: PH.lime }}>{score.toLocaleString()}</span>
          </div>
          <div style={css.div} />
          <div style={css.scoreItem}>
            <span style={css.scoreLbl}>СЕРИЯ</span>
            <span style={css.scoreVal}>×{combo}</span>
          </div>
          <div style={css.div} />
          <div style={css.scoreItem}>
            <span style={css.scoreLbl}>УРОВЕНЬ</span>
            <span style={css.scoreVal}>4 / 12</span>
          </div>
        </div>
        <div style={css.sensorPill}>
          <span style={css.sensorDot} /> SENSOR · SIM
        </div>
      </div>

      {/* Bottom wave strip */}
      <div style={css.waveStrip}>
        <div style={css.waveMeta}>
          <span style={{ fontFamily: PH.fontMono, fontSize: 10, letterSpacing: '0.1em', color: PH.inkDim }}>СИГНАЛ В РЕАЛЬНОМ ВРЕМЕНИ</span>
          <span style={{ fontFamily: PH.fontMono, fontSize: 10, color: PH.lime, fontWeight: 700 }}>● ЖИВО</span>
        </div>
        <EMGWave width={W - 120} height={40} intensity={Math.max(emg, 0.4)} density={1.6} />
      </div>

      {/* Hint */}
      {phase === 'idle' && (
        <div style={css.hint}>
          <span style={css.hintDot} />
          Удерживай <kbd style={css.kbd}>ПРОБЕЛ</kbd> или <kbd style={css.kbd}>ЛКМ</kbd> — взлетай, отпусти — падай
        </div>
      )}

      {/* Dead overlay */}
      {phase === 'dead' && (
        <div style={css.overlay}>
          <span style={css.ovLbl}>ГОТОВО!</span>
          <span style={{ ...css.ovScore, color: PH.lime }}>{score.toLocaleString()}</span>
          <span style={css.ovSub}>SPARROW · ОЧКИ</span>
          <div style={css.ovActions}>
            <button style={{ ...css.ovBtn, background: PH.ink }} onClick={reset}>Заново</button>
            <button style={{ ...css.ovBtn, background: PH.lime }} onClick={onBack}>← Меню</button>
          </div>
        </div>
      )}
    </div>
  );
}

function drawCloud(ctx, x, y, w) {
  ctx.fillStyle = 'rgba(255,255,255,0.82)';
  ctx.beginPath(); ctx.ellipse(x + w * 0.25, y + w * 0.35, w * 0.22, w * 0.14, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + w * 0.55, y + w * 0.28, w * 0.28, w * 0.18, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + w * 0.8, y + w * 0.36, w * 0.18, w * 0.12, 0, 0, Math.PI * 2); ctx.fill();
}

function drawPipe(ctx, x, topH) {
  // Top pipe
  ctx.fillStyle = PH.lime;
  ctx.beginPath(); ctx.roundRect(x, 0, PIPE_W, topH, [0, 0, 12, 12]); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.10)';
  ctx.fillRect(x, topH - 4, PIPE_W, 4);
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(x + 4, 0, 4, topH);

  // Bottom pipe
  const botY = topH + GAP;
  ctx.fillStyle = PH.lime;
  ctx.beginPath(); ctx.roundRect(x, botY, PIPE_W, H - botY, [12, 12, 0, 0]); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(x + 4, botY, 4, H - botY);
}

function drawBird(ctx, x, y, vel) {
  // Glow
  const grd = ctx.createRadialGradient(x, y, 0, x, y, 36);
  grd.addColorStop(0, 'rgba(127,203,58,0.3)');
  grd.addColorStop(1, 'rgba(127,203,58,0)');
  ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(x, y, 36, 0, Math.PI * 2); ctx.fill();

  // Body
  ctx.fillStyle = PH.lime;
  ctx.beginPath(); ctx.arc(x, y, 26, 0, Math.PI * 2); ctx.fill();

  // Wing shape
  ctx.fillStyle = '#FFF';
  ctx.save(); ctx.translate(x, y); ctx.rotate(Math.max(-0.4, Math.min(0.4, vel * 0.04)));
  ctx.beginPath();
  ctx.moveTo(-16, -4); ctx.quadraticCurveTo(0, -18, 16, -6);
  ctx.lineTo(22, -12); ctx.lineTo(20, 0); ctx.quadraticCurveTo(14, 10, 0, 8);
  ctx.quadraticCurveTo(-10, 8, -16, -4); ctx.closePath(); ctx.fill();
  ctx.restore();

  // Eye
  ctx.fillStyle = PH.ink;
  ctx.beginPath(); ctx.arc(x + 10, y - 6, 3, 0, Math.PI * 2); ctx.fill();
}

function drawEMGMeter(ctx, x, y, h, emg, threshold) {
  const w = 18, r = 9;

  // Label
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.beginPath(); ctx.roundRect(x - 12, y - 28, 42, 22, 11); ctx.fill();
  ctx.fillStyle = PH.ink; ctx.font = `700 10px ${PH.fontMono}`;
  ctx.textAlign = 'center'; ctx.fillText('EMG', x + w / 2, y - 12);

  // Track
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
  ctx.strokeStyle = PH.hair; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.stroke();

  // Fill
  const fillH = emg * h;
  ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.clip();
  const fg = ctx.createLinearGradient(0, y + h, 0, y + h - fillH);
  fg.addColorStop(0, PH.lime); fg.addColorStop(1, PH.limeBright);
  ctx.fillStyle = fg;
  ctx.fillRect(x, y + h - fillH, w, fillH);
  ctx.restore();

  // Threshold line
  ctx.strokeStyle = PH.violet; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 3, y + h - threshold * h);
  ctx.lineTo(x + w + 3, y + h - threshold * h);
  ctx.stroke();

  // Value
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.beginPath(); ctx.roundRect(x - 6, y + h + 8, 30, 22, 11); ctx.fill();
  ctx.fillStyle = PH.lime; ctx.font = `700 10px ${PH.fontMono}`;
  ctx.fillText(`${Math.round(emg * 100)}%`, x + w / 2, y + h + 23);
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
    display: 'flex', alignItems: 'center', gap: 16,
    padding: '8px 18px', borderRadius: 999,
    background: 'rgba(255,255,255,0.92)', border: `1px solid ${PH.hair}`,
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
  },
  scoreItem: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  scoreLbl: { fontFamily: PH.fontMono, fontSize: 9, color: PH.inkFaint, letterSpacing: '0.1em' },
  scoreVal: { fontFamily: PH.fontSans, fontSize: 22, fontWeight: 700, color: PH.ink, lineHeight: 1 },
  div: { width: 1, height: 28, background: PH.hair },
  sensorPill: {
    marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8,
    padding: '8px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.92)',
    border: `1px solid ${PH.hair}`, fontFamily: PH.fontMono, fontSize: 10,
    color: PH.ink, letterSpacing: '0.08em',
  },
  sensorDot: {
    width: 8, height: 8, borderRadius: '50%',
    background: PH.limeBright, boxShadow: `0 0 10px ${PH.limeBright}`,
    display: 'inline-block',
  },
  waveStrip: {
    position: 'absolute', bottom: 12, left: 100, right: 24, padding: '10px 16px',
    borderRadius: 14, background: 'rgba(255,255,255,0.92)',
    border: `1px solid ${PH.hair}`, zIndex: 5,
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
  },
  waveMeta: { display: 'flex', justifyContent: 'space-between', marginBottom: 4 },
  hint: {
    position: 'absolute', bottom: 110, left: '50%', transform: 'translateX(-50%)',
    padding: '10px 20px', borderRadius: 999,
    background: 'rgba(255,255,255,0.94)', border: `1px solid ${PH.hair}`,
    fontFamily: PH.fontSans, fontSize: 14, color: PH.ink,
    display: 'flex', alignItems: 'center', gap: 8, zIndex: 8,
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)', whiteSpace: 'nowrap',
  },
  hintDot: {
    width: 8, height: 8, borderRadius: '50%', background: PH.lime,
    boxShadow: `0 0 8px ${PH.lime}`, display: 'inline-block',
  },
  kbd: {
    background: PH.bgSoft, border: `1px solid ${PH.hairStrong}`,
    borderRadius: 4, padding: '1px 7px', fontFamily: PH.fontMono,
    fontSize: 12, color: PH.ink,
  },
  overlay: {
    position: 'absolute', inset: 0, background: 'rgba(245,242,236,0.95)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: 8, zIndex: 20,
  },
  ovLbl: { fontFamily: PH.fontMono, fontSize: 13, color: PH.inkFaint, letterSpacing: '0.12em' },
  ovScore: { fontFamily: PH.fontSans, fontSize: 80, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1 },
  ovSub: { fontFamily: PH.fontMono, fontSize: 12, color: PH.inkFaint, letterSpacing: '0.1em', marginBottom: 20 },
  ovActions: { display: 'flex', gap: 12 },
  ovBtn: {
    padding: '12px 28px', borderRadius: 12, border: 'none', cursor: 'pointer',
    fontFamily: PH.fontSans, fontSize: 16, fontWeight: 600, color: '#FFF',
  },
};
