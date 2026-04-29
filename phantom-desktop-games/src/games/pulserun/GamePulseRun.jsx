/**
 * GamePulseRun — Runner · EMG spike-to-jump
 * ───────────────────────────────────────────
 * Structure mirrors Sparrow: start screen → duration picker → game → result.
 * Sharp EMG spike above threshold → jump. Ghost mode (flash, no death).
 * Session saved via onBack(result) from result screen.
 */
import React, { useRef, useEffect, useState } from 'react';
import { PH } from '../../theme';
import EMGWave from '../../shared/EMGWave';
import { useSensor } from '../../hooks/useSensor';

const W = window.innerWidth, H = window.innerHeight;
const GROUND     = H - 120;
const RUNNER_X   = 200;
const OBS_W      = 44, SPEED = 3.8;
const THRESHOLD  = 0.50;   // slightly easier to trigger jump
const INVINCIBLE_MS = 1000;
const DURATIONS  = [30, 60, 90, 120];

function makeObs() {
  return [
    { x: W + 100,           h: 60 + Math.random() * 50, scored: false },
    { x: W + 100 + W * 0.5, h: 50 + Math.random() * 60, scored: false },
    { x: W + 100 + W,       h: 55 + Math.random() * 55, scored: false },
  ];
}

export default function GamePulseRun({ onBack }) {
  const { deviceConnected, sensorData } = useSensor();

  const [screen,   setScreen]   = useState('start');
  const [duration, setDuration] = useState(60);
  const [timeLeft, setTimeLeft] = useState(60);
  const [ui,       setUi]       = useState({ score: 0, emg: 0, jumping: false });

  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const timerRef  = useRef(null);
  const resultRef = useRef(null);

  const stateRef = useRef({
    emg: 0, emgRaw: 0,
    emgPeak: 0, emgAvgSum: 0, emgAvgCount: 0,
    runnerY: 0, vel: 0,
    jumping: false, obs: makeObs(),
    score: 0, phase: 'idle',
    lastTime: null, hitTime: 0, runnerFlash: 0,
    duration: 60,
    prevEmg: 0,   // for rising-edge jump detection
  });

  /* ── sensor → emgRaw ── */
  useEffect(() => {
    if (!deviceConnected || !sensorData) { stateRef.current.emgRaw = 0; return; }
    const norm = Math.max(0, Math.min(1, sensorData.norm ?? 0));
    stateRef.current.emgRaw = norm;
    if (norm > 0.12 && stateRef.current.phase === 'idle' && screen === 'playing') {
      stateRef.current.phase = 'playing';
    }
  }, [sensorData, deviceConnected, screen]);

  /* ── start / reset ── */
  const startGame = (dur) => {
    const st = stateRef.current;
    st.obs       = makeObs();
    st.runnerY   = 0;
    st.vel       = 0;
    st.jumping   = false;
    st.emg       = 0;
    st.emgRaw    = 0;
    st.emgPeak   = 0;
    st.emgAvgSum = 0;
    st.emgAvgCount = 0;
    st.prevEmg   = 0;
    st.score     = 0;
    st.lastTime  = null;
    st.phase     = 'idle';
    st.hitTime   = 0;
    st.runnerFlash = 0;
    st.duration  = dur;
    resultRef.current = null;
    setUi({ score: 0, emg: 0, jumping: false });
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
          const st = stateRef.current;
          st.phase = 'done';
          resultRef.current = {
            score: st.score,
            durationSec: st.duration,
            emgPeak: st.emgPeak,
            emgAvg: st.emgAvgCount > 0 ? st.emgAvgSum / st.emgAvgCount : 0,
          };
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

      // ── EMG smoothing (less than Sparrow — want responsive jumps) ──
      st.prevEmg = st.emg;
      st.emg = st.emg * 0.75 + (st.emgRaw ?? 0) * 0.25;

      if (st.phase === 'playing') {
        // Track EMG metrics
        if (st.emg > st.emgPeak) st.emgPeak = st.emg;
        if (st.emg > 0.01) { st.emgAvgSum += st.emg; st.emgAvgCount++; }

        // ── Jump: rising-edge trigger (spike detection) ──
        const crossedUp = st.prevEmg < THRESHOLD && st.emg >= THRESHOLD;
        if (!st.jumping && crossedUp) {
          st.vel = -20; st.jumping = true;
        }

        // ── Runner physics ──
        if (st.jumping) {
          st.vel = Math.min(st.vel + 0.52 * dt, 16);
          st.runnerY = Math.min(0, st.runnerY + st.vel * dt);
          if (st.runnerY >= 0) { st.runnerY = 0; st.vel = 0; st.jumping = false; }
        }

        // ── Obstacles ──
        for (const o of st.obs) {
          o.x -= SPEED * dt;
          if (o.x < RUNNER_X + 20 && !o.scored) { o.scored = true; st.score += 15; }
          if (o.x < -OBS_W) { o.x = W + 80; o.h = 50 + Math.random() * 60; o.scored = false; }
        }

        // ── Ghost collision ──
        const now = Date.now();
        if (now - st.hitTime >= INVINCIBLE_MS) {
          for (const o of st.obs) {
            const ho = RUNNER_X + 20 > o.x && RUNNER_X - 16 < o.x + OBS_W;
            const bottom = GROUND + st.runnerY;
            const topObs = GROUND - o.h;
            if (ho && bottom > topObs + 8 && st.runnerY > -o.h + 10) {
              st.hitTime = now; st.runnerFlash = 1; break;
            }
          }
        }
        if (st.runnerFlash > 0) st.runnerFlash = Math.max(0, st.runnerFlash - 0.08 * dt);
      }

      /* ── DRAW ── */
      ctx.clearRect(0, 0, W, H);

      // Sky
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#E9DFFB'); sky.addColorStop(1, '#FFE5D6');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

      // Grid lines
      ctx.strokeStyle = `${PH.violet}28`; ctx.lineWidth = 2;
      [H * 0.32, H * 0.44, H * 0.55, H * 0.65, H * 0.75].forEach(y => {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      });

      drawHill(ctx, '#E9DFFB', 0.15, H * 0.63);
      drawHill(ctx, `${PH.violet}28`, 0.28, H * 0.72);

      // Ground
      const gg = ctx.createLinearGradient(0, GROUND, 0, H);
      gg.addColorStop(0, '#B5A6E8'); gg.addColorStop(1, '#8870D8');
      ctx.fillStyle = gg; ctx.fillRect(0, GROUND, W, H - GROUND);
      ctx.fillStyle = PH.violet; ctx.fillRect(0, GROUND, W, 4);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      for (let x = 0; x < W; x += 200) ctx.fillRect(x, GROUND + 32, 80, 4);

      for (const o of st.obs) drawObstacle(ctx, o.x, o.h);

      ctx.globalAlpha = st.runnerFlash > 0 ? 0.3 + (1 - st.runnerFlash) * 0.7 : 1;
      drawRunner(ctx, RUNNER_X, GROUND + st.runnerY, st.jumping, st.runnerFlash > 0);
      ctx.globalAlpha = 1;

      drawImpulseBar(ctx, st.emg, THRESHOLD, st.jumping);

      setUi({ score: st.score, emg: st.emg, jumping: st.jumping });
      rafRef.current = requestAnimationFrame(tick);
    };

    if (stateRef.current.emgRaw > 0.12) stateRef.current.phase = 'playing';
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [screen]);

  const { score, emg, jumping } = ui;
  const pct = Math.round(emg * 100);
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timerStr  = `${mins}:${secs.toString().padStart(2, '0')}`;
  const timerWarn = timeLeft <= 10;

  /* ════ START SCREEN ════ */
  if (screen === 'start') return (
    <div style={css.modalRoot}>
      <div style={css.modal}>
        <div style={css.modalIcon}>⚡</div>
        <div style={css.modalTitle}>Pulse Run</div>
        <div style={css.modalSub}>Раннер · Импульс мышцы</div>
        <div style={css.modalRule} />
        <div style={css.modalLabel}>ДЛИТЕЛЬНОСТЬ СЕССИИ</div>
        <div style={css.durGrid}>
          {DURATIONS.map(d => (
            <button key={d}
              style={{ ...css.durBtn, ...(duration === d ? css.durBtnActive : {}) }}
              onClick={() => setDuration(d)}>
              {d < 60 ? `${d}с` : `${d / 60} мин`}
            </button>
          ))}
        </div>
        <div style={css.modalRule} />
        <div style={css.modalHint}><span style={{ ...css.hintDot, background: PH.violet }} />Резкое сжатие мышцы — прыжок через препятствие</div>
        <div style={css.modalHint}><span style={{ ...css.hintDot, background: PH.coral }} />Очки за каждое пройденное препятствие</div>
        <div style={css.modalRule} />
        {!deviceConnected && <div style={css.warnBox}>🦾 Подключи EMG датчик перед началом</div>}
        <div style={{ display: 'flex', gap: 10, marginTop: 4, width: '100%' }}>
          <button style={css.backBtnModal} onClick={onBack}>← Назад</button>
          <button style={{ ...css.startBtn, opacity: deviceConnected ? 1 : 0.45 }}
            disabled={!deviceConnected} onClick={() => startGame(duration)}>
            Начать →
          </button>
        </div>
      </div>
    </div>
  );

  /* ════ RESULT SCREEN ════ */
  if (screen === 'result') {
    const res = resultRef.current;
    const obstacles = Math.floor((res?.score ?? 0) / 15);
    return (
      <div style={css.modalRoot}>
        <div style={css.modal}>
          <div style={css.modalIcon}>🏆</div>
          <div style={css.modalTitle}>Результат</div>
          <div style={css.modalSub}>Pulse Run · {duration}с</div>
          <div style={css.modalRule} />
          <div style={css.resultGrid}>
            <div style={css.resultBox}>
              <div style={css.resultLbl}>СЧЁТ</div>
              <div style={{ ...css.resultVal, color: PH.violet }}>{res?.score ?? 0}</div>
            </div>
            <div style={css.resultBox}>
              <div style={css.resultLbl}>ПРЫЖКОВ</div>
              <div style={css.resultVal}>{obstacles}</div>
            </div>
            <div style={css.resultBox}>
              <div style={css.resultLbl}>ЭМГ ПИКИ</div>
              <div style={{ ...css.resultVal, fontSize: 20, color: PH.coral }}>
                {Math.round((res?.emgPeak ?? 0) * 100)}%
              </div>
            </div>
          </div>
          <div style={css.modalRule} />
          <div style={{ display: 'flex', gap: 10, width: '100%' }}>
            <button style={css.backBtnModal} onClick={() => onBack(res)}>← Меню</button>
            <button style={{ ...css.startBtn, background: PH.violet }} onClick={() => startGame(duration)}>↺ Ещё раз</button>
          </div>
        </div>
      </div>
    );
  }

  /* ════ GAME SCREEN ════ */
  return (
    <div style={css.root}>
      <canvas ref={canvasRef} style={css.canvas} />

      {/* HUD */}
      <div style={css.hud}>
        <button style={css.pauseBtn} onClick={() => { clearInterval(timerRef.current); cancelAnimationFrame(rafRef.current); onBack(null); }}>◀ Выйти</button>
        <div style={css.scoreBox}>
          <div style={css.scoreItem}>
            <span style={css.scoreLbl}>SCORE</span>
            <span style={{ ...css.scoreVal, color: PH.violet }}>{score.toLocaleString()}</span>
          </div>
          <div style={css.divider} />
          <div style={css.scoreItem}>
            <span style={css.scoreLbl}>ИМПУЛЬС</span>
            <span style={{ ...css.scoreVal, color: jumping ? PH.violet : PH.ink, fontSize: jumping ? 18 : 22 }}>
              {jumping ? '⚡ ПРЫЖОК' : `${pct}%`}
            </span>
          </div>
        </div>
        {/* Timer */}
        <div style={{ ...css.timerBox, borderColor: timerWarn ? `${PH.coral}88` : PH.hair, background: timerWarn ? `${PH.coral}12` : 'rgba(255,255,255,0.92)' }}>
          <span style={{ fontFamily: PH.fontMono, fontSize: 9, color: timerWarn ? PH.coral : PH.inkFaint, letterSpacing: '0.1em', marginBottom: 1 }}>ВРЕМЯ</span>
          <span style={{ fontFamily: PH.fontSans, fontSize: 22, fontWeight: 700, color: timerWarn ? PH.coral : PH.ink, lineHeight: 1 }}>{timerStr}</span>
        </div>
        <div style={{ ...css.sensorPill, borderColor: deviceConnected ? `${PH.violet}55` : `${PH.coral}55` }}>
          <span style={{ ...css.sensorDot, background: deviceConnected ? PH.violet : PH.coral, boxShadow: deviceConnected ? `0 0 10px ${PH.violet}` : 'none' }} className={deviceConnected ? 'dot-connected' : ''} />
          {deviceConnected ? 'ДАТЧИК · ПОДКЛЮЧЁН' : 'ДАТЧИК · НЕТ'}
        </div>
      </div>

      {/* Wave strip */}
      <div style={css.waveStrip}>
        <div style={css.waveMeta}>
          <span style={{ fontFamily: PH.fontMono, fontSize: 10, letterSpacing: '0.1em', color: PH.inkDim }}>СИГНАЛ EMG</span>
          <span style={{ fontFamily: PH.fontMono, fontSize: 10, color: deviceConnected ? PH.violet : PH.inkFaint, fontWeight: 700 }}>
            {deviceConnected ? `● ${pct}%` : '— НЕТ СИГНАЛА'}
          </span>
        </div>
        <EMGWave width={W - 120} height={40} intensity={Math.max(emg, 0.4)} density={1.6} />
      </div>

      {/* Idle hint */}
      {stateRef.current.phase === 'idle' && deviceConnected && (
        <div style={css.hint}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: PH.violet, boxShadow: `0 0 8px ${PH.violet}`, display: 'inline-block' }} />
          Резкое сжатие мышцы — прыжок!
        </div>
      )}

      {/* No device overlay */}
      {!deviceConnected && (
        <div style={css.overlay}>
          <span style={{ fontSize: 56 }}>🦾</span>
          <span style={css.ovTitle}>Подключи EMG датчик</span>
          <span style={css.ovSub}>Подключи Arduino — игра стартует автоматически.</span>
          <button style={{ ...css.ovBtn, background: PH.ink, marginTop: 8 }} onClick={onBack}>← Назад в меню</button>
        </div>
      )}
    </div>
  );
}

