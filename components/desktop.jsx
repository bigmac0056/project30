// Desktop gameplay — Sparrow, Pulse Run, Steady Climb on a wider canvas, light theme.

function ScreenDesktop({ emgLevel = 0.7, threshold = 0.45 }) {
  const W = 960, H = 600;
  const birdY = H * 0.7 - emgLevel * (H * 0.55);
  return (
    <div style={{
      width: W, height: H, position: 'relative', overflow: 'hidden',
      background: 'linear-gradient(180deg, #DCE8F2 0%, #F7E4B8 100%)',
      fontFamily: PH.fontText, color: PH.ink, borderRadius: 12,
      border: `1px solid ${PH.hair}`,
    }}>
      <DesktopChrome title="Phantom — Sparrow · Уровень 4" />
      <DesktopHUD score="4,820" combo="×12" level="4 / 12" />
      <DesktopSensor />

      <div style={{ position: 'absolute', right: 80, top: 110, width: 90, height: 90, borderRadius: 999,
        background: 'radial-gradient(circle, #FFE07A, #F4B850)', boxShadow: '0 0 60px rgba(244,184,80,0.5)' }} />
      <Cloud left={120} top={130} w={90} />
      <Cloud left={650} top={200} w={70} />
      <Cloud left={400} top={260} w={60} />

      <div style={{ position: 'absolute', bottom: 90, left: 0, right: 0, height: 130,
        background: 'linear-gradient(180deg, #88C36F, #4F8B3D)',
        clipPath: 'polygon(0 60%, 12% 30%, 25% 50%, 40% 20%, 55% 40%, 70% 25%, 85% 45%, 100% 30%, 100% 100%, 0 100%)' }} />

      <SparrowObstacle left={520} topGap={140} bottomGap={290} />
      <SparrowObstacle left={780} topGap={200} bottomGap={230} dim />

      <DesktopEMGMeter emgLevel={emgLevel} threshold={threshold} />

      <div style={{
        position: 'absolute', left: 240, top: birdY,
        width: 76, height: 76, borderRadius: 999,
        background: PH.lime, display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 8px 30px rgba(61,122,31,0.4), 0 0 0 8px rgba(127,203,58,0.2)`,
        transition: 'top 0.25s cubic-bezier(.4,.9,.4,1)', zIndex: 3,
      }}>
        <svg width="46" height="46" viewBox="0 0 24 24"><path d="M3 14 Q 10 6, 18 12 L 22 8 L 21 14 Q 18 18, 12 18 Q 6 18, 3 14 Z" fill="#FFFFFF" /></svg>
      </div>
      <div style={{ position: 'absolute', left: 130, top: birdY + 30, width: 110, height: 6,
        background: `linear-gradient(90deg, transparent, ${PH.lime})`, opacity: 0.4, borderRadius: 3 }} />

      <DesktopWaveStrip />
      <DesktopHint>Удерживай в зелёной зоне 3 сек → бонус</DesktopHint>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
function ScreenDesktopPulseRun({ emgLevel = 0.6, threshold = 0.55 }) {
  const W = 960, H = 600;
  const jumping = emgLevel > threshold;
  const runnerY = jumping ? H - 280 : H - 180;
  return (
    <div style={{
      width: W, height: H, position: 'relative', overflow: 'hidden',
      background: 'linear-gradient(180deg, #E9DFFB 0%, #FFE5D6 100%)',
      fontFamily: PH.fontText, color: PH.ink, borderRadius: 12,
      border: `1px solid ${PH.hair}`,
    }}>
      <DesktopChrome title="Phantom — Pulse Run · Уровень 2" />
      <DesktopHUD score="7,150" combo="×8" level="2 / 8" tint={PH.violet} />
      <DesktopSensor />

      {/* Distant hills */}
      <div style={{ position: 'absolute', bottom: 240, left: 0, right: 0, height: 80,
        background: 'rgba(91,77,217,0.15)',
        clipPath: 'polygon(0 50%, 18% 20%, 35% 40%, 55% 15%, 75% 35%, 100% 25%, 100% 100%, 0 100%)' }} />
      <div style={{ position: 'absolute', bottom: 180, left: 0, right: 0, height: 100,
        background: 'rgba(91,77,217,0.28)',
        clipPath: 'polygon(0 60%, 15% 30%, 35% 50%, 60% 20%, 80% 45%, 100% 30%, 100% 100%, 0 100%)' }} />

      {/* speed lines */}
      {[200, 280, 340, 400, 460].map((y, i) => (
        <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: y, height: 2,
          background: `linear-gradient(90deg, transparent, ${PH.violet}30, transparent)` }} />
      ))}

      {/* ground */}
      <div style={{ position: 'absolute', bottom: 90, left: 0, right: 0, height: 90,
        background: 'linear-gradient(180deg, #B5A6E8, #8870D8)' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: PH.violet }} />
        {/* lane stripes */}
        {[0, 200, 400, 600, 800].map((x, i) => (
          <div key={i} style={{ position: 'absolute', top: 30, left: x, width: 80, height: 4, background: 'rgba(255,255,255,0.4)', borderRadius: 2 }} />
        ))}
      </div>

      {/* obstacles */}
      <PulseObstacleD left={520} h={70} />
      <PulseObstacleD left={760} h={90} dim />
      <PulseObstacleD left={880} h={50} dim />

      {/* coins arc above obstacle */}
      {[{x: 490, y: 360}, {x: 520, y: 330}, {x: 560, y: 330}, {x: 600, y: 360}].map((c, i) => (
        <div key={i} style={{ position: 'absolute', left: c.x, top: c.y, width: 24, height: 24, borderRadius: 999,
          background: 'radial-gradient(circle, #FFE07A, #F2D75C)', boxShadow: '0 0 12px rgba(242,215,92,0.6)',
          border: '2px solid #B8961F', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: PH.fontMono, fontSize: 11, fontWeight: 700, color: '#7A5F12' }}>$</div>
      ))}

      {/* runner */}
      <div style={{
        position: 'absolute', left: 200, top: runnerY, width: 80, height: 110,
        transition: 'top 0.18s cubic-bezier(.3,.7,.4,1.4)', zIndex: 5,
      }}>
        <svg width="80" height="110" viewBox="0 0 80 110">
          {!jumping && <ellipse cx="40" cy="106" rx="32" ry="4" fill="rgba(0,0,0,0.2)" />}
          <g fill={PH.violet}>
            <circle cx="40" cy="20" r="12" />
            <path d={jumping
              ? "M30 32 L 18 56 L 32 56 L 24 80 L 40 70 L 56 56 L 60 32 Z"
              : "M30 32 L 22 60 L 34 60 L 28 86 L 40 86 L 48 60 L 58 32 Z"} />
          </g>
          <path d={jumping ? "M36 40 L 60 22" : "M36 46 L 20 50"} stroke={PH.violet} strokeWidth="8" strokeLinecap="round" />
        </svg>
      </div>

      {/* impulse meter — bottom horizontal */}
      <div style={{
        position: 'absolute', bottom: 24, left: 110, right: 24,
        padding: '14px 20px', borderRadius: 14,
        background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(14px)',
        border: `1px solid ${PH.hair}`, zIndex: 6,
        boxShadow: '0 4px 20px rgba(91,77,217,0.12)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <span style={{ fontFamily: PH.fontMono, fontSize: 10, letterSpacing: '0.12em', color: PH.inkDim }}>СИГНАЛ ИМПУЛЬСА</span>
          <span style={{ fontFamily: PH.fontMono, fontSize: 12, fontWeight: 700,
            color: jumping ? PH.violet : PH.inkDim, letterSpacing: '0.06em' }}>
            {jumping ? '⚡ ПРЫЖОК' : `${(emgLevel * 100).toFixed(0)}% — копи импульс`}
          </span>
        </div>
        <div style={{ height: 14, background: PH.bgSoft, borderRadius: 7, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -2, bottom: -2, left: `${threshold * 100}%`, width: 3,
            background: PH.coral, zIndex: 2, boxShadow: `0 0 8px ${PH.coral}` }} />
          <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${emgLevel * 100}%`,
            background: jumping ? `linear-gradient(90deg, ${PH.violet}, #8870D8)` : PH.violetSoft,
            transition: 'width 0.1s, background 0.1s' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6,
          fontFamily: PH.fontMono, fontSize: 10, color: PH.inkFaint }}>
          <span>покой</span><span style={{ color: PH.coral, fontWeight: 600 }}>↑ порог прыжка</span><span>макс</span>
        </div>
      </div>

      <DesktopHint left={110} top={110}>Короткий резкий толчок → прыжок. Тренируй точность импульса.</DesktopHint>
    </div>
  );
}

