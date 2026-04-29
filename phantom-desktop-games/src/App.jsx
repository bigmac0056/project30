import React, { useState } from 'react';
import { PH } from './theme';
import GameSparrow from './games/sparrow/GameSparrow';
import GamePulseRun from './games/pulserun/GamePulseRun';
import GameSteadyClimb from './games/steadyclimb/GameSteadyClimb';
import { useSensor } from './hooks/useSensor';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import { api } from './services/api';

const GAMES = [
  {
    id: 'sparrow', name: 'Sparrow', sub: 'flappy · удержание',
    skill: 'Активация', color: PH.lime, bg: PH.limeSoft,
    apiKey: 'Sparrow',
  },
  {
    id: 'pulse', name: 'Pulse Run', sub: 'раннер · импульс',
    skill: 'Точность', color: PH.violet, bg: PH.violetSoft,
    apiKey: 'Pulse Run',
  },
  {
    id: 'climb', name: 'Steady Climb', sub: 'альпинист · дозирование',
    skill: 'Контроль', color: PH.coral, bg: '#FCE6DD',
    apiKey: 'Steady Climb',
  },
];

function AppInner() {
  const [activeGame, setActiveGame] = useState(null);
  const { wsConnected, deviceConnected } = useSensor();
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: PH.bg }}>
        <span style={{ fontFamily: PH.fontMono, fontSize: 13, color: PH.inkFaint }}>Загрузка...</span>
      </div>
    );
  }

  if (!user) return <AuthPage />;

  const handleGameEnd = async ({ score, game, durationSec, emgPeak, emgAvg }) => {
    setActiveGame(null);
    try {
      await api.createSession({
        game,
        score,
        duration_sec: durationSec,
        emg_peak: emgPeak,
        emg_avg: emgAvg,
        activation_score: Math.min(100, Math.round(emgPeak * 100)),
        precision_score:  Math.min(100, Math.round(score / 10)),
        dosing_score:     Math.min(100, Math.round(emgAvg * 100)),
      });
    } catch { /* session save failure is silent */ }
  };

  if (activeGame === 'sparrow') return <GameSparrow onBack={(r) => r ? handleGameEnd({ ...r, game: 'Sparrow' }) : setActiveGame(null)} />;
  if (activeGame === 'pulse')   return <GamePulseRun onBack={(r) => r ? handleGameEnd({ ...r, game: 'Pulse Run' }) : setActiveGame(null)} />;
  if (activeGame === 'climb')   return <GameSteadyClimb onBack={(r) => r ? handleGameEnd({ ...r, game: 'Steady Climb' }) : setActiveGame(null)} />;

  return (
    <div style={css.root}>
      {/* Brand */}
      <div style={css.header}>
        <span style={css.brand}>Phantom<span style={{ color: PH.lime }}>.</span></span>
        <span style={css.brandSub}>EMG Тренажёр · Desktop</span>
      </div>

      {/* User bar */}
      <div style={css.userBar}>
        <span style={{ fontFamily: PH.fontMono, fontSize: 11, color: PH.inkDim }}>
          👤 {user.name}
        </span>
        <button style={css.logoutBtn} onClick={logout}>Выйти</button>
      </div>

      {/* Sensor status bar */}
      <div style={{ ...css.sensorBar, borderColor: deviceConnected ? `${PH.lime}55` : wsConnected ? `${PH.coral}33` : PH.hair }}>
        <span style={{ ...css.sensorBarDot, background: deviceConnected ? PH.limeBright : wsConnected ? PH.coral : PH.inkFaint,
          boxShadow: deviceConnected ? `0 0 8px ${PH.limeBright}` : 'none' }} />
        <span style={{ fontFamily: PH.fontMono, fontSize: 11, letterSpacing: '0.08em', color: PH.inkDim }}>
          {deviceConnected ? 'Arduino подключён · Режим датчика активен'
            : wsConnected ? 'Бэкенд доступен · Arduino не найден — подключи датчик'
            : 'Нет соединения с бэкендом · Подключи устройство'}
        </span>
      </div>

      <p style={css.intro}>
        Три игры — три навыка для управления бионическим протезом.<br />
        <span style={css.hint}>
          {deviceConnected
            ? 'Управление: сожми мышцу — это управляет игрой напрямую.'
            : 'Подключи EMG датчик (Arduino) для игры.'}
        </span>
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
        <span style={css.footerTxt}>Phantom EMG · v0.4</span>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
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
  header: { textAlign: 'center', marginBottom: 8 },
  brand: { fontFamily: PH.fontSans, fontSize: 48, fontWeight: 700, letterSpacing: '-0.04em' },
  brandSub: { display: 'block', fontFamily: PH.fontMono, fontSize: 12, color: PH.inkFaint, letterSpacing: '0.1em', marginTop: 4 },
  userBar: {
    display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
    padding: '6px 14px', borderRadius: 999,
    background: PH.bgAlt, border: `1px solid ${PH.hair}`,
  },
  logoutBtn: {
    border: 'none', background: 'transparent', fontFamily: PH.fontMono,
    fontSize: 10, color: PH.inkFaint, cursor: 'pointer', letterSpacing: '0.06em',
  },
  intro: { textAlign: 'center', fontSize: 15, color: PH.inkDim, lineHeight: 1.6, marginBottom: 36 },
  hint: { fontSize: 13, color: PH.inkFaint },
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
  sensorBar: {
    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20,
    padding: '8px 16px', borderRadius: 999, border: '1px solid',
    background: 'rgba(255,255,255,0.6)',
  },
  sensorBarDot: { width: 8, height: 8, borderRadius: '50%', display: 'inline-block', flexShrink: 0 },
};
