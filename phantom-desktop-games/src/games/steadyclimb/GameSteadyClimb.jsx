/**
 * GameSteadyClimb — Climber · EMG zone-hold
 * ──────────────────────────────────────────
 * Critical fix: rawDt was undefined → crash. Now uses dt correctly.
 * Added: start screen, duration selector, timer, result screen, session saving.
 */
import React, { useRef, useEffect, useState } from 'react';
import { PH } from '../../theme';
import EMGWave from '../../shared/EMGWave';
import { useSensor } from '../../hooks/useSensor';

const W = window.innerWidth, H = window.innerHeight;
const TARGET_MIN = 0.38, TARGET_MAX = 0.65;   // zone for holding (wider = more forgiving)
const METER_X = W - 120, METER_Y = 110, METER_H = H - 220, METER_W = 40;
const DURATIONS = [30, 60, 90, 120];

const CHECKPOINTS = [
  { x: W * 0.25, y: H * 0.82 },
  { x: W * 0.38, y: H * 0.62 },
  { x: W * 0.52, y: H * 0.42 },
  { x: W * 0.44, y: H * 0.22 },
  { x: W * 0.55, y: H * 0.10 },
];

export default function GameSteadyClimb({ onBack }) {
  const { deviceConnected, sensorData } = useSensor();

  const [screen,   setScreen]   = useState('start');
  const [duration, setDuration] = useState(60);
  const [timeLeft, setTimeLeft] = useState(60);
  const [ui,       setUi]       = useState({ score: 0, hold: 0, meters: 0, emg: 0, inZone: false });

  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const timerRef  = useRef(null);
  const resultRef = useRef(null);

  const stateRef = useRef({
    emg: 0, emgRaw: 0,
    emgPeak: 0, emgAvgSum: 0, emgAvgCount: 0,
    score: 0, hold: 0, meters: 0,
    phase: 'idle', lastTime: null,
    climberProgress: 0,
    duration: 60,
  });

  /* ── sensor → emgRaw ── */
  useEffect(() => {
    if (!deviceConnected || !sensorData) { stateRef.current.emgRaw = 0; return; }
    const norm = Math.max(0, Math.min(1, sensorData.norm ?? 0));
    stateRef.current.emgRaw = norm;
    if (norm > 0.02 && stateRef.current.phase === 'idle' && screen === 'playing') {
      stateRef.current.phase = 'playing';
    }
  }, [sensorData, deviceConnected, screen]);

  /* ── start / reset ── */
  const startGame = (dur) => {
    const st = stateRef.current;
    st.emg       = 0;
    st.emgRaw    = 0;
    st.emgPeak   = 0;
    st.emgAvgSum = 0;
    st.emgAvgCount = 0;
    st.score     = 0;
    st.hold      = 0;
    st.meters    = 0;
    st.climberProgress = 0;
    st.lastTime  = null;
    st.phase     = 'idle';
    st.duration  = dur;
    resultRef.current = null;
    setUi({ score: 0, hold: 0, meters: 0, emg: 0, inZone: false });
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
            score: Math.round(st.score),
            durationSec: st.duration,
            emgPeak: st.emgPeak,
            emgAvg: st.emgAvgCount > 0 ? st.emgAvgSum / st.emgAvgCount : 0,
            meters: Math.round(st.meters),
            holdSec: +st.hold.toFixed(1),
            precisionScore: Math.round((st.hold / st.duration) * 100),
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
    // Fix blurry canvas on HiDPI/retina screens
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(dpr, dpr);

    const tick = (time) => {
      const st = stateRef.current;
      if (!st.lastTime) st.lastTime = time;
      // dt in SECONDS — critical fix: was using undefined rawDt
      const dt = Math.min((time - st.lastTime) / 1000, 0.1);
      st.lastTime = time;

      // EMG smoothing
      st.emg = st.emg * 0.82 + (st.emgRaw ?? 0) * 0.18;

      const inZone = st.emg >= TARGET_MIN && st.emg <= TARGET_MAX;

      if (st.phase === 'playing') {
        // Track EMG metrics
        if (st.emg > st.emgPeak) st.emgPeak = st.emg;
        if (st.emg > 0.01) { st.emgAvgSum += st.emg; st.emgAvgCount++; }

        // Climb logic — proportional: closer to zone center = faster climb
        // Zone center = (TARGET_MIN + TARGET_MAX) / 2
        const zoneCenter = (TARGET_MIN + TARGET_MAX) / 2;
        const zoneHalf   = (TARGET_MAX - TARGET_MIN) / 2;
        // 0 at zone edge → 1 at zone center
        const zoneFraction = inZone
          ? 1 - Math.abs(st.emg - zoneCenter) / zoneHalf
          : 0;

        if (inZone) {
          st.hold += dt;
          const climbRate = 0.5 + zoneFraction * 1.5;   // 0.5–2.0 m/s depending on precision
          st.meters += dt * climbRate;
          st.score  += dt * 20 * (0.5 + zoneFraction);  // bonus points for hitting center
          st.climberProgress = Math.min(st.climberProgress + dt * 0.04 * (0.5 + zoneFraction * 0.5), 1);
        } else {
          st.hold = Math.max(0, st.hold - dt * 0.5);
          st.climberProgress = Math.max(0, st.climberProgress - dt * 0.01);
        }
      }

      /* ── DRAW ── */
      ctx.clearRect(0, 0, W, H);

      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#FFE5D6'); sky.addColorStop(0.5, '#FCD8C2'); sky.addColorStop(1, '#E89E7E');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

      const sg = ctx.createRadialGradient(W - 130, 90, 0, W - 130, 90, 130);
      sg.addColorStop(0, 'rgba(255,224,122,0.85)'); sg.addColorStop(1, 'rgba(255,224,122,0)');
      ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(W - 130, 90, 130, 0, Math.PI * 2); ctx.fill();

      drawMountains(ctx);
      drawRopePath(ctx);
      drawHeightLadder(ctx, st.climberProgress);

      const cpIdx = Math.floor(st.climberProgress * (CHECKPOINTS.length - 1));
      const cpFrac = (st.climberProgress * (CHECKPOINTS.length - 1)) % 1;
      const cp0 = CHECKPOINTS[Math.min(cpIdx, CHECKPOINTS.length - 1)];
      const cp1 = CHECKPOINTS[Math.min(cpIdx + 1, CHECKPOINTS.length - 1)];
      const clX = cp0.x + (cp1.x - cp0.x) * cpFrac;
      const clY = cp0.y + (cp1.y - cp0.y) * cpFrac;
      drawClimber(ctx, clX, clY, inZone);

      drawZoneMeter(ctx, st.emg, inZone);
      drawBottomInfo(ctx, inZone, st.hold, st.meters);

      setUi({
        score: Math.round(st.score),
        hold: +st.hold.toFixed(1),
        meters: Math.round(st.meters),
        emg: st.emg,
        inZone,
      });
      rafRef.current = requestAnimationFrame(tick);
    };

    if (stateRef.current.emgRaw > 0.02) stateRef.current.phase = 'playing';
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [screen]);

  const { score, hold, meters, emg, inZone } = ui;
  const pct = Math.round(emg * 100);
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timerStr  = `${mins}:${secs.toString().padStart(2, '0')}`;
  const timerWarn = timeLeft <= 10;

  /* ════ START SCREEN ════ */
  if (screen === 'start') return (
    <div style={css.modalRoot}>
      <div style={css.modal}>
        <div style={css.modalIcon}>🧗</div>
        <div style={css.modalTitle}>Steady Climb</div>
        <div style={css.modalSub}>Альпинист · Дозирование усилия</div>
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
        <div style={css.modalHint}><span style={{ ...css.hintDot, background: PH.coral }} />Удерживай мышцу в зелёной зоне — альпинист поднимается</div>
        <div style={css.modalHint}><span style={{ ...css.hintDot, background: PH.lime }} />Зона: {Math.round(TARGET_MIN*100)}%–{Math.round(TARGET_MAX*100)}% от максимума — не слишком сильно и не слабо</div>
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
    return (
      <div style={css.modalRoot}>
        <div style={css.modal}>
          <div style={css.modalIcon}>🏔️</div>
          <div style={css.modalTitle}>Результат</div>
          <div style={css.modalSub}>Steady Climb · {duration}с</div>
          <div style={css.modalRule} />
          <div style={css.resultGrid}>
            <div style={css.resultBox}>
              <div style={css.resultLbl}>МЕТРОВ</div>
              <div style={{ ...css.resultVal, color: PH.coral }}>{res?.meters ?? 0}</div>
            </div>
            <div style={css.resultBox}>
              <div style={css.resultLbl}>В ЗОНЕ</div>
              <div style={css.resultVal}>{res?.holdSec ?? 0}с</div>
            </div>
            <div style={css.resultBox}>
              <div style={css.resultLbl}>СЧЁТ</div>
              <div style={{ ...css.resultVal, fontSize: 22 }}>{res?.score ?? 0}</div>
            </div>
          </div>
          <div style={css.modalRule} />
          <div style={{ display: 'flex', gap: 10, width: '100%' }}>
            <button style={css.backBtnModal} onClick={() => onBack(res)}>← Меню</button>
            <button style={{ ...css.startBtn, background: PH.coral }} onClick={() => startGame(duration)}>↺ Ещё раз</button>
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
          <div style={css.div} />
          <div style={css.scoreItem}>
            <span style={css.scoreLbl}>ЗОНА</span>
            <span style={{ ...css.scoreVal, fontSize: 18, color: inZone ? PH.ok : PH.inkFaint }}>
              {inZone ? '● ДА' : '○ НЕТ'}
            </span>
          </div>
        </div>
        {/* Timer */}
        <div style={{ ...css.timerBox, borderColor: timerWarn ? `${PH.coral}88` : PH.hair, background: timerWarn ? `${PH.coral}12` : 'rgba(255,255,255,0.92)' }}>
          <span style={{ fontFamily: PH.fontMono, fontSize: 9, color: timerWarn ? PH.coral : PH.inkFaint, letterSpacing: '0.1em', marginBottom: 1 }}>ВРЕМЯ</span>
          <span style={{ fontFamily: PH.fontSans, fontSize: 22, fontWeight: 700, color: timerWarn ? PH.coral : PH.ink, lineHeight: 1 }}>{timerStr}</span>
        </div>
        <div style={{ ...css.sensorPill, borderColor: deviceConnected ? `${PH.coral}55` : `${PH.coral}44` }}>
          <span style={{ ...css.sensorDot, background: deviceConnected ? PH.coral : PH.inkFaint, boxShadow: deviceConnected ? `0 0 10px ${PH.coral}` : 'none' }} className={deviceConnected ? 'dot-connected' : ''} />
          {deviceConnected ? `ДАТЧИК · ${pct}%` : 'ДАТЧИК · НЕТ'}
        </div>
      </div>

      {/* Wave strip */}
      <div style={css.waveStrip}>
        <div style={css.waveMeta}>
          <span style={{ fontFamily: PH.fontMono, fontSize: 10, letterSpacing: '0.1em', color: PH.inkDim }}>СИГНАЛ EMG</span>
          <span style={{ fontFamily: PH.fontMono, fontSize: 10, color: inZone ? PH.ok : PH.coral, fontWeight: 700 }}>
            {inZone ? `● В ЗОНЕ · ${pct}%` : `✕ ВНЕ ЗОНЫ · ${pct}%`}
          </span>
        </div>
        <EMGWave width={W - METER_W - 180} height={40} intensity={deviceConnected ? Math.max(emg, 0.05) : 0.05} density={1.6} />
      </div>

      {/* Idle hint */}
      {stateRef.current.phase === 'idle' && deviceConnected && (
        <div style={css.hint}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: PH.coral, boxShadow: `0 0 8px ${PH.coral}`, display: 'inline-block' }} />
          Удерживай сжатие в зелёной зоне — альпинист поднимается!
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
function drawMountains(ctx) {
  ctx.fillStyle = '#D67555'; ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.moveTo(-50, H);
  ctx.lineTo(W * 0.06, H * 0.38); ctx.lineTo(W * 0.14, H * 0.47);
  ctx.lineTo(W * 0.24, H * 0.20); ctx.lineTo(W * 0.36, H * 0.35);
  ctx.lineTo(W * 0.48, H * 0.10); ctx.lineTo(W * 0.62, H * 0.28);
  ctx.lineTo(W * 0.76, H * 0.18); ctx.lineTo(W * 0.88, H * 0.32);
  ctx.lineTo(W + 50, H);
  ctx.closePath(); ctx.fill();

  ctx.fillStyle = '#FFF'; ctx.globalAlpha = 0.75;
  [[W * 0.24, H * 0.20], [W * 0.48, H * 0.10], [W * 0.76, H * 0.18]].forEach(([px, py]) => {
    ctx.beginPath();
    ctx.moveTo(px, py); ctx.lineTo(px + 24, py + 36); ctx.lineTo(px - 24, py + 36);
    ctx.closePath(); ctx.fill();
  });

  ctx.fillStyle = '#B85839'; ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.moveTo(-50, H);
  ctx.lineTo(W * 0.04, H * 0.54); ctx.lineTo(W * 0.13, H * 0.69);
  ctx.lineTo(W * 0.24, H * 0.45); ctx.lineTo(W * 0.35, H * 0.65);
  ctx.lineTo(W * 0.48, H * 0.32); ctx.lineTo(W * 0.62, H * 0.43);
  ctx.lineTo(W * 0.76, H * 0.36); ctx.lineTo(W * 0.88, H * 0.46);
  ctx.lineTo(W + 50, H * 0.77); ctx.lineTo(W + 50, H);
  ctx.closePath(); ctx.fill();
  ctx.globalAlpha = 1;
}

function drawRopePath(ctx) {
  ctx.strokeStyle = 'rgba(184,88,57,0.5)'; ctx.lineWidth = 4;
  ctx.setLineDash([8, 6]); ctx.lineCap = 'round';
  ctx.beginPath();
  CHECKPOINTS.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.stroke(); ctx.setLineDash([]);

  CHECKPOINTS.forEach((p, i) => {
    const isTop = i === CHECKPOINTS.length - 1;
    ctx.beginPath(); ctx.arc(p.x, p.y, 9, 0, Math.PI * 2);
    ctx.fillStyle = isTop ? PH.coral : '#FFF'; ctx.fill();
    ctx.strokeStyle = PH.coral; ctx.lineWidth = 2.5; ctx.stroke();
    if (isTop) {
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
  ctx.fillStyle = PH.ink; ctx.font = `700 9px monospace`;
  ctx.textAlign = 'center'; ctx.fillText('ВЫСОТА', lx + 2, ly - 12);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.beginPath(); ctx.roundRect(lx, ly, 4, lh, 2); ctx.fill();
  [100, 75, 50, 25, 0].forEach(p => {
    const y = ly + lh * (1 - p / 100);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(lx - 6, y - 1, 10, 2);
    ctx.fillStyle = PH.inkDim; ctx.font = `400 9px monospace`;
    ctx.textAlign = 'left'; ctx.fillText(p + 'm', lx + 10, y + 3);
  });
  const markerY = ly + lh * (1 - progress);
  ctx.fillStyle = PH.coral; ctx.shadowColor = PH.coral; ctx.shadowBlur = 10;
  ctx.beginPath(); ctx.arc(lx + 2, markerY, 7, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
}

function drawClimber(ctx, x, y, inZone) {
  if (inZone) { ctx.shadowColor = PH.lime; ctx.shadowBlur = 20; }
  ctx.fillStyle = PH.ink;
  ctx.beginPath(); ctx.arc(x, y - 55, 11, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 9, y - 44); ctx.lineTo(x - 14, y - 22);
  ctx.lineTo(x - 5, y - 22); ctx.lineTo(x - 9, y - 5);
  ctx.lineTo(x - 1, y - 8); ctx.lineTo(x + 7, y - 22);
  ctx.lineTo(x + 14, y - 22); ctx.lineTo(x + 9, y - 44); ctx.closePath(); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = PH.coral; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - 4, y - 36); ctx.lineTo(x + 24, y - 56); ctx.stroke();
  ctx.setLineDash([4, 3]);
  ctx.beginPath(); ctx.moveTo(x, y - 28); ctx.lineTo(x + 18, y - 42); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = inZone ? PH.limeBright : PH.coral;
  ctx.shadowColor = inZone ? PH.limeBright : PH.coral; ctx.shadowBlur = 8;
  ctx.beginPath(); ctx.arc(x + 4, y - 60, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
}

function drawZoneMeter(ctx, emg, inZone) {
  const mx = METER_X, my = METER_Y, mw = METER_W, mh = METER_H, mr = 20;
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.beginPath(); ctx.roundRect(mx - 10, my - 32, mw + 20, 24, 12); ctx.fill();
  ctx.fillStyle = PH.ink; ctx.font = `700 10px monospace`; ctx.textAlign = 'center';
  ctx.fillText('ДЕРЖИ В ЗОНЕ', mx + mw / 2, my - 14);
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.beginPath(); ctx.roundRect(mx, my, mw, mh, mr); ctx.fill();
  ctx.strokeStyle = PH.hair; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(mx, my, mw, mh, mr); ctx.stroke();
  const zBot = my + mh - TARGET_MIN * mh;
  const zTop = my + mh - TARGET_MAX * mh;
  const zH = zBot - zTop;
  ctx.fillStyle = inZone ? `${PH.limeBright}55` : `${PH.lime}22`;
  ctx.fillRect(mx - 6, zTop, mw + 12, zH);
  ctx.strokeStyle = PH.lime; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
  ctx.beginPath(); ctx.moveTo(mx - 8, zTop); ctx.lineTo(mx + mw + 8, zTop); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(mx - 8, zBot); ctx.lineTo(mx + mw + 8, zBot); ctx.stroke();
  ctx.setLineDash([]);
  const midZone = (zTop + zBot) / 2;
  ctx.save(); ctx.translate(mx - 16, midZone); ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = PH.lime; ctx.font = `700 10px monospace`; ctx.textAlign = 'center';
  ctx.fillText('ЦЕЛЬ', 0, 0);
  ctx.restore();
  const markerY = my + mh - emg * mh;
  ctx.fillStyle = inZone ? PH.lime : PH.coral;
  ctx.shadowColor = inZone ? PH.lime : PH.coral; ctx.shadowBlur = 12;
  ctx.beginPath(); ctx.roundRect(mx - 10, markerY - 3, mw + 20, 6, 3); ctx.fill();
  ctx.shadowBlur = 0;
  [0.25, 0.5, 0.75].forEach(t => {
    const y = my + mh - t * mh;
    ctx.strokeStyle = 'rgba(0,0,0,0.08)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(mx, y); ctx.lineTo(mx + mw - 10, y); ctx.stroke();
  });
  const pillW = 100, pillX = mx + mw / 2 - pillW / 2;
  ctx.fillStyle = inZone ? PH.limeSoft : '#FCE6DD';
  ctx.beginPath(); ctx.roundRect(pillX, my + mh + 14, pillW, 28, 14); ctx.fill();
  ctx.strokeStyle = inZone ? `${PH.lime}44` : `${PH.coral}44`; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(pillX, my + mh + 14, pillW, 28, 14); ctx.stroke();
  ctx.fillStyle = inZone ? PH.lime : PH.coral;
  ctx.font = `700 11px monospace`; ctx.textAlign = 'center';
  ctx.fillText(inZone ? '● В ЦЕЛИ' : '✕ ВНЕ ЗОНЫ', mx + mw / 2, my + mh + 33);
  ctx.fillStyle = PH.inkDim; ctx.font = `400 10px monospace`;
  ctx.fillText(`${Math.round(emg * 100)}%  цель ${Math.round(TARGET_MIN*100)}–${Math.round(TARGET_MAX*100)}`, mx + mw / 2, my + mh + 58);
}

function drawBottomInfo(ctx, inZone, hold, meters) {
  const bx = 80, by = H - 80, bw = METER_X - bx - 30, bh = 60, br = 14;
  ctx.fillStyle = 'rgba(255,255,255,0.94)';
  ctx.beginPath(); ctx.roundRect(bx, by - bh, bw, bh, br); ctx.fill();
  ctx.strokeStyle = PH.hair; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(bx, by - bh, bw, bh, br); ctx.stroke();
  ctx.fillStyle = inZone ? PH.ok : PH.ink; ctx.font = `600 14px "Space Grotesk", sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText(inZone ? '✓ В зоне! Держи мышцу...' : 'Не слишком сильно, не слишком слабо', bx + 16, by - bh + 24);
  ctx.fillStyle = PH.inkDim; ctx.font = `400 12px "Space Grotesk", sans-serif`;
  ctx.fillText('Каждая секунда в зоне = 1 метр вверх. Тренирует дозирование.', bx + 16, by - bh + 44);
  ctx.fillStyle = PH.inkFaint; ctx.font = `500 9px monospace`; ctx.textAlign = 'right';
  ctx.fillText('УДЕРЖАНИЕ', bx + bw - 16, by - bh + 20);
  ctx.fillStyle = PH.coral; ctx.font = `700 22px "Space Grotesk", sans-serif`;
  ctx.fillText(`${hold.toFixed(1)}s`, bx + bw - 16, by - bh + 46);
}

const css = {
  root: { width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', userSelect: 'none' },
  canvas: { position: 'absolute', inset: 0, width: '100%', height: '100%' },
  hud: { position: 'absolute', top: 16, left: 16, right: 16, display: 'flex', alignItems: 'center', gap: 12, zIndex: 10 },
  pauseBtn: { padding: '8px 14px', borderRadius: 999, border: `1px solid ${PH.hair}`, background: 'rgba(255,255,255,0.92)', fontFamily: PH.fontMono, fontSize: 12, color: PH.ink, cursor: 'pointer' },
  scoreBox: { display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.92)', border: `1px solid ${PH.hair}` },
  scoreItem: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  scoreLbl: { fontFamily: PH.fontMono, fontSize: 9, color: PH.inkFaint, letterSpacing: '0.1em' },
  scoreVal: { fontFamily: PH.fontSans, fontSize: 22, fontWeight: 700, lineHeight: 1 },
  div: { width: 1, height: 28, background: PH.hair },
  timerBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6px 16px', borderRadius: 999, border: '1px solid', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' },
  sensorPill: { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.92)', border: '1px solid', fontFamily: PH.fontMono, fontSize: 10, color: PH.ink },
  sensorDot: { width: 8, height: 8, borderRadius: '50%', display: 'inline-block' },
  waveStrip: { position: 'absolute', bottom: 12, left: 100, right: METER_W + 100, padding: '10px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.92)', border: `1px solid ${PH.hair}`, zIndex: 5 },
  waveMeta: { display: 'flex', justifyContent: 'space-between', marginBottom: 4 },
  hint: { position: 'absolute', bottom: 110, left: '50%', transform: 'translateX(-50%)', padding: '10px 20px', borderRadius: 999, background: 'rgba(255,255,255,0.94)', border: `1px solid ${PH.hair}`, fontFamily: PH.fontSans, fontSize: 14, color: PH.ink, display: 'flex', alignItems: 'center', gap: 8, zIndex: 8, whiteSpace: 'nowrap' },
  overlay: { position: 'absolute', inset: 0, background: 'rgba(245,242,236,0.97)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, zIndex: 20 },
  ovTitle: { fontFamily: PH.fontSans, fontSize: 32, fontWeight: 700, color: PH.ink },
  ovSub: { fontFamily: PH.fontSans, fontSize: 15, color: PH.inkDim, textAlign: 'center', lineHeight: 1.6, maxWidth: 400 },
  ovBtn: { padding: '12px 28px', borderRadius: 12, border: 'none', cursor: 'pointer', fontFamily: PH.fontSans, fontSize: 16, fontWeight: 600, color: '#FFF' },
  /* modals */
  modalRoot: { width: '100vw', height: '100vh', background: PH.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: PH.fontSans },
  modal: { background: PH.bgAlt, border: `1px solid ${PH.hair}`, borderRadius: 24, padding: '36px 40px', width: 440, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, boxShadow: '0 16px 64px rgba(0,0,0,0.10)' },
  modalIcon: { fontSize: 48, lineHeight: 1 },
  modalTitle: { fontFamily: PH.fontSans, fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', color: PH.ink },
  modalSub: { fontFamily: PH.fontMono, fontSize: 11, color: PH.inkFaint, letterSpacing: '0.08em' },
  modalRule: { width: '100%', height: 1, background: PH.hair },
  modalLabel: { fontFamily: PH.fontMono, fontSize: 9, color: PH.inkFaint, letterSpacing: '0.12em', alignSelf: 'flex-start' },
  durGrid: { display: 'flex', gap: 8, width: '100%' },
  durBtn: { flex: 1, padding: '10px 0', borderRadius: 12, border: `1.5px solid ${PH.hair}`, background: PH.bg, fontFamily: PH.fontSans, fontSize: 14, fontWeight: 600, color: PH.inkDim, cursor: 'pointer' },
  durBtnActive: { background: PH.coral, color: '#FFF', borderColor: PH.coral },
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
