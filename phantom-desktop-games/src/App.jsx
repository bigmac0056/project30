import React, { useState } from 'react';
import { PH } from './theme';
import GameSparrow from './games/sparrow/GameSparrow';
import GamePulseRun from './games/pulserun/GamePulseRun';
import GameSteadyClimb from './games/steadyclimb/GameSteadyClimb';

const GAMES = [
  {
    id: 'sparrow', name: 'Sparrow', sub: 'flappy · удержание',
    skill: 'Активация', color: PH.lime, bg: PH.limeSoft,
  },
  {
    id: 'pulse', name: 'Pulse Run', sub: 'раннер · импульс',
    skill: 'Точность', color: PH.violet, bg: PH.violetSoft,
  },
  {
    id: 'climb', name: 'Steady Climb', sub: 'альпинист · дозирование',
    skill: 'Контроль', color: PH.coral, bg: '#FCE6DD',
  },
];

export default function App() {
  const [activeGame, setActiveGame] = useState(null);

  if (activeGame === 'sparrow') return <GameSparrow onBack={() => setActiveGame(null)} />;
  if (activeGame === 'pulse')   return <GamePulseRun onBack={() => setActiveGame(null)} />;
  if (activeGame === 'climb')   return <GameSteadyClimb onBack={() => setActiveGame(null)} />;

  return (
    <div style={css.root}>
      {/* Brand */}
      <div style={css.header}>
        <span style={css.brand}>Phantom<span style={{ color: PH.lime }}>.</span></span>
        <span style={css.brandSub}>EMG Тренажёр · Desktop</span>
      </div>

      <p style={css.intro}>
        Три игры — три навыка для управления бионическим протезом.<br />
        <span style={css.hint}>Управление: зажми <kbd style={css.kbd}>ПРОБЕЛ</kbd> или удержи <kbd style={css.kbd}>ЛКМ</kbd> — это симулирует напряжение мышцы.</span>
      </p>

      <div style={css.grid}>
        {GAMES.map(g => (
          <button key={g.id} style={{ ...css.card, background: g.bg, borderColor: `${g.color}33` }}
            onClick={() => setActiveGame(g.id)}>
            <div style={{ ...css.cardDot, background: g.color }} />
            <div style={css.cardName}>{g.name}</div>
            <div style={css.cardSub}>{g.sub}</div>
            <div style={{ ...css.cardSkill, color: g.color, background: `${g.color}18`, borderColor: `${g.color}33` }}>
              ● {g.skill}
            </div>
            <div style={{ ...css.playBtn, background: g.color }}>Играть →</div>
          </button>
        ))}
      </div>

      <div style={css.footer}>
        <span style={css.footerTxt}>Phantom EMG · v0.4 · Linux Desktop</span>
      </div>
    </div>
  );
}

const css = {
  root: {
    width: '100vw', height: '100vh', background: PH.bg,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    fontFamily: PH.fontSans, color: PH.ink,
    padding: 40,
  },
  header: { textAlign: 'center', marginBottom: 12 },
  brand: { fontFamily: PH.fontSans, fontSize: 48, fontWeight: 700, letterSpacing: '-0.04em' },
  brandSub: { display: 'block', fontFamily: PH.fontMono, fontSize: 12, color: PH.inkFaint, letterSpacing: '0.1em', marginTop: 4 },
  intro: { textAlign: 'center', fontSize: 15, color: PH.inkDim, lineHeight: 1.6, marginBottom: 36 },
  hint: { fontSize: 13, color: PH.inkFaint },
  kbd: {
    background: PH.bgSoft, border: `1px solid ${PH.hairStrong}`,
    borderRadius: 4, padding: '1px 6px', fontFamily: PH.fontMono,
    fontSize: 12, color: PH.ink,
  },
  grid: { display: 'flex', gap: 20 },
  card: {
    width: 240, padding: '28px 24px',
    border: '1.5px solid', borderRadius: 20,
    cursor: 'pointer', textAlign: 'left',
    display: 'flex', flexDirection: 'column', gap: 8,
    transition: 'transform 0.15s, box-shadow 0.15s',
    outline: 'none',
  },
  cardDot: { width: 10, height: 10, borderRadius: '50%', marginBottom: 4 },
  cardName: { fontFamily: PH.fontSans, fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', color: PH.ink },
  cardSub: { fontFamily: PH.fontMono, fontSize: 10, color: PH.inkFaint, letterSpacing: '0.08em' },
  cardSkill: {
    alignSelf: 'flex-start', padding: '3px 8px', borderRadius: 999,
    fontFamily: PH.fontMono, fontSize: 10, fontWeight: 500,
    letterSpacing: '0.08em', border: '1px solid',
  },
  playBtn: {
    alignSelf: 'flex-start', marginTop: 8, padding: '8px 18px',
    borderRadius: 10, color: '#FFF', fontFamily: PH.fontSans,
    fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer',
  },
  footer: { marginTop: 40 },
  footerTxt: { fontFamily: PH.fontMono, fontSize: 11, color: PH.inkFaint, letterSpacing: '0.06em' },
};