function PulseObstacleD({ left, h, dim }) {
  return (
    <div style={{ position: 'absolute', left, bottom: 90 + 90, width: 44, height: h,
      opacity: dim ? 0.45 : 1, zIndex: 4 }}>
      <div style={{ position: 'absolute', inset: 0, background: PH.coral, borderRadius: '4px 4px 0 0',
        boxShadow: 'inset 0 -4px 0 rgba(0,0,0,0.18), inset 4px 0 0 rgba(255,255,255,0.18)' }} />
      <div style={{ position: 'absolute', top: -10, left: -6, right: -6, height: 14, background: PH.coral, borderRadius: 4,
        boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.18)' }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
function ScreenDesktopSteadyClimb({ emgLevel = 0.55 }) {
  const W = 960, H = 600;
  const targetMin = 0.45, targetMax = 0.65;
  const inZone = emgLevel >= targetMin && emgLevel <= targetMax;
  // climber position — interpolated up the mountain path
  const climberX = 180 + emgLevel * 40;
  const climberY = H - 130 - emgLevel * (H - 280);
  return (
    <div style={{
      width: W, height: H, position: 'relative', overflow: 'hidden',
      background: 'linear-gradient(180deg, #FFE5D6 0%, #FCD8C2 50%, #E89E7E 100%)',
      fontFamily: PH.fontText, color: PH.ink, borderRadius: 12,
      border: `1px solid ${PH.hair}`,
    }}>
      <DesktopChrome title="Phantom — Steady Climb · Уровень 3" />
      <DesktopHUD score="3,640" combo="HOLD 2.8s" level="3 / 6" tint={PH.coral} />
      <DesktopSensor />

      {/* Sun glow */}
      <div style={{ position: 'absolute', right: 100, top: 80, width: 110, height: 110, borderRadius: 999,
        background: 'radial-gradient(circle, rgba(255,224,122,0.9), rgba(244,184,80,0.4) 60%, transparent)',
        boxShadow: '0 0 80px rgba(244,184,80,0.4)' }} />

      {/* mountain backdrop SVG */}
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0 }}>
        <path d="M-50 600 L 60 380 L 140 470 L 240 200 L 360 350 L 480 100 L 620 280 L 760 180 L 880 320 L 1010 600 Z"
          fill="#D67555" opacity="0.85" />
        {/* snow caps */}
        <path d="M240 200 L 270 240 L 250 270 Z" fill="#FFFFFF" opacity="0.75" />
        <path d="M480 100 L 510 150 L 490 180 Z" fill="#FFFFFF" opacity="0.75" />
        <path d="M760 180 L 785 215 L 770 240 Z" fill="#FFFFFF" opacity="0.7" />
        <path d="M-50 600 L 40 460 L 130 530 L 240 380 L 360 470 L 480 320 L 620 430 L 760 360 L 880 460 L 1010 600 Z"
          fill="#B85839" opacity="0.55" />
        {/* climbing path */}
        <path d="M 200 H-130 Q 240 H-300, 360 H-260 T 480 H-180" fill="none" />
      </svg>

      {/* climbing rope path with checkpoints */}
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <path d="M 200 470 Q 280 350, 360 280 T 500 130" stroke="rgba(184,88,57,0.55)" strokeWidth="4"
          strokeDasharray="6 4" fill="none" strokeLinecap="round" />
        {[{x: 200, y: 470}, {x: 320, y: 320}, {x: 420, y: 200}, {x: 500, y: 130}].map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="9" fill={i === 3 ? PH.coral : '#FFFFFF'}
              stroke={PH.coral} strokeWidth="2.5" />
            {i === 3 && <g transform={`translate(${p.x - 4} ${p.y - 28})`}>
              <path d="M0 0 L 0 22 M 0 0 L 14 4 L 0 10" stroke={PH.lime} strokeWidth="3" strokeLinecap="round" fill={PH.lime} />
            </g>}
          </g>
        ))}
      </svg>

      {/* climber */}
      <div style={{
        position: 'absolute', left: climberX, top: climberY, width: 70, height: 90,
        transition: 'top 0.4s cubic-bezier(.3,.7,.4,1), left 0.4s cubic-bezier(.3,.7,.4,1)', zIndex: 5,
      }}>
        <svg width="70" height="90" viewBox="0 0 70 90">
          <g fill={PH.ink}>
            <circle cx="35" cy="18" r="11" />
            <path d="M26 28 L 20 56 L 32 56 L 26 76 L 36 72 L 46 56 L 52 28 Z" />
          </g>
          {/* rope arm reaching up */}
          <path d="M32 36 L 60 12" stroke={PH.coral} strokeWidth="5" strokeLinecap="round" />
          <path d="M36 46 L 50 30" stroke={PH.coral} strokeWidth="3.5" strokeDasharray="4 3" />
          {/* helmet light */}
          <circle cx="35" cy="14" r="3" fill={inZone ? PH.lime : PH.coral} opacity="0.9" />
        </svg>
      </div>

      {/* HEIGHT ladder on left */}
      <div style={{ position: 'absolute', left: 28, top: 110, bottom: 110, width: 28,
        zIndex: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ fontFamily: PH.fontMono, fontSize: 9, letterSpacing: '0.12em', color: PH.ink,
          background: 'rgba(255,255,255,0.85)', padding: '3px 8px', borderRadius: 999, marginBottom: 8 }}>ВЫСОТА</div>
        <div style={{ flex: 1, width: 4, background: 'rgba(255,255,255,0.6)', borderRadius: 2, position: 'relative' }}>
          {[100, 75, 50, 25, 0].map((p, i) => (
            <div key={i} style={{ position: 'absolute', left: -10, top: `${100 - p}%`, width: 24,
              display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 8, height: 2, background: PH.ink, opacity: 0.4 }} />
              <span style={{ fontFamily: PH.fontMono, fontSize: 9, color: PH.inkDim, fontVariantNumeric: 'tabular-nums' }}>{p}</span>
            </div>
          ))}
          {/* climber marker */}
          <div style={{ position: 'absolute', left: -3, top: `${100 - emgLevel * 100}%`, width: 10, height: 10,
            borderRadius: 999, background: PH.coral, transform: 'translateY(-50%)',
            boxShadow: `0 0 8px ${PH.coral}`, transition: 'top 0.4s' }} />
        </div>
      </div>

      {/* RIGHT side — vertical zone meter (signature mechanic, BIG) */}
      <div style={{
        position: 'absolute', right: 28, top: 110, bottom: 110, width: 100,
        display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 6,
      }}>
        <div style={{ fontFamily: PH.fontMono, fontSize: 10, letterSpacing: '0.14em', color: PH.ink,
          background: 'rgba(255,255,255,0.92)', padding: '5px 12px', borderRadius: 999, marginBottom: 10,
          fontWeight: 600 }}>ДЕРЖИ В ЗОНЕ</div>
        <div style={{
          flex: 1, width: 40, borderRadius: 20,
          background: 'rgba(255,255,255,0.92)', border: `1px solid ${PH.hair}`,
          position: 'relative', overflow: 'hidden',
          boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.08)',
        }}>
          {/* target zone */}
          <div style={{
            position: 'absolute', left: -8, right: -8,
            bottom: `${targetMin * 100}%`, height: `${(targetMax - targetMin) * 100}%`,
            background: inZone ? PH.limeBright : PH.limeSoft,
            borderTop: `2px dashed ${PH.lime}`,
            borderBottom: `2px dashed ${PH.lime}`,
            transition: 'background 0.15s',
          }}>
            <div style={{ position: 'absolute', left: -50, top: '50%', transform: 'translateY(-50%) rotate(-90deg)',
              transformOrigin: 'center', fontFamily: PH.fontMono, fontSize: 10, color: PH.lime, fontWeight: 700,
              letterSpacing: '0.1em' }}>ЦЕЛЬ</div>
          </div>
          {/* current marker */}
          <div style={{
            position: 'absolute', left: -10, right: -10, bottom: `calc(${emgLevel * 100}% - 3px)`,
            height: 6, background: inZone ? PH.lime : PH.coral,
            boxShadow: `0 0 12px ${inZone ? PH.lime : PH.coral}`,
            transition: 'bottom 0.15s, background 0.15s',
            borderRadius: 3,
          }} />
          {/* tick marks */}
          {[0.25, 0.5, 0.75].map(t => (
            <div key={t} style={{ position: 'absolute', left: 0, right: 28, bottom: `${t * 100}%`,
              height: 1, background: 'rgba(0,0,0,0.08)' }} />
          ))}
        </div>
        <div style={{
          marginTop: 12, padding: '8px 16px', borderRadius: 999,
          background: inZone ? PH.limeSoft : '#FCE6DD',
          fontFamily: PH.fontMono, fontSize: 11, fontWeight: 700,
          color: inZone ? PH.lime : PH.coral, letterSpacing: '0.08em',
          border: `1px solid ${inZone ? PH.lime + '44' : PH.coral + '44'}`,
        }}>
          {inZone ? '● В ЦЕЛИ' : '✕ ВНЕ ЗОНЫ'}
        </div>
        <div style={{ marginTop: 8, fontFamily: PH.fontMono, fontSize: 10, color: PH.inkDim,
          fontVariantNumeric: 'tabular-nums', textAlign: 'center', lineHeight: 1.4 }}>
          {(emgLevel * 100).toFixed(0)}%<br/>
          <span style={{ color: PH.inkFaint }}>цель 45–65</span>
        </div>
      </div>

      {/* Hint + stats bottom */}
      <div style={{
        position: 'absolute', bottom: 24, left: 80, right: 160,
        padding: '12px 18px', borderRadius: 14,
        background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(14px)',
        border: `1px solid ${PH.hair}`, zIndex: 6,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20,
      }}>
        <div>
          <div style={{ fontFamily: PH.fontSans, fontSize: 14, fontWeight: 600 }}>Не слишком сильно, не слишком слабо</div>
          <div style={{ fontSize: 12, color: PH.inkDim, marginTop: 2 }}>Каждая секунда в зоне = 1 метр вверх. Тренирует дозирование.</div>
        </div>
        <div style={{ display: 'flex', gap: 18 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: PH.fontMono, fontSize: 9, letterSpacing: '0.1em', color: PH.inkFaint }}>УДЕРЖАНИЕ</div>
            <div style={{ fontFamily: PH.fontSans, fontSize: 18, fontWeight: 700, color: PH.coral, fontVariantNumeric: 'tabular-nums' }}>2.8s</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: PH.fontMono, fontSize: 9, letterSpacing: '0.1em', color: PH.inkFaint }}>МЕТРОВ</div>
            <div style={{ fontFamily: PH.fontSans, fontSize: 18, fontWeight: 700, color: PH.coral, fontVariantNumeric: 'tabular-nums' }}>184m</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Shared desktop chrome bits
