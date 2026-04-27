// Mobile screens — LIGHT theme

function ScreenOnboarding() {
  return (
    <PhoneShell hideTab>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '20px 28px 40px', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.18, pointerEvents: 'none' }}>
          <EMGWave width={460} height={520} intensity={1} density={0.8} color={PH.lime} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative' }}>
          <Pill style={{ alignSelf: 'flex-start', marginBottom: 24 }}>EMG · v0.4</Pill>
          <div style={{ fontFamily: PH.fontSans, fontSize: 56, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 0.95, color: PH.ink }}>
            Phantom<span style={{ color: PH.lime }}>.</span>
          </div>
          <div style={{ marginTop: 18, fontSize: 17, lineHeight: 1.45, color: PH.inkDim, maxWidth: 300 }}>
            Тренируй мышцы культи в&nbsp;игре. Подготовь руку к&nbsp;бионическому протезу.
          </div>
          <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArmIllustration width={300} active />
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <PrimaryBtn full>Начать</PrimaryBtn>
          <div style={{ textAlign: 'center', marginTop: 14, fontFamily: PH.fontMono, fontSize: 11, color: PH.inkFaint, letterSpacing: '0.06em' }}>УЖЕ ЕСТЬ АККАУНТ → ВОЙТИ</div>
        </div>
      </div>
    </PhoneShell>
  );
}