/* ── Drawing helpers ── */
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
  ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(x, botY + h - 4, OBS_W, 4);
  ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(x + 4, botY, 4, h);
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
  ctx.font = `500 10px monospace`; ctx.fillStyle = PH.inkDim; ctx.textAlign = 'left';
  ctx.fillText('СИГНАЛ ИМПУЛЬСА', bx, by - 10);
  const stateText = jumping ? '⚡ ПРЫЖОК!' : `${Math.round(emg * 100)}% — резкий импульс → прыжок`;
  ctx.textAlign = 'right'; ctx.fillStyle = jumping ? PH.violet : PH.inkFaint;
  ctx.font = `700 11px monospace`; ctx.fillText(stateText, bx + bw, by - 10);
  ctx.fillStyle = PH.bgSoft;
  ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, br); ctx.fill();
  ctx.fillStyle = jumping ? PH.violet : PH.violetSoft;
  ctx.beginPath(); ctx.roundRect(bx, by, bw * emg, bh, br); ctx.fill();
  ctx.strokeStyle = PH.coral; ctx.lineWidth = 3;
  ctx.shadowColor = PH.coral; ctx.shadowBlur = 8;
  const tx = bx + bw * threshold;
  ctx.beginPath(); ctx.moveTo(tx, by - 2); ctx.lineTo(tx, by + bh + 2); ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.font = `400 9px monospace`; ctx.fillStyle = PH.inkFaint;
  ctx.textAlign = 'left'; ctx.fillText('покой', bx, by + bh + 16);
  ctx.textAlign = 'center'; ctx.fillStyle = PH.coral; ctx.fillText('↑ порог прыжка', tx, by + bh + 16);
  ctx.textAlign = 'right'; ctx.fillStyle = PH.inkFaint; ctx.fillText('макс', bx + bw, by + bh + 16);
}

