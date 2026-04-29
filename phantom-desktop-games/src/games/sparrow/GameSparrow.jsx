/**
 * GameSparrow — Ghost Mode + Live EMG only
 * ─────────────────────────────────────────
 * Fixes:
 *  • Pre-game modal with duration selector (30/60/90/120 s)
 *  • Proportional lift — stronger squeeze = stronger lift, capped gently
 *  • Score only when bird actually passes THROUGH the gap
 */
import React, { useRef, useEffect, useState } from 'react';
import { PH } from '../../theme';
import EMGWave from '../../shared/EMGWave';
import { useSensor } from '../../hooks/useSensor';

const W = window.innerWidth, H = window.innerHeight;
const GROUND   = H - 100;
const PIPE_W   = 80, GAP = 220, SPEED = 3.2;
const THRESHOLD = 0.42;
const BIRD_X    = 200;
const INVINCIBLE_MS = 1200;
const DURATIONS = [30, 60, 90, 120];

function makePipes() {
  return [
    { x: W + 100,           topH: 100 + Math.random() * 180, scored: false },
    { x: W + 100 + W * 0.55, topH:  90 + Math.random() * 200, scored: false },
  ];
}

export default function GameSparrow({ onBack }) {
  const { deviceConnected, sensorData } = useSensor();

  /* ── UI state ── */
  const [screen,   setScreen]   = useState('start');  // 'start' | 'playing' | 'result'
  const [duration, setDuration] = useState(60);
  const [timeLeft, setTimeLeft] = useState(60);
  const [ui,       setUi]       = useState({ score: 0, combo: 0, emg: 0 });

  const canvasRef  = useRef(null);
  const rafRef     = useRef(null);
  const timerRef   = useRef(null);

  const stateRef = useRef({
    emg: 0, birdY: H * 0.42, vel: 0,
    pipes: makePipes(), score: 0, combo: 0,
    phase: 'idle', lastTime: null, hitTime: 0, birdFlash: 0,
    startTime: null, duration: 60,
  });

  /* ── sensor → stateRef ── */
  useEffect(() => {
    if (!deviceConnected || !sensorData) { stateRef.current.emg = 0; return; }
    const norm = Math.max(0, Math.min(1, sensorData.norm ?? 0));
    stateRef.current.emg = norm;
    if (norm > 0.15 && stateRef.current.phase === 'idle' && screen === 'playing') {
      stateRef.current.phase = 'playing';
    }
  }, [sensorData, deviceConnected, screen]);

  /* ── start game ── */
  const startGame = (dur) => {
    const st = stateRef.current;
    st.pipes    = makePipes();
    st.birdY    = H * 0.42;
    st.vel      = 0;
    st.score    = 0;
    st.combo    = 0;
    st.emg      = 0;
    st.hitTime  = 0;
    st.birdFlash= 0;
    st.lastTime = null;
    st.phase    = 'idle';
    st.duration = dur;
    setUi({ score: 0, combo: 0, emg: 0 });
    setTimeLeft(dur);
    setDuration(dur);
    setScreen('playing');
  };

  /* ── countdown timer ── */
  useEffect(() => {
    if (screen !== 'playing') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          stateRef.current.phase = 'done';
          setScreen('result');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [screen]);

  /* ── canvas game loop ── */
  useEffect(() => {
    if (screen !== 'playing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = W; canvas.height = H;

    const tick = (time) => {
      const st = stateRef.current;
      if (!st.lastTime) st.lastTime = time;
      const dt = Math.min((time - st.lastTime) / 16.67, 3);
      st.lastTime = time;

      if (st.phase === 'playing') {
        /* ── Physics: proportional lift ── */
        if (st.emg > THRESHOLD) {
          // How far above threshold (0→1)
          const power = Math.min(1, (st.emg - THRESHOLD) / (1 - THRESHOLD));
          // Gentle proportional lift, max upward vel = -6 (was -11)
          st.vel = Math.max(st.vel - power * 0.42 * dt, -6);
        } else {
          st.vel = Math.min(st.vel + 0.55 * dt, 13);
        }
        st.birdY = Math.max(60, Math.min(GROUND - 50, st.birdY + st.vel * dt));

        /* ── Pipes + correct scoring ── */
        for (const p of st.pipes) {
          p.x -= SPEED * dt;

          // Score only when the ENTIRE pipe has passed the bird (right edge < bird left edge)
          if (!p.scored && p.x + PIPE_W < BIRD_X - 20) {
            p.scored = true;
            // Check bird is actually inside the gap
            const inGap = st.birdY - 20 >= p.topH && st.birdY + 20 <= p.topH + GAP;
            if (inGap) {
              st.score += 10;
              st.combo  += 1;
              setUi(u => ({ ...u, score: st.score, combo: st.combo }));
            } else {
              st.combo = 0;
              setUi(u => ({ ...u, combo: 0 }));
            }
          }

          if (p.x < -PIPE_W) {
            p.x = W + 80; p.topH = 90 + Math.random() * 200; p.scored = false;
          }
        }

        /* ── Ghost collision (flash, no death) ── */
        const now = Date.now();
        const isInvincible = now - st.hitTime < INVINCIBLE_MS;
        if (!isInvincible) {
          for (const p of st.pipes) {
            const ho = BIRD_X + 22 > p.x && BIRD_X - 22 < p.x + PIPE_W;
            if (ho && (st.birdY - 22 < p.topH || st.birdY + 22 > p.topH + GAP)) {
              st.hitTime = now; st.birdFlash = 1; st.combo = 0;
              setUi(u => ({ ...u, combo: 0 }));
              break;
            }
          }
          if (st.birdY >= GROUND - 48) {
            st.hitTime = now; st.birdFlash = 1; st.vel = -8;
          }
        }
        if (st.birdFlash > 0) st.birdFlash = Math.max(0, st.birdFlash - 0.08 * dt);
      }

      /* ── DRAW ── */
      ctx.clearRect(0, 0, W, H);
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#DCE8F2'); sky.addColorStop(1, '#F2D998');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

      const sg = ctx.createRadialGradient(W - 120, 100, 0, W - 120, 100, 90);
      sg.addColorStop(0, '#FFE07A'); sg.addColorStop(1, 'rgba(244,184,80,0)');
      ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(W - 120, 100, 90, 0, Math.PI * 2); ctx.fill();

      drawCloud(ctx, 100, 130, 90);
      drawCloud(ctx, W * 0.55, 200, 70);
      drawCloud(ctx, W * 0.3, 260, 60);

      const hg = ctx.createLinearGradient(0, GROUND - 90, 0, GROUND + 50);
      hg.addColorStop(0, '#88C36F'); hg.addColorStop(1, '#4F8B3D');
      ctx.fillStyle = hg;
      ctx.beginPath();
      ctx.moveTo(0, GROUND);
      ctx.bezierCurveTo(W * 0.15, GROUND - 90, W * 0.3, GROUND - 50, W * 0.5, GROUND - 130);
      ctx.bezierCurveTo(W * 0.65, GROUND - 50, W * 0.8, GROUND - 110, W, GROUND - 60);
      ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();

      for (const p of st.pipes) drawPipe(ctx, p.x, p.topH);

      ctx.globalAlpha = st.birdFlash > 0 ? 0.3 + (1 - st.birdFlash) * 0.7 : 1;
      drawBird(ctx, BIRD_X, st.birdY, st.vel, st.birdFlash > 0);
      ctx.globalAlpha = 1;

      drawEMGMeter(ctx, 22, 110, H - 210, st.emg, THRESHOLD);

      setUi(u => ({ ...u, emg: st.emg }));
      rafRef.current = requestAnimationFrame(tick);
    };

    // Start physics only when EMG fires (idle → playing done in sensor effect)
    // But if already has EMG signal, jump straight to playing
    if (stateRef.current.emg > 0.15) stateRef.current.phase = 'playing';

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [screen]);

  const finalScore = stateRef.current.score;
  const { score, combo, emg } = ui;
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timerStr = `${mins}:${secs.toString().padStart(2, '0')}`;
  const timerWarn = timeLeft <= 10;

  /* ════════════════════════════════════════
     START SCREEN
  ════════════════════════════════════════ */
  if (screen === 'start') return (
    <div style={css.modalRoot}>
      <div style={css.modal}>
        <div style={css.modalIcon}>🐦</div>
        <div style={css.modalTitle}>Sparrow</div>
        <div style={css.modalSub}>Управление мышцей · Удержание высоты</div>

        <div style={css.modalRule} />

        <div style={css.modalLabel}>ДЛИТЕЛЬНОСТЬ СЕССИИ</div>
        <div style={css.durGrid}>
          {DURATIONS.map(d => (
            <button
              key={d}
              className={`dur-btn${duration === d ? ' dur-btn-active' : ''}`}
              style={{ ...css.durBtn, ...(duration === d ? css.durBtnActive : {}) }}
              onClick={() => setDuration(d)}
            >
              {d < 60 ? `${d}с` : `${d / 60} мин`}
            </button>
          ))}
        </div>

        <div style={css.modalRule} />

        <div style={css.modalHint}>
          <span style={css.hintDot} />
          Сожми мышцу — птица взлетает · Расслабь — падает
        </div>
        <div style={css.modalHint}>
          <span style={{ ...css.hintDot, background: PH.violet }} />
          Очки только за прохождение в щель между трубами
        </div>

        <div style={css.modalRule} />

        {!deviceConnected && (
          <div style={css.warnBox}>🦾 Подключи EMG датчик перед началом</div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button style={css.backBtnModal} onClick={onBack}>← Назад</button>
          <button
            style={{ ...css.startBtn, opacity: deviceConnected ? 1 : 0.45 }}
            disabled={!deviceConnected}
            onClick={() => startGame(duration)}
          >
            Начать →
          </button>
        </div>
      </div>
    </div>
  );

  /* ════════════════════════════════════════
     RESULT SCREEN
  ════════════════════════════════════════ */
  if (screen === 'result') return (
    <div style={css.modalRoot}>
      <div style={css.modal}>
        <div style={css.modalIcon}>🏆</div>
        <div style={css.modalTitle}>Результат</div>
        <div style={css.modalSub}>Sparrow · {duration}с</div>

        <div style={css.modalRule} />

        <div style={css.resultGrid}>
          <div style={css.resultBox}>
            <div style={css.resultLbl}>СЧЁТ</div>
            <div style={{ ...css.resultVal, color: PH.lime }}>{finalScore}</div>
          </div>
          <div style={css.resultBox}>
            <div style={css.resultLbl}>ВРЕМЯ</div>
            <div style={css.resultVal}>{duration}с</div>
          </div>
        </div>

        <div style={css.modalRule} />

        <div style={{ display: 'flex', gap: 10 }}>
          <button style={css.backBtnModal} onClick={onBack}>← Меню</button>
          <button style={css.startBtn} onClick={() => startGame(duration)}>↺ Ещё раз</button>
        </div>
      </div>
    </div>
  );

  /* ════════════════════════════════════════
     GAME SCREEN
  ════════════════════════════════════════ */
  return (
    <div style={css.root}>
      <canvas ref={canvasRef} style={css.canvas} />

      {/* HUD */}
      <div style={css.hud}>
        <button style={css.pauseBtn} onClick={onBack}>◀ Выйти</button>

        <div style={css.scoreBox}>
          <div style={css.scoreItem}>
            <span style={css.scoreLbl}>SCORE</span>
            <span style={{ ...css.scoreVal, color: PH.lime }}>{score.toLocaleString()}</span>
          </div>
          <div style={css.divider} />
          <div style={css.scoreItem}>
            <span style={css.scoreLbl}>СЕРИЯ</span>
            <span style={css.scoreVal}>×{combo}</span>
          </div>
        </div>

        {/* Timer */}
        <div style={{ ...css.timerBox, borderColor: timerWarn ? `${PH.coral}88` : `${PH.hair}`, background: timerWarn ? `${PH.coral}12` : 'rgba(255,255,255,0.92)' }}>
          <span style={{ fontFamily: PH.fontMono, fontSize: 9, color: timerWarn ? PH.coral : PH.inkFaint, letterSpacing: '0.1em', marginBottom: 1 }}>ВРЕМЯ</span>
          <span style={{ fontFamily: PH.fontSans, fontSize: 22, fontWeight: 700, color: timerWarn ? PH.coral : PH.ink, lineHeight: 1 }}>{timerStr}</span>
        </div>

        <div style={{ ...css.sensorPill, borderColor: deviceConnected ? `${PH.lime}55` : `${PH.coral}55` }}>
          <span style={{ ...css.sensorDot, background: deviceConnected ? PH.limeBright : PH.coral, boxShadow: deviceConnected ? `0 0 10px ${PH.limeBright}` : 'none' }} />
          {deviceConnected ? 'ДАТЧИК · ПОДКЛЮЧЁН' : 'ДАТЧИК · НЕТ'}
        </div>
      </div>

      {/* Wave strip */}
      <div style={css.waveStrip}>
        <div style={css.waveMeta}>
          <span style={{ fontFamily: PH.fontMono, fontSize: 10, letterSpacing: '0.1em', color: PH.inkDim }}>СИГНАЛ В РЕАЛЬНОМ ВРЕМЕНИ</span>
          <span style={{ fontFamily: PH.fontMono, fontSize: 10, color: deviceConnected ? PH.lime : PH.inkFaint, fontWeight: 700 }}>{deviceConnected ? '● ЖИВО' : '— НЕТ СИГНАЛА'}</span>
        </div>
        <EMGWave width={W - 120} height={40} intensity={Math.max(emg, 0.4)} density={1.6} />
      </div>

      {/* Idle hint */}
      {stateRef.current.phase === 'idle' && deviceConnected && (
        <div style={css.hint}>
          <span style={css.hintDot2} />
          Сожми мышцу чтобы начать
        </div>
      )}

      {/* No device overlay */}
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

/* ── Drawing helpers ── */
function drawCloud(ctx, x, y, w) {
  ctx.fillStyle = 'rgba(255,255,255,0.82)';
  ctx.beginPath(); ctx.ellipse(x + w * 0.25, y + w * 0.35, w * 0.22, w * 0.14, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + w * 0.55, y + w * 0.28, w * 0.28, w * 0.18, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + w * 0.8,  y + w * 0.36, w * 0.18, w * 0.12, 0, 0, Math.PI * 2); ctx.fill();
}

function drawPipe(ctx, x, topH) {
  ctx.fillStyle = PH.lime;
  ctx.beginPath(); ctx.roundRect(x, 0, PIPE_W, topH, [0, 0, 12, 12]); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.10)'; ctx.fillRect(x, topH - 4, PIPE_W, 4);
  ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(x + 4, 0, 4, topH);
  const botY = topH + GAP;
  ctx.fillStyle = PH.lime;
  ctx.beginPath(); ctx.roundRect(x, botY, PIPE_W, H - botY, [12, 12, 0, 0]); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(x + 4, botY, 4, H - botY);
}

function drawBird(ctx, x, y, vel, isHit) {
  const grd = ctx.createRadialGradient(x, y, 0, x, y, 36);
  grd.addColorStop(0, isHit ? 'rgba(255,80,80,0.3)' : 'rgba(127,203,58,0.3)');
  grd.addColorStop(1, 'rgba(127,203,58,0)');
  ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(x, y, 36, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = isHit ? '#FF5050' : PH.lime;
  ctx.beginPath(); ctx.arc(x, y, 26, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#FFF';
  ctx.save(); ctx.translate(x, y); ctx.rotate(Math.max(-0.4, Math.min(0.4, vel * 0.04)));
  ctx.beginPath();
  ctx.moveTo(-16, -4); ctx.quadraticCurveTo(0, -18, 16, -6);
  ctx.lineTo(22, -12); ctx.lineTo(20, 0); ctx.quadraticCurveTo(14, 10, 0, 8);
  ctx.quadraticCurveTo(-10, 8, -16, -4); ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.fillStyle = PH.ink; ctx.beginPath(); ctx.arc(x + 10, y - 6, 3, 0, Math.PI * 2); ctx.fill();
}

function drawEMGMeter(ctx, x, y, h, emg, threshold) {
  const w = 18, r = 9;
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.beginPath(); ctx.roundRect(x - 12, y - 28, 42, 22, 11); ctx.fill();
  ctx.fillStyle = PH.ink; ctx.font = `700 10px monospace`;
  ctx.textAlign = 'center'; ctx.fillText('EMG', x + w / 2, y - 12);
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
  ctx.strokeStyle = PH.hair; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.stroke();
  const fillH = emg * h;
  ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.clip();
  const fg = ctx.createLinearGradient(0, y + h, 0, y + h - fillH);
  fg.addColorStop(0, PH.lime); fg.addColorStop(1, PH.limeBright);
  ctx.fillStyle = fg; ctx.fillRect(x, y + h - fillH, w, fillH);
  ctx.restore();
  ctx.strokeStyle = PH.violet; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 3, y + h - threshold * h);
  ctx.lineTo(x + w + 3, y + h - threshold * h);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.beginPath(); ctx.roundRect(x - 6, y + h + 8, 30, 22, 11); ctx.fill();
  ctx.fillStyle = PH.lime; ctx.font = `700 10px monospace`;
  ctx.fillText(`${Math.round(emg * 100)}%`, x + w / 2, y + h + 23);
}

const css = {
  /* game screen */
  root: { width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', userSelect: 'none' },
  canvas: { position: 'absolute', inset: 0, width: '100%', height: '100%' },
  hud: { position: 'absolute', top: 16, left: 16, right: 16, display: 'flex', alignItems: 'center', gap: 12, zIndex: 10 },
  pauseBtn: { padding: '8px 14px', borderRadius: 999, border: `1px solid ${PH.hair}`, background: 'rgba(255,255,255,0.92)', fontFamily: PH.fontMono, fontSize: 12, color: PH.ink, cursor: 'pointer', letterSpacing: '0.05em' },
  scoreBox: { display: 'flex', alignItems: 'center', gap: 16, padding: '8px 18px', borderRadius: 999, background: 'rgba(255,255,255,0.92)', border: `1px solid ${PH.hair}`, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' },
  scoreItem: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  scoreLbl: { fontFamily: PH.fontMono, fontSize: 9, color: PH.inkFaint, letterSpacing: '0.1em' },
  scoreVal: { fontFamily: PH.fontSans, fontSize: 22, fontWeight: 700, color: PH.ink, lineHeight: 1 },
  divider: { width: 1, height: 28, background: PH.hair },
  timerBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6px 16px', borderRadius: 999, border: '1px solid', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' },
  sensorPill: { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.92)', border: `1px solid ${PH.hair}`, fontFamily: PH.fontMono, fontSize: 10, color: PH.ink, letterSpacing: '0.08em' },
  sensorDot: { width: 8, height: 8, borderRadius: '50%', display: 'inline-block' },
  waveStrip: { position: 'absolute', bottom: 12, left: 100, right: 24, padding: '10px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.92)', border: `1px solid ${PH.hair}`, zIndex: 5, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' },
  waveMeta: { display: 'flex', justifyContent: 'space-between', marginBottom: 4 },
  hint: { position: 'absolute', bottom: 110, left: '50%', transform: 'translateX(-50%)', padding: '10px 20px', borderRadius: 999, background: 'rgba(255,255,255,0.94)', border: `1px solid ${PH.hair}`, fontFamily: PH.fontSans, fontSize: 14, color: PH.ink, display: 'flex', alignItems: 'center', gap: 8, zIndex: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', whiteSpace: 'nowrap' },
  hintDot2: { width: 8, height: 8, borderRadius: '50%', background: PH.lime, boxShadow: `0 0 8px ${PH.lime}`, display: 'inline-block' },
  overlay: { position: 'absolute', inset: 0, background: 'rgba(245,242,236,0.97)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, zIndex: 20 },
  ovTitle: { fontFamily: PH.fontSans, fontSize: 32, fontWeight: 700, color: PH.ink, letterSpacing: '-0.03em' },
  ovSub: { fontFamily: PH.fontSans, fontSize: 15, color: PH.inkDim, textAlign: 'center', lineHeight: 1.6, maxWidth: 400 },
  ovBtn: { padding: '12px 28px', borderRadius: 12, border: 'none', cursor: 'pointer', fontFamily: PH.fontSans, fontSize: 16, fontWeight: 600, color: '#FFF' },

  /* modal screens */
  modalRoot: { width: '100vw', height: '100vh', background: PH.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: PH.fontSans },
  modal: { background: PH.bgAlt, border: `1px solid ${PH.hair}`, borderRadius: 24, padding: '36px 40px', width: 420, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, boxShadow: '0 16px 64px rgba(0,0,0,0.10)' },
  modalIcon: { fontSize: 48, lineHeight: 1 },
  modalTitle: { fontFamily: PH.fontSans, fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', color: PH.ink },
  modalSub: { fontFamily: PH.fontMono, fontSize: 11, color: PH.inkFaint, letterSpacing: '0.08em' },
  modalRule: { width: '100%', height: 1, background: PH.hair },
  modalLabel: { fontFamily: PH.fontMono, fontSize: 9, color: PH.inkFaint, letterSpacing: '0.12em', alignSelf: 'flex-start' },
  durGrid: { display: 'flex', gap: 8, width: '100%' },
  durBtn: { flex: 1, padding: '10px 0', borderRadius: 12, border: `1.5px solid ${PH.hair}`, background: PH.bg, fontFamily: PH.fontSans, fontSize: 14, fontWeight: 600, color: PH.inkDim, cursor: 'pointer' },
  durBtnActive: { background: PH.ink, color: '#FFF', borderColor: PH.ink },
  modalHint: { display: 'flex', alignItems: 'center', gap: 8, fontFamily: PH.fontSans, fontSize: 13, color: PH.inkDim, alignSelf: 'flex-start' },
  hintDot: { width: 7, height: 7, borderRadius: '50%', background: PH.lime, flexShrink: 0 },
  warnBox: { background: `${PH.coral}15`, border: `1px solid ${PH.coral}44`, borderRadius: 10, padding: '10px 16px', fontFamily: PH.fontSans, fontSize: 13, color: PH.coral, width: '100%', textAlign: 'center', boxSizing: 'border-box' },
  backBtnModal: { flex: 1, padding: '13px 0', borderRadius: 13, border: `1.5px solid ${PH.hair}`, background: PH.bg, fontFamily: PH.fontSans, fontSize: 15, fontWeight: 600, color: PH.inkDim, cursor: 'pointer' },
  startBtn: { flex: 2, padding: '13px 0', borderRadius: 13, border: 'none', background: PH.ink, fontFamily: PH.fontSans, fontSize: 15, fontWeight: 600, color: '#FFF', cursor: 'pointer' },
  resultGrid: { display: 'flex', gap: 12, width: '100%' },
  resultBox: { flex: 1, background: PH.bg, borderRadius: 12, padding: '14px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', border: `1px solid ${PH.hair}` },
  resultLbl: { fontFamily: PH.fontMono, fontSize: 9, color: PH.inkFaint, letterSpacing: '0.1em' },
  resultVal: { fontFamily: PH.fontSans, fontSize: 28, fontWeight: 700, color: PH.ink, marginTop: 4 },
};