function ScreenCalibration() {
  return (
    <PhoneShell hideTab>
      <div style={{ height: '100%', overflow: 'auto', padding: '8px 20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ color: PH.inkDim, fontFamily: PH.fontMono, fontSize: 11, letterSpacing: '0.08em' }}>ШАГ 02 / 03</div>
          <div style={{ display: 'flex', gap: 4 }}>
            <div style={{ width: 24, height: 3, background: PH.lime, borderRadius: 2 }} />
            <div style={{ width: 24, height: 3, background: PH.lime, borderRadius: 2 }} />
            <div style={{ width: 24, height: 3, background: PH.hair, borderRadius: 2 }} />
          </div>
        </div>
        <h1 style={{ fontFamily: PH.fontSans, fontSize: 30, fontWeight: 700, letterSpacing: '-0.03em', margin: '8px 0 8px', lineHeight: 1.05 }}>Калибровка<br/>сигнала</h1>
        <div style={{ color: PH.inkDim, fontSize: 14, lineHeight: 1.5, marginBottom: 16 }}>
          Прикрепи электроды на предплечье. Напряги мышцу — увидишь живой сигнал.
        </div>
        <Card raised style={{ padding: 0, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: `1px solid ${PH.hair}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: 999, background: PH.limeBright, boxShadow: `0 0 8px ${PH.limeBright}` }} />
              <span style={{ fontFamily: PH.fontSans, fontWeight: 600, fontSize: 14 }}>Phantom Sensor</span>
            </div>
            <Pill>Подключён</Pill>
          </div>
          <div style={{ padding: '14px 16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: PH.bgSoft }}>
            <ArmIllustration width={280} active />
          </div>
        </Card>
        <Card raised style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <span style={{ fontFamily: PH.fontMono, fontSize: 10, letterSpacing: '0.1em', color: PH.inkDim }}>СИГНАЛ EMG</span>
            <span style={{ fontFamily: PH.fontMono, fontSize: 11, color: PH.lime, fontVariantNumeric: 'tabular-nums' }}>0.74 mV</span>
          </div>
          <EMGWave width={310} height={64} intensity={0.95} />
          <div style={{ position: 'relative', height: 22, marginTop: 4 }}>
            <div style={{ position: 'absolute', left: '35%', right: '15%', height: 2, background: PH.violet, borderRadius: 2, top: 6 }} />
            <div style={{ position: 'absolute', left: '35%', top: 0, color: PH.violet, fontFamily: PH.fontMono, fontSize: 10, letterSpacing: '0.06em' }}>ПОРОГ</div>
          </div>
        </Card>
        <div style={{ marginTop: 16 }}>
          <PrimaryBtn full icon={<span>→</span>}>Сохранить порог</PrimaryBtn>
        </div>
      </div>
    </PhoneShell>
  );
}

function ScreenHome() {
  return (
    <PhoneShell tab="home">
      <div style={{ height: '100%', overflow: 'auto', padding: '8px 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <div style={{ fontFamily: PH.fontMono, fontSize: 11, letterSpacing: '0.1em', color: PH.inkFaint }}>СРЕДА · 21:14</div>
            <div style={{ fontFamily: PH.fontSans, fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 2 }}>
              Привет, <span style={{ color: PH.lime }}>Алмас</span>
            </div>
          </div>
          <IconBtn>
            <div style={{ position: 'relative' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={PH.ink} strokeWidth="2"><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M14 21a2 2 0 01-4 0" /></svg>
              <div style={{ position: 'absolute', top: -2, right: -2, width: 7, height: 7, borderRadius: 999, background: PH.coral }} />
            </div>
          </IconBtn>
        </div>

        <Card raised style={{ padding: 20, marginBottom: 14, position: 'relative', background: `linear-gradient(135deg, ${PH.limeSoft} 0%, #FFFFFF 100%)` }}>
          <div style={{ position: 'absolute', top: 12, right: 12, opacity: 0.5 }}>
            <GameCover kind="sparrow" width={64} height={64} />
          </div>
          <Pill style={{ marginBottom: 12 }}>Сегодня · Изоляция</Pill>
          <div style={{ fontFamily: PH.fontSans, fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 6 }}>
            Сжимаемые мышцы<br/><span style={{ color: PH.inkDim }}>сгибатели запястья</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, color: PH.inkDim, fontSize: 13, marginBottom: 16 }}>
            <span>⌁ 12 мин</span><span>○ 3 игры</span><span style={{ color: PH.lime, fontWeight: 600 }}>● готово</span>
          </div>
          <PrimaryBtn full>Начать тренировку →</PrimaryBtn>
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          <Card padded={false} style={{ padding: '14px 16px' }}>
            <div style={{ fontFamily: PH.fontMono, fontSize: 10, letterSpacing: '0.1em', color: PH.inkFaint }}>СЕРИЯ</div>
            <div style={{ fontFamily: PH.fontSans, fontSize: 28, fontWeight: 700, marginTop: 4 }}>14<span style={{ color: PH.inkDim, fontSize: 14, fontWeight: 500, marginLeft: 4 }}>дн</span></div>
            <div style={{ display: 'flex', gap: 3, marginTop: 8 }}>
              {[1,1,1,1,1,1,0].map((d, i) => <div key={i} style={{ flex: 1, height: 14, borderRadius: 3, background: d ? PH.lime : PH.bgSoft }} />)}
            </div>
          </Card>
          <Card padded={false} style={{ padding: '14px 16px' }}>
            <div style={{ fontFamily: PH.fontMono, fontSize: 10, letterSpacing: '0.1em', color: PH.inkFaint }}>СИЛА СИГНАЛА</div>
            <div style={{ fontFamily: PH.fontSans, fontSize: 28, fontWeight: 700, marginTop: 4 }}>+18<span style={{ color: PH.lime, fontSize: 16, fontWeight: 500, marginLeft: 2 }}>%</span></div>
            <div style={{ fontSize: 11, color: PH.inkDim, marginTop: 4 }}>с прошлой недели</div>
          </Card>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '6px 4px 10px' }}>
          <div style={{ fontFamily: PH.fontSans, fontSize: 16, fontWeight: 600 }}>Игры</div>
          <div style={{ fontFamily: PH.fontMono, fontSize: 11, color: PH.lime, letterSpacing: '0.06em', fontWeight: 600 }}>ВСЕ →</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <MiniGameCard title="Sparrow" kind="sparrow" />
          <MiniGameCard title="Pulse Run" kind="pulse" />
          <MiniGameCard title="Steady" kind="climb" />
        </div>
      </div>
    </PhoneShell>
  );
}

function MiniGameCard({ title, kind }) {
  return (
    <div style={{
      flex: 1, background: PH.bgAlt, border: `1px solid ${PH.hair}`,
      borderRadius: 14, padding: 10, display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <GameCover kind={kind} width="100%" height={80} />
      <div>
        <div style={{ fontFamily: PH.fontSans, fontSize: 13, fontWeight: 600 }}>{title}</div>
        <div style={{ fontFamily: PH.fontMono, fontSize: 9, color: PH.inkFaint, letterSpacing: '0.08em', marginTop: 2 }}>LV. 4</div>
      </div>
    </div>
  );
}

function ScreenCatalog() {
  const games = [
    { title: 'Sparrow', sub: 'flappy · удержание', kind: 'sparrow', color: PH.lime, desc: 'Напряги мышцу — взлетай. Отпусти — падай.', skill: 'Активация' },
    { title: 'Pulse Run', sub: 'раннер · импульс', kind: 'pulse', color: PH.violet, desc: 'Короткие сокращения = прыжок через препятствия.', skill: 'Точность' },
    { title: 'Steady Climb', sub: 'альпинист · дозирование', kind: 'climb', color: PH.coral, desc: 'Держи сигнал в узком диапазоне.', skill: 'Контроль' },
  ];
  return (
    <PhoneShell tab="play">
      <div style={{ height: '100%', overflow: 'auto', padding: '8px 20px 16px' }}>
        <h1 style={{ fontFamily: PH.fontSans, fontSize: 30, fontWeight: 700, letterSpacing: '-0.03em', margin: '4px 0 4px' }}>Игры</h1>
        <div style={{ color: PH.inkDim, fontSize: 14, marginBottom: 18 }}>Каждая тренирует свой навык для протеза.</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {games.map((g, i) => (
            <Card key={i} padded={false} style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', gap: 14, padding: '12px 14px', alignItems: 'center' }}>
                <GameCover kind={g.kind} width={72} height={72} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontFamily: PH.fontSans, fontSize: 17, fontWeight: 600 }}>{g.title}</span>
                    <span style={{ fontFamily: PH.fontMono, fontSize: 10, color: PH.inkFaint, letterSpacing: '0.06em' }}>{g.sub}</span>
                  </div>
                  <div style={{ color: PH.inkDim, fontSize: 12, lineHeight: 1.4, marginTop: 4 }}>{g.desc}</div>
                  <div style={{ marginTop: 8 }}><Pill color={g.color}>● {g.skill}</Pill></div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={PH.inkFaint} strokeWidth="2.4" strokeLinecap="round"><path d="M9 6l6 6-6 6" /></svg>
              </div>
            </Card>
          ))}
        </div>
        <div style={{ marginTop: 22, fontFamily: PH.fontMono, fontSize: 10, letterSpacing: '0.1em', color: PH.inkFaint, marginBottom: 8 }}>СКОРО</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {['Rhythm Fist', 'Co-op Lab'].map(n => (
            <div key={n} style={{ padding: '14px 12px', border: `1px dashed ${PH.hairStrong}`, borderRadius: 12, fontFamily: PH.fontSans, fontSize: 13, color: PH.inkDim }}>
              <div style={{ fontWeight: 600 }}>{n}</div>
              <div style={{ fontSize: 11, color: PH.inkFaint, marginTop: 2 }}>в разработке</div>
            </div>
          ))}
        </div>
      </div>
    </PhoneShell>
  );
}

// ─────────────────────────────────────────────────────────────
// SPARROW — flappy with EMG bar (light)
// ─────────────────────────────────────────────────────────────
function ScreenGameSparrow({ emgLevel = 0.62, threshold = 0.45 }) {
  const birdY = 360 - emgLevel * 280;
  return (
    <PhoneShell hideTab>
      <div style={{ height: '100%', position: 'relative', background: 'linear-gradient(180deg, #DCE8F2 0%, #F2D998 100%)' }}>
        <GameTopHUD score="1,420" combo="×7" />
        {/* sun */}
        <div style={{ position: 'absolute', right: 30, top: 90, width: 70, height: 70, borderRadius: 999,
          background: 'radial-gradient(circle, #FFE07A, #F4B850)', boxShadow: '0 0 40px rgba(244,184,80,0.5)' }} />
        {/* clouds */}
        <Cloud left={40} top={120} w={70} />
        <Cloud left={250} top={200} w={50} />
        {/* gates */}
        <SparrowGate left={300} topGap={140} bottomGap={300} />
        <SparrowGate left={140} topGap={190} bottomGap={250} dim />
        {/* hills */}
        <div style={{ position: 'absolute', bottom: 96, left: 0, right: 0, height: 100, background: 'linear-gradient(180deg, #88C36F, #4F8B3D)', clipPath: 'polygon(0 60%, 15% 30%, 30% 50%, 50% 20%, 70% 40%, 90% 25%, 100% 50%, 100% 100%, 0 100%)' }} />

        {/* sparrow */}
        <div style={{
          position: 'absolute', left: 70, top: birdY, width: 56, height: 56,
          borderRadius: 999, background: PH.lime,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 4px 18px rgba(61,122,31,0.4), 0 0 0 6px rgba(127,203,58,0.25)`,
          transition: 'top 0.3s cubic-bezier(.4,.9,.4,1)', zIndex: 5,
        }}>
          <svg width="34" height="34" viewBox="0 0 24 24"><path d="M3 14 Q 10 6, 18 12 L 22 8 L 21 14 Q 18 18, 12 18 Q 6 18, 3 14 Z" fill="#FFFFFF" /></svg>
        </div>

        {/* EMG vertical meter */}
        <EMGMeter emgLevel={emgLevel} threshold={threshold} />

        {/* hint */}
        <div style={{
          position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)',
          padding: '8px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(10px)', border: `1px solid ${PH.hair}`,
          fontFamily: PH.fontSans, fontSize: 12, color: PH.ink,
          display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: PH.lime }} />
          Напряги мышцу — взлетай
        </div>
      </div>
    </PhoneShell>
  );
}

// ─────────────────────────────────────────────────────────────
// PULSE RUN — short burst = jump
// ─────────────────────────────────────────────────────────────
function ScreenGamePulseRun({ emgLevel = 0.62, threshold = 0.55 }) {
  const jumping = emgLevel > threshold;
  const runnerY = jumping ? 380 : 480;
  return (
    <PhoneShell hideTab>
      <div style={{ height: '100%', position: 'relative', background: 'linear-gradient(180deg, #E9DFFB 0%, #FFE5D6 100%)' }}>
        <GameTopHUD score="2,180" combo="×4" tint={PH.violet} />

        {/* parallax hills */}
        <div style={{ position: 'absolute', bottom: 180, left: 0, right: 0, height: 60, background: 'rgba(91,77,217,0.15)', clipPath: 'polygon(0 50%, 25% 20%, 50% 40%, 75% 10%, 100% 30%, 100% 100%, 0 100%)' }} />
        <div style={{ position: 'absolute', bottom: 130, left: 0, right: 0, height: 70, background: 'rgba(91,77,217,0.25)', clipPath: 'polygon(0 60%, 20% 30%, 45% 50%, 70% 25%, 100% 45%, 100% 100%, 0 100%)' }} />

        {/* speed lines */}
        {[150, 220, 280, 340].map((y, i) => (
          <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: y, height: 2, background: `linear-gradient(90deg, transparent, ${PH.violet}30, transparent)` }} />
        ))}

        {/* ground */}
        <div style={{ position: 'absolute', bottom: 110, left: 0, right: 0, height: 70, background: 'linear-gradient(180deg, #B5A6E8, #8870D8)' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: PH.violet }} />
        </div>

        {/* obstacles */}
        <PulseObstacle left={260} h={56} />
        <PulseObstacle left={150} h={70} dim />

        {/* coins above gap */}
        <div style={{ position: 'absolute', left: 245, top: 380, width: 20, height: 20, borderRadius: 999, background: '#F2D75C', boxShadow: '0 0 8px #F2D75C', border: '2px solid #B8961F' }} />
        <div style={{ position: 'absolute', left: 270, top: 360, width: 20, height: 20, borderRadius: 999, background: '#F2D75C', boxShadow: '0 0 8px #F2D75C', border: '2px solid #B8961F' }} />
        <div style={{ position: 'absolute', left: 295, top: 380, width: 20, height: 20, borderRadius: 999, background: '#F2D75C', boxShadow: '0 0 8px #F2D75C', border: '2px solid #B8961F' }} />

        {/* runner */}
        <div style={{
          position: 'absolute', left: 70, top: runnerY, width: 60, height: 80,
          transition: 'top 0.18s cubic-bezier(.3,.7,.4,1.4)', zIndex: 5,
        }}>
          <svg width="60" height="80" viewBox="0 0 60 80">
            {/* shadow when on ground */}
            {!jumping && <ellipse cx="30" cy="78" rx="24" ry="3" fill="rgba(0,0,0,0.2)" />}
            <g fill={PH.violet}>
              <circle cx="30" cy="14" r="9" />
              <path d={jumping
                ? "M22 22 L 14 38 L 24 38 L 18 56 L 30 50 L 42 38 L 46 22 Z"
                : "M22 22 L 16 42 L 26 42 L 22 60 L 30 60 L 36 42 L 44 22 Z"} />
            </g>
            {/* arm/stump */}
            <path d={jumping ? "M28 28 L 44 16" : "M28 32 L 16 36"} stroke={PH.violet} strokeWidth="6" strokeLinecap="round" />
          </svg>
        </div>

        {/* impulse indicator — bottom horizontal bar */}
        <div style={{
          position: 'absolute', bottom: 28, left: 70, right: 70,
          padding: '10px 14px', borderRadius: 14,
          background: 'rgba(255,255,255,0.95)', border: `1px solid ${PH.hair}`,
          boxShadow: '0 2px 12px rgba(91,77,217,0.15)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <span style={{ fontFamily: PH.fontMono, fontSize: 9, letterSpacing: '0.1em', color: PH.inkFaint }}>ИМПУЛЬС</span>
            <span style={{ fontFamily: PH.fontMono, fontSize: 10, color: jumping ? PH.violet : PH.inkFaint, fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
              {jumping ? '⚡ ПРЫЖОК' : `${(emgLevel * 100).toFixed(0)}%`}
            </span>
          </div>
          {/* horizontal threshold meter */}
          <div style={{ height: 10, background: PH.bgSoft, borderRadius: 6, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -2, bottom: -2, left: `${threshold * 100}%`, width: 2, background: PH.coral, zIndex: 2 }} />
            <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${emgLevel * 100}%`, background: jumping ? PH.violet : PH.violetSoft, transition: 'width 0.1s, background 0.1s' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontFamily: PH.fontMono, fontSize: 9, color: PH.inkFaint }}>
            <span>покой</span><span style={{ color: PH.coral }}>↑ порог</span><span>макс</span>
          </div>
        </div>
      </div>
    </PhoneShell>
  );
}

function PulseObstacle({ left, h, dim }) {
  return (
    <div style={{ position: 'absolute', left, bottom: 110 + 70, width: 32, height: h, opacity: dim ? 0.4 : 1, zIndex: 3 }}>
      <div style={{ position: 'absolute', inset: 0, background: PH.coral, borderRadius: '4px 4px 0 0', boxShadow: 'inset 0 -3px 0 rgba(0,0,0,0.15)' }} />
      <div style={{ position: 'absolute', top: -8, left: -4, right: -4, height: 12, background: PH.coral, borderRadius: 4, boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.15)' }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// STEADY CLIMB — keep signal in narrow zone
// ─────────────────────────────────────────────────────────────
function ScreenGameSteadyClimb({ emgLevel = 0.55, threshold = 0.5 }) {
  const targetMin = 0.45, targetMax = 0.65;
  const inZone = emgLevel >= targetMin && emgLevel <= targetMax;
  // climber moves up if in zone, slides down otherwise. visual: position based on emgLevel proximity to target center
  const climberY = 540 - (emgLevel * 380);
  return (
    <PhoneShell hideTab>
      <div style={{ height: '100%', position: 'relative', background: 'linear-gradient(180deg, #FFE5D6 0%, #FCD8C2 60%, #E89E7E 100%)' }}>
        <GameTopHUD score="3,640" combo="HOLD 2.8s" tint={PH.coral} />

        {/* mountain backdrop */}
        <svg width="100%" height="100%" viewBox="0 0 390 700" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0 }}>
          <path d="M-20 700 L 60 200 L 120 320 L 200 80 L 280 280 L 360 160 L 410 700 Z" fill="#D67555" opacity="0.85" />
          <path d="M60 200 L 80 230 L 70 250 Z" fill="#FFFFFF" opacity="0.7" />
          <path d="M200 80 L 220 120 L 210 140 Z" fill="#FFFFFF" opacity="0.7" />
          <path d="M-20 700 L 30 380 L 90 480 L 160 320 L 230 460 L 300 360 L 410 540 L 410 700 Z" fill="#B85839" opacity="0.5" />
        </svg>

        {/* rope/path with checkpoints */}
        <div style={{ position: 'absolute', left: 60, top: 130, bottom: 200, width: 4, background: 'rgba(184,88,57,0.4)', borderRadius: 2 }}>
          {[0.15, 0.4, 0.7].map((p, i) => (
            <div key={i} style={{ position: 'absolute', left: -4, top: `${p * 100}%`, width: 12, height: 12, borderRadius: 999, background: i === 2 ? PH.coral : '#FFFFFF', border: `2px solid ${PH.coral}` }} />
          ))}
          {/* flag at top */}
          <div style={{ position: 'absolute', left: -3, top: -16, width: 10, height: 14 }}>
            <svg width="20" height="20" viewBox="0 0 20 20"><path d="M2 2 L 2 18 M 2 2 L 14 5 L 2 9" stroke={PH.lime} strokeWidth="2.5" strokeLinecap="round" fill={PH.lime} /></svg>
          </div>
        </div>

        {/* climber */}
        <div style={{
          position: 'absolute', left: 40, top: climberY, width: 60, height: 80,
          transition: 'top 0.4s cubic-bezier(.3,.7,.4,1)', zIndex: 5,
        }}>
          <svg width="60" height="80" viewBox="0 0 60 80">
            <g fill={PH.ink}>
              <circle cx="30" cy="14" r="8" />
              <path d="M22 22 L 18 44 L 26 44 L 22 64 L 30 60 L 38 44 L 44 22 Z" />
            </g>
            <path d="M28 28 L 50 12" stroke={PH.coral} strokeWidth="4" strokeLinecap="round" />
            <path d="M30 36 L 42 24" stroke={PH.coral} strokeWidth="3" strokeDasharray="3 2" />
          </svg>
        </div>

        {/* RIGHT side — vertical zone meter (Steady's signature mechanic) */}
        <div style={{
          position: 'absolute', right: 22, top: 120, bottom: 120, width: 64,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          <div style={{ fontFamily: PH.fontMono, fontSize: 9, letterSpacing: '0.12em', color: PH.inkDim, marginBottom: 6 }}>ДЕРЖИ В ЗОНЕ</div>
          <div style={{
            flex: 1, width: 28, borderRadius: 14,
            background: 'rgba(255,255,255,0.85)', border: `1px solid ${PH.hair}`,
            position: 'relative', overflow: 'hidden',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.08)',
          }}>
            {/* target zone — green band */}
            <div style={{
              position: 'absolute', left: -6, right: -6,
              bottom: `${targetMin * 100}%`, height: `${(targetMax - targetMin) * 100}%`,
              background: inZone ? PH.limeBright : PH.limeSoft,
              borderTop: `2px dashed ${PH.lime}`,
              borderBottom: `2px dashed ${PH.lime}`,
              transition: 'background 0.15s',
            }}>
              <div style={{ position: 'absolute', left: -28, top: '50%', transform: 'translateY(-50%)', fontFamily: PH.fontMono, fontSize: 9, color: PH.lime, fontWeight: 600 }}>ЦЕЛЬ</div>
            </div>
            {/* current marker — horizontal arrow */}
            <div style={{
              position: 'absolute', left: -8, right: -8, bottom: `calc(${emgLevel * 100}% - 2px)`,
              height: 4, background: inZone ? PH.lime : PH.coral,
              boxShadow: `0 0 8px ${inZone ? PH.lime : PH.coral}`,
              transition: 'bottom 0.15s, background 0.15s',
            }} />
          </div>
          <div style={{
            marginTop: 8, padding: '4px 8px', borderRadius: 999,
            background: inZone ? PH.limeSoft : '#FCE6DD',
            fontFamily: PH.fontMono, fontSize: 10, fontWeight: 600,
            color: inZone ? PH.lime : PH.coral, letterSpacing: '0.05em',
          }}>
            {inZone ? '● В ЦЕЛИ' : '✕ ВНЕ'}
          </div>
        </div>

        {/* Hint */}
        <div style={{
          position: 'absolute', bottom: 30, left: 20, right: 110,
          padding: '8px 14px', borderRadius: 12,
          background: 'rgba(255,255,255,0.95)', border: `1px solid ${PH.hair}`,
          fontFamily: PH.fontSans, fontSize: 12, color: PH.ink,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}>
          <div style={{ fontWeight: 600, marginBottom: 2 }}>Не слишком сильно, не слишком слабо</div>
          <div style={{ fontSize: 11, color: PH.inkDim }}>Каждая секунда в зоне = 1 метр вверх</div>
        </div>
      </div>
    </PhoneShell>
  );
}

// shared HUD
function GameTopHUD({ score, combo, tint = PH.lime }) {
  return (
    <div style={{ position: 'absolute', top: 14, left: 16, right: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
      <IconBtn style={{ width: 36, height: 36 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill={PH.ink}><rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" /></svg>
      </IconBtn>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '8px 14px', borderRadius: 999,
        background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)',
        border: `1px solid ${PH.hair}`, boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
      }}>
        <div>
          <div style={{ fontFamily: PH.fontMono, fontSize: 9, letterSpacing: '0.1em', color: PH.inkFaint }}>SCORE</div>
          <div style={{ fontFamily: PH.fontSans, fontSize: 18, fontWeight: 700, color: tint, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{score}</div>
        </div>
        <div style={{ width: 1, height: 24, background: PH.hair }} />
        <div>
          <div style={{ fontFamily: PH.fontMono, fontSize: 9, letterSpacing: '0.1em', color: PH.inkFaint }}>СЕРИЯ</div>
          <div style={{ fontFamily: PH.fontSans, fontSize: 18, fontWeight: 700, color: PH.ink, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{combo}</div>
        </div>
      </div>
    </div>
  );
}

function Cloud({ left, top, w }) {
  return (
    <div style={{ position: 'absolute', left, top, width: w, height: w * 0.5 }}>
      <svg viewBox="0 0 100 50" width="100%" height="100%">
        <ellipse cx="25" cy="35" rx="22" ry="14" fill="#FFFFFF" opacity="0.8" />
        <ellipse cx="55" cy="28" rx="28" ry="18" fill="#FFFFFF" opacity="0.85" />
        <ellipse cx="80" cy="36" rx="18" ry="12" fill="#FFFFFF" opacity="0.8" />
      </svg>
    </div>
  );
}

function SparrowGate({ left, topGap, bottomGap, dim }) {
  const op = dim ? 0.45 : 1;
  return (
    <>
      <div style={{ position: 'absolute', left, top: 0, width: 70, height: topGap, opacity: op, zIndex: 2 }}>
        <div style={{ width: '100%', height: '100%', background: PH.lime, borderRadius: '0 0 14px 14px', boxShadow: 'inset 0 -4px 0 rgba(0,0,0,0.15), inset 4px 0 0 rgba(255,255,255,0.2)' }} />
      </div>
      <div style={{ position: 'absolute', left, bottom: 96, width: 70, height: bottomGap, opacity: op, zIndex: 2 }}>
        <div style={{ width: '100%', height: '100%', background: PH.lime, borderRadius: '14px 14px 0 0', boxShadow: 'inset 0 4px 0 rgba(255,255,255,0.2), inset 4px 0 0 rgba(255,255,255,0.2)' }} />
      </div>
    </>
  );
}

function EMGMeter({ emgLevel, threshold }) {
  return (
    <div style={{ position: 'absolute', left: 14, bottom: 100, top: 80, width: 36, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 6 }}>
      <div style={{ fontFamily: PH.fontMono, fontSize: 9, letterSpacing: '0.1em', color: PH.ink, marginBottom: 6, background: 'rgba(255,255,255,0.85)', padding: '2px 6px', borderRadius: 999 }}>EMG</div>
      <div style={{ flex: 1, width: 14, borderRadius: 8, background: 'rgba(255,255,255,0.85)', border: `1px solid ${PH.hair}`, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: -3, right: -3, bottom: `${threshold * 100}%`, height: 2, background: PH.violet }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${emgLevel * 100}%`, background: `linear-gradient(180deg, ${PH.limeBright}, ${PH.lime})`, transition: 'height 0.2s', boxShadow: `0 0 10px ${PH.limeBright}` }} />
      </div>
      <div style={{ fontFamily: PH.fontMono, fontSize: 10, color: PH.lime, marginTop: 6, fontVariantNumeric: 'tabular-nums', background: 'rgba(255,255,255,0.85)', padding: '2px 6px', borderRadius: 999, fontWeight: 600 }}>{(emgLevel * 100).toFixed(0)}%</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Results, Progress, Settings, PDF — light versions
// ─────────────────────────────────────────────────────────────
function ScreenResults() {
  return (
    <PhoneShell hideTab>
      <div style={{ height: '100%', overflow: 'auto', padding: '8px 20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <IconBtn style={{ width: 36, height: 36 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={PH.ink} strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M6 18L18 6" /></svg>
          </IconBtn>
        </div>
        <div style={{ textAlign: 'center', padding: '14px 0 22px' }}>
          <Pill filled style={{ marginBottom: 14 }}>NEW BEST</Pill>
          <div style={{ fontFamily: PH.fontSans, fontSize: 64, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1, color: PH.lime }}>1,420</div>
          <div style={{ fontFamily: PH.fontMono, fontSize: 11, letterSpacing: '0.1em', color: PH.inkFaint, marginTop: 6 }}>SPARROW · УРОВЕНЬ 4</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          <Card padded={false} style={{ padding: '14px 16px' }}>
            <div style={{ fontFamily: PH.fontMono, fontSize: 10, letterSpacing: '0.1em', color: PH.inkFaint }}>ВРЕМЯ В ЦЕЛИ</div>
            <div style={{ fontFamily: PH.fontSans, fontSize: 26, fontWeight: 700, marginTop: 4 }}>4:18</div>
            <div style={{ fontSize: 11, color: PH.lime, marginTop: 2, fontWeight: 600 }}>+0:42</div>
          </Card>
          <Card padded={false} style={{ padding: '14px 16px' }}>
            <div style={{ fontFamily: PH.fontMono, fontSize: 10, letterSpacing: '0.1em', color: PH.inkFaint }}>ТОЧНОСТЬ</div>
            <div style={{ fontFamily: PH.fontSans, fontSize: 26, fontWeight: 700, marginTop: 4 }}>87<span style={{ fontSize: 14, color: PH.inkDim }}>%</span></div>
            <div style={{ fontSize: 11, color: PH.lime, marginTop: 2, fontWeight: 600 }}>+5%</div>
          </Card>
        </div>
        <Card style={{ marginBottom: 14 }}>
          <div style={{ fontFamily: PH.fontMono, fontSize: 10, letterSpacing: '0.1em', color: PH.inkFaint, marginBottom: 8 }}>ПИКИ СИГНАЛА</div>
          <EMGWave width={310} height={70} intensity={0.9} density={1.2} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontFamily: PH.fontMono, fontSize: 10, color: PH.inkFaint }}>
            <span>0:00</span><span>2:00</span><span>4:18</span>
          </div>
        </Card>
        <Card style={{ marginBottom: 18, background: PH.violetSoft, borderColor: 'transparent' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ fontSize: 22, color: PH.violet }}>★</div>
            <div>
              <div style={{ fontFamily: PH.fontSans, fontSize: 14, fontWeight: 600 }}>Достижение: «Стабильная семёрка»</div>
              <div style={{ fontSize: 12, color: PH.inkDim, marginTop: 4, lineHeight: 1.4 }}>
                7 удержаний подряд выше порога. Этот же навык понадобится для управления пальцами протеза.
              </div>
            </div>
          </div>
        </Card>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
          <GhostBtn full>Заново</GhostBtn>
          <PrimaryBtn full>Следующая →</PrimaryBtn>
        </div>
      </div>
    </PhoneShell>
  );
}

function ScreenProgress() {
  const days = [
    { d: 'П', v: 0.4 }, { d: 'В', v: 0.7 }, { d: 'С', v: 0.6 },
    { d: 'Ч', v: 0.85, today: true }, { d: 'П', v: 0 }, { d: 'С', v: 0 }, { d: 'В', v: 0 },
  ];
  const skills = [
    { name: 'Активация', value: 78, color: PH.lime, delta: '+12' },
    { name: 'Точность импульса', value: 64, color: PH.violet, delta: '+8' },
    { name: 'Дозирование силы', value: 41, color: PH.coral, delta: '+3' },
  ];
  return (
    <PhoneShell tab="progress">
      <div style={{ height: '100%', overflow: 'auto', padding: '8px 20px 16px' }}>
        <h1 style={{ fontFamily: PH.fontSans, fontSize: 30, fontWeight: 700, letterSpacing: '-0.03em', margin: '4px 0 4px' }}>Прогресс</h1>
        <div style={{ color: PH.inkDim, fontSize: 14, marginBottom: 16 }}>Неделя 7 из 16 до примерки протеза.</div>
        <Card raised style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
            <div>
              <div style={{ fontFamily: PH.fontMono, fontSize: 10, letterSpacing: '0.1em', color: PH.inkFaint }}>ЭТА НЕДЕЛЯ</div>
              <div style={{ fontFamily: PH.fontSans, fontSize: 26, fontWeight: 700, marginTop: 2 }}>52<span style={{ fontSize: 14, color: PH.inkDim, fontWeight: 500 }}> мин</span></div>
            </div>
            <Pill>+22%</Pill>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 90 }}>
            {days.map((d, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end' }}>
                  <div style={{ width: '100%', height: `${Math.max(d.v * 100, 4)}%`, background: d.today ? PH.lime : (d.v > 0 ? `${PH.lime}55` : PH.bgSoft), borderRadius: 4 }} />
                </div>
                <div style={{ fontFamily: PH.fontMono, fontSize: 10, color: d.today ? PH.lime : PH.inkFaint, fontWeight: d.today ? 600 : 400 }}>{d.d}</div>
              </div>
            ))}
          </div>
        </Card>
        <div style={{ fontFamily: PH.fontSans, fontSize: 16, fontWeight: 600, margin: '6px 4px 10px' }}>Навыки</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {skills.map((s, i) => (
            <Card key={i} padded={false} style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontFamily: PH.fontSans, fontSize: 14, fontWeight: 500 }}>{s.name}</span>
                <span style={{ fontFamily: PH.fontMono, fontSize: 12, color: s.color, fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                  {s.value}<span style={{ color: PH.inkFaint, fontWeight: 400 }}>/100</span>
                  <span style={{ marginLeft: 8, color: PH.lime }}>{s.delta}</span>
                </span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: PH.bgSoft, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${s.value}%`, background: s.color, borderRadius: 3 }} />
              </div>
            </Card>
          ))}
        </div>
        <div style={{ marginTop: 18 }}>
          <PrimaryBtn full>📄 Сгенерировать отчёт для протезиста</PrimaryBtn>
        </div>
      </div>
    </PhoneShell>
  );
}

function ScreenSettings() {
  return (
    <PhoneShell tab="settings">
      <div style={{ height: '100%', overflow: 'auto', padding: '8px 20px 16px' }}>
        <h1 style={{ fontFamily: PH.fontSans, fontSize: 30, fontWeight: 700, letterSpacing: '-0.03em', margin: '4px 0 14px' }}>Настройки</h1>
        <Card raised style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: 999, background: PH.limeBright, boxShadow: `0 0 8px ${PH.limeBright}` }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: PH.fontSans, fontSize: 14, fontWeight: 600 }}>Phantom Sensor</div>
              <div style={{ fontFamily: PH.fontMono, fontSize: 11, color: PH.inkDim, marginTop: 2 }}>BT · 87% · −52 dBm</div>
            </div>
            <GhostBtn style={{ padding: '8px 14px', fontSize: 12 }}>Откалибровать</GhostBtn>
          </div>
        </Card>
        <SettingRow label="Чувствительность" value="0.42 mV">
          <div style={{ marginTop: 8, position: 'relative', height: 26 }}>
            <div style={{ position: 'absolute', top: 12, left: 0, right: 0, height: 4, background: PH.bgSoft, borderRadius: 2 }} />
            <div style={{ position: 'absolute', top: 12, left: 0, width: '42%', height: 4, background: PH.lime, borderRadius: 2 }} />
            <div style={{ position: 'absolute', top: 6, left: '42%', width: 16, height: 16, borderRadius: 999, background: PH.ink, transform: 'translateX(-50%)', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'absolute', bottom: 0, left: 0, right: 0, fontFamily: PH.fontMono, fontSize: 10, color: PH.inkFaint }}>
              <span>МЯГКО</span><span>ЖЁСТКО</span>
            </div>
          </div>
        </SettingRow>
        <SettingRow label="Сложность">
          <div style={{ display: 'flex', gap: 0, marginTop: 10, padding: 4, background: PH.bgSoft, borderRadius: 10 }}>
            <div style={{ flex: 1, padding: '8px 0', textAlign: 'center', borderRadius: 8, background: PH.ink, color: '#FFF', fontSize: 13, fontWeight: 600, fontFamily: PH.fontSans }}>Новичок</div>
            <div style={{ flex: 1, padding: '8px 0', textAlign: 'center', fontSize: 13, color: PH.inkDim, fontFamily: PH.fontSans }}>Продвинутый</div>
          </div>
        </SettingRow>
        <SettingRow label="Звук и вибрация" toggle value={true} />
        <SettingRow label="Напоминания" toggle value={true} />
      </div>
    </PhoneShell>
  );
}

function SettingRow({ label, value, children, toggle, value: tval }) {
  return (
    <div style={{ padding: '14px 16px', borderRadius: 14, background: PH.bgAlt, border: `1px solid ${PH.hair}`, marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: PH.fontSans, fontSize: 14, fontWeight: 500 }}>{label}</span>
        {!toggle && value && <span style={{ fontFamily: PH.fontMono, fontSize: 12, color: PH.lime, fontWeight: 600 }}>{value}</span>}
        {toggle && (
          <div style={{ width: 40, height: 22, borderRadius: 999, background: tval ? PH.lime : PH.bgSoft, position: 'relative', transition: 'background 0.15s' }}>
            <div style={{ position: 'absolute', top: 2, left: tval ? 20 : 2, width: 18, height: 18, borderRadius: 999, background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.15)', transition: 'left 0.15s' }} />
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

function ScreenDoctorPDF() {
  return (
    <PhoneShell hideTab>
      <div style={{ height: '100%', overflow: 'auto', padding: '8px 20px 16px', background: PH.bg }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <IconBtn style={{ width: 36, height: 36 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={PH.ink} strokeWidth="2.4" strokeLinecap="round"><path d="M14 6l-6 6 6 6" /></svg>
          </IconBtn>
          <span style={{ fontFamily: PH.fontSans, fontSize: 15, fontWeight: 600 }}>Отчёт</span>
          <IconBtn style={{ width: 36, height: 36 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={PH.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M16 6l-4-4-4 4M12 2v14" /></svg>
          </IconBtn>
        </div>
        <div style={{ background: '#FFFFFF', color: '#1A1A1F', borderRadius: 6, padding: 20, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div style={{ fontFamily: PH.fontSans, fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>Phantom<span style={{ color: PH.lime }}>.</span></div>
              <div style={{ fontFamily: PH.fontMono, fontSize: 9, color: '#666', marginTop: 2, letterSpacing: '0.06em' }}>ОТЧЁТ ПАЦИЕНТА · 2026-04-27</div>
            </div>
            <div style={{ fontFamily: PH.fontMono, fontSize: 9, color: '#888', textAlign: 'right' }}>id #2401-А<br/>стр. 1 / 2</div>
          </div>
          <div style={{ borderTop: '1px solid #E5E1D6', paddingTop: 12, marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: '#666' }}>Пациент</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>Алмас К., 34 г.</div>
            <div style={{ fontSize: 11, color: '#666', marginTop: 6 }}>Уровень ампутации: правое предплечье, треть верхняя</div>
          </div>
          <div style={{ fontFamily: PH.fontMono, fontSize: 9, letterSpacing: '0.1em', color: '#666', marginBottom: 6 }}>СВОДКА · 7 ДНЕЙ</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <div style={{ background: PH.bgSoft, padding: 10, borderRadius: 4 }}>
              <div style={{ fontSize: 9, color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Время</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>52 мин</div>
              <div style={{ fontSize: 9, color: PH.lime, fontWeight: 600 }}>+22%</div>
            </div>
            <div style={{ background: PH.bgSoft, padding: 10, borderRadius: 4 }}>
              <div style={{ fontSize: 9, color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Сессий</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>11</div>
              <div style={{ fontSize: 9, color: PH.lime, fontWeight: 600 }}>цель: 7</div>
            </div>
          </div>
          <div style={{ background: PH.bgSoft, padding: 10, borderRadius: 4, marginBottom: 14 }}>
            <div style={{ fontFamily: PH.fontMono, fontSize: 9, letterSpacing: '0.1em', color: '#666', marginBottom: 4 }}>ПИК АМПЛИТУДЫ EMG</div>
            <EMGWave width={260} height={40} color={PH.lime} intensity={0.85} glow={false} />
          </div>
          <div style={{ fontFamily: PH.fontMono, fontSize: 9, letterSpacing: '0.1em', color: '#666', marginBottom: 6 }}>НАВЫКИ</div>
          {[{ n: 'Активация', v: 78, d: '+12' }, { n: 'Точность импульса', v: 64, d: '+8' }, { n: 'Дозирование силы', v: 41, d: '+3' }].map(s => (
            <div key={s.n} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                <span>{s.n}</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>{s.v}/100  <span style={{ color: PH.lime, fontWeight: 600 }}>{s.d}</span></span>
              </div>
              <div style={{ height: 4, background: '#E5E1D6', borderRadius: 2 }}>
                <div style={{ width: `${s.v}%`, height: '100%', background: PH.lime, borderRadius: 2 }} />
              </div>
            </div>
          ))}
          <div style={{ marginTop: 14, padding: 10, background: PH.limeSoft, borderLeft: `3px solid ${PH.lime}`, fontSize: 11, lineHeight: 1.5 }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Заметка для протезиста</div>
            Дозирование силы — слабое звено. Рекомендую увеличить долю Steady Climb до 40% сессии.
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          <PrimaryBtn full>Поделиться PDF</PrimaryBtn>
        </div>
      </div>
    </PhoneShell>
  );
}

Object.assign(window, {
  ScreenOnboarding, ScreenCalibration, ScreenHome, ScreenCatalog,
  ScreenGameSparrow, ScreenGamePulseRun, ScreenGameSteadyClimb,
  ScreenResults, ScreenProgress, ScreenSettings, ScreenDoctorPDF,
});