// ─────────────────────────────────────────────────────────────
function DesktopChrome({ title }) {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 36,
      background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(14px)',
      borderBottom: `1px solid ${PH.hair}`, display: 'flex', alignItems: 'center',
      padding: '0 14px', zIndex: 12 }}>
      <div style={{ display: 'flex', gap: 7 }}>
        <span style={{ width: 11, height: 11, borderRadius: 999, background: '#FF5F56' }} />
        <span style={{ width: 11, height: 11, borderRadius: 999, background: '#FFBD2E' }} />
        <span style={{ width: 11, height: 11, borderRadius: 999, background: '#27C93F' }} />
      </div>
      <div style={{ flex: 1, textAlign: 'center', fontFamily: PH.fontSans, fontSize: 12, fontWeight: 600, color: PH.inkDim }}>
        {title}
      </div>
    </div>
  );
}

function DesktopHUD({ score, combo, level, tint = PH.lime }) {
  return (
    <div style={{
      position: 'absolute', top: 50, left: '50%', transform: 'translateX(-50%)',
      display: 'flex', alignItems: 'center', gap: 24,
      padding: '10px 22px', borderRadius: 999,
      background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(14px)',
      border: `1px solid ${PH.hair}`, zIndex: 8,
      boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
    }}>
      <div style={{ fontFamily: PH.fontSans, fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em' }}>
        Phantom<span style={{ color: tint }}>.</span>
      </div>
      <div style={{ width: 1, height: 22, background: PH.hair }} />
      <div>
        <div style={{ fontFamily: PH.fontMono, fontSize: 9, letterSpacing: '0.1em', color: PH.inkFaint }}>SCORE</div>
        <div style={{ fontFamily: PH.fontSans, fontSize: 20, fontWeight: 700, color: tint, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{score}</div>
      </div>
      <div>
        <div style={{ fontFamily: PH.fontMono, fontSize: 9, letterSpacing: '0.1em', color: PH.inkFaint }}>СЕРИЯ</div>
        <div style={{ fontFamily: PH.fontSans, fontSize: 20, fontWeight: 700, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{combo}</div>
      </div>
      <div>
        <div style={{ fontFamily: PH.fontMono, fontSize: 9, letterSpacing: '0.1em', color: PH.inkFaint }}>УРОВЕНЬ</div>
        <div style={{ fontFamily: PH.fontSans, fontSize: 20, fontWeight: 700, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{level}</div>
      </div>
    </div>
  );
}

function DesktopSensor() {
  return (
    <div style={{
      position: 'absolute', top: 50, right: 16, display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(14px)', border: `1px solid ${PH.hair}`, zIndex: 8,
      boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
    }}>
      <div style={{ width: 8, height: 8, borderRadius: 999, background: PH.limeBright, boxShadow: `0 0 10px ${PH.limeBright}` }} />
      <span style={{ fontFamily: PH.fontMono, fontSize: 10, letterSpacing: '0.08em', color: PH.ink }}>SENSOR · 87%</span>
    </div>
  );
}

function DesktopEMGMeter({ emgLevel, threshold }) {
  return (
    <div style={{
      position: 'absolute', left: 22, top: 110, bottom: 110, width: 56,
      display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 4,
    }}>
      <div style={{ fontFamily: PH.fontMono, fontSize: 10, letterSpacing: '0.12em', color: PH.ink,
        background: 'rgba(255,255,255,0.85)', padding: '3px 8px', borderRadius: 999, marginBottom: 8 }}>EMG</div>
      <div style={{
        flex: 1, width: 18, borderRadius: 10,
        background: 'rgba(255,255,255,0.9)', border: `1px solid ${PH.hair}`,
        position: 'relative', overflow: 'hidden',
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.08)',
      }}>
        <div style={{ position: 'absolute', left: -4, right: -4, bottom: '40%', height: '25%',
          background: PH.limeSoft, borderTop: `1px dashed ${PH.lime}`, borderBottom: `1px dashed ${PH.lime}` }} />
        <div style={{ position: 'absolute', left: -6, right: -6, bottom: `${threshold * 100}%`, height: 2, background: PH.violet }} />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: `${emgLevel * 100}%`,
          background: `linear-gradient(180deg, ${PH.limeBright}, ${PH.lime})`,
          boxShadow: `0 0 16px ${PH.limeBright}`, transition: 'height 0.2s',
        }} />
      </div>
      <div style={{ fontFamily: PH.fontMono, fontSize: 11, color: PH.lime, marginTop: 8, fontVariantNumeric: 'tabular-nums',
        background: 'rgba(255,255,255,0.85)', padding: '3px 8px', borderRadius: 999, fontWeight: 600 }}>
        {(emgLevel * 100).toFixed(0)}%
      </div>
      <div style={{ fontFamily: PH.fontMono, fontSize: 9, color: PH.inkDim, marginTop: 4 }}>0.62 mV</div>
    </div>
  );
}

function DesktopWaveStrip() {
  return (
    <div style={{
      position: 'absolute', left: 100, right: 24, bottom: 18,
      padding: '10px 16px', borderRadius: 14,
      background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(14px)',
      border: `1px solid ${PH.hair}`, zIndex: 5,
      boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
        <span style={{ fontFamily: PH.fontMono, fontSize: 9, letterSpacing: '0.1em', color: PH.inkDim }}>СИГНАЛ В РЕАЛЬНОМ ВРЕМЕНИ</span>
        <span style={{ fontFamily: PH.fontMono, fontSize: 9, color: PH.lime, fontWeight: 600 }}>● ЖИВО</span>
      </div>
      <EMGWave width={780} height={40} intensity={0.95} density={1.6} />
    </div>
  );
}

function DesktopHint({ children, left = 100, top = 110 }) {
  return (
    <div style={{
      position: 'absolute', left, top, padding: '6px 12px', borderRadius: 999,
      background: 'rgba(255,255,255,0.94)', border: `1px solid ${PH.hair}`,
      fontFamily: PH.fontSans, fontSize: 11, color: PH.ink,
      display: 'flex', alignItems: 'center', gap: 6, zIndex: 7,
      boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: PH.lime, boxShadow: `0 0 6px ${PH.lime}` }} />
      {children}
    </div>
  );
}

function SparrowObstacle({ left, topGap, bottomGap, dim }) {
  const op = dim ? 0.45 : 1;
  return (
    <>
      <div style={{
        position: 'absolute', left, top: 0, width: 80, height: topGap,
        background: PH.lime, borderRadius: '0 0 14px 14px',
        opacity: op, zIndex: 2,
        boxShadow: 'inset 0 -4px 0 rgba(0,0,0,0.15), inset 4px 0 0 rgba(255,255,255,0.2)',
      }} />
      <div style={{
        position: 'absolute', left, bottom: 0, width: 80, height: bottomGap,
        background: PH.lime, borderRadius: '14px 14px 0 0',
        opacity: op, zIndex: 2,
        boxShadow: 'inset 0 4px 0 rgba(255,255,255,0.2), inset 4px 0 0 rgba(255,255,255,0.2)',
      }} />
    </>
  );
}

Object.assign(window, { ScreenDesktop, ScreenDesktopPulseRun, ScreenDesktopSteadyClimb });