const css = {
  root: { width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', userSelect: 'none' },
  canvas: { position: 'absolute', inset: 0, width: '100%', height: '100%' },
  hud: { position: 'absolute', top: 16, left: 16, right: 16, display: 'flex', alignItems: 'center', gap: 12, zIndex: 10 },
  pauseBtn: { padding: '8px 14px', borderRadius: 999, border: `1px solid ${PH.hair}`, background: 'rgba(255,255,255,0.92)', fontFamily: PH.fontMono, fontSize: 12, color: PH.ink, cursor: 'pointer' },
  scoreBox: { display: 'flex', alignItems: 'center', gap: 16, padding: '8px 18px', borderRadius: 999, background: 'rgba(255,255,255,0.92)', border: `1px solid ${PH.hair}` },
  scoreItem: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  scoreLbl: { fontFamily: PH.fontMono, fontSize: 9, color: PH.inkFaint, letterSpacing: '0.1em' },
  scoreVal: { fontFamily: PH.fontSans, fontSize: 22, fontWeight: 700, color: PH.ink, lineHeight: 1 },
  divider: { width: 1, height: 28, background: PH.hair },
  timerBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6px 16px', borderRadius: 999, border: '1px solid', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' },
  sensorPill: { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.92)', border: '1px solid', fontFamily: PH.fontMono, fontSize: 10, color: PH.ink, letterSpacing: '0.08em' },
  sensorDot: { width: 8, height: 8, borderRadius: '50%', display: 'inline-block' },
  waveStrip: { position: 'absolute', bottom: 100, left: 100, right: 24, padding: '10px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.92)', border: `1px solid ${PH.hair}`, zIndex: 5 },
  waveMeta: { display: 'flex', justifyContent: 'space-between', marginBottom: 4 },
  hint: { position: 'absolute', bottom: 200, left: '50%', transform: 'translateX(-50%)', padding: '10px 20px', borderRadius: 999, background: 'rgba(255,255,255,0.94)', border: `1px solid ${PH.hair}`, fontFamily: PH.fontSans, fontSize: 14, color: PH.ink, display: 'flex', alignItems: 'center', gap: 8, zIndex: 8, whiteSpace: 'nowrap' },
  overlay: { position: 'absolute', inset: 0, background: 'rgba(245,242,236,0.97)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, zIndex: 20 },
  ovTitle: { fontFamily: PH.fontSans, fontSize: 32, fontWeight: 700, color: PH.ink },
  ovSub: { fontFamily: PH.fontSans, fontSize: 15, color: PH.inkDim, textAlign: 'center', lineHeight: 1.6, maxWidth: 400 },
  ovBtn: { padding: '12px 28px', borderRadius: 12, border: 'none', cursor: 'pointer', fontFamily: PH.fontSans, fontSize: 16, fontWeight: 600, color: '#FFF' },
  /* modals */
  modalRoot: { width: '100vw', height: '100vh', background: PH.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: PH.fontSans },
  modal: { background: PH.bgAlt, border: `1px solid ${PH.hair}`, borderRadius: 24, padding: '36px 40px', width: 420, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, boxShadow: '0 16px 64px rgba(0,0,0,0.10)' },
  modalIcon: { fontSize: 48, lineHeight: 1 },
  modalTitle: { fontFamily: PH.fontSans, fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', color: PH.ink },
  modalSub: { fontFamily: PH.fontMono, fontSize: 11, color: PH.inkFaint, letterSpacing: '0.08em' },
  modalRule: { width: '100%', height: 1, background: PH.hair },
  modalLabel: { fontFamily: PH.fontMono, fontSize: 9, color: PH.inkFaint, letterSpacing: '0.12em', alignSelf: 'flex-start' },
  durGrid: { display: 'flex', gap: 8, width: '100%' },
  durBtn: { flex: 1, padding: '10px 0', borderRadius: 12, border: `1.5px solid ${PH.hair}`, background: PH.bg, fontFamily: PH.fontSans, fontSize: 14, fontWeight: 600, color: PH.inkDim, cursor: 'pointer' },
  durBtnActive: { background: PH.violet, color: '#FFF', borderColor: PH.violet },
  modalHint: { display: 'flex', alignItems: 'center', gap: 8, fontFamily: PH.fontSans, fontSize: 13, color: PH.inkDim, alignSelf: 'flex-start' },
  hintDot: { width: 7, height: 7, borderRadius: '50%', flexShrink: 0 },
  warnBox: { background: `${PH.coral}15`, border: `1px solid ${PH.coral}44`, borderRadius: 10, padding: '10px 16px', fontFamily: PH.fontSans, fontSize: 13, color: PH.coral, width: '100%', textAlign: 'center', boxSizing: 'border-box' },
  backBtnModal: { flex: 1, padding: '13px 0', borderRadius: 13, border: `1.5px solid ${PH.hair}`, background: PH.bg, fontFamily: PH.fontSans, fontSize: 15, fontWeight: 600, color: PH.inkDim, cursor: 'pointer' },
  startBtn: { flex: 2, padding: '13px 0', borderRadius: 13, border: 'none', background: PH.ink, fontFamily: PH.fontSans, fontSize: 15, fontWeight: 600, color: '#FFF', cursor: 'pointer' },
  resultGrid: { display: 'flex', gap: 10, width: '100%' },
  resultBox: { flex: 1, background: PH.bg, borderRadius: 12, padding: '14px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', border: `1px solid ${PH.hair}` },
  resultLbl: { fontFamily: PH.fontMono, fontSize: 9, color: PH.inkFaint, letterSpacing: '0.1em' },
  resultVal: { fontFamily: PH.fontSans, fontSize: 28, fontWeight: 700, color: PH.ink, marginTop: 4 },
};
