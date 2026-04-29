/**
 * ProgressPage.jsx — phantom-desktop-games
 * Полный рестайлинг: крупные кольца, цветные карточки, бар-чарт с подписями
 */
import React, { useState, useEffect } from 'react';
import { PH } from '../theme';
import { api } from '../services/api';

/* ── Ring SVG ── */
function Ring({ value, color, size = 96 }) {
  const pct  = Math.max(0, Math.min(100, Math.round(value ?? 0)));
  const r    = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const off  = circ * (1 - pct / 100);
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={PH.bgSoft} strokeWidth={10} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={10}
        strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.22,.68,0,1.2)' }}
      />
    </svg>
  );
}

/* ── Skill ring card ── */
function SkillCard({ label, value, delta, color, icon }) {
  const pct  = Math.round(value ?? 0);
  const pos  = (delta ?? 0) >= 0;
  const sign = pos ? '+' : '';
  return (
    <div style={{ ...s.skillCard, borderColor: `${color}30` }} className="stat-card anim-pop-in">
      <div style={{ position: 'relative', width: 96, height: 96 }}>
        <Ring value={pct} color={color} />
        <div style={s.ringCenter}>
          <span style={{ fontFamily: PH.fontSans, fontSize: 20, fontWeight: 800, color: PH.ink, lineHeight: 1 }}>{pct}</span>
          <span style={{ fontFamily: PH.fontMono, fontSize: 8, color: PH.inkFaint, letterSpacing: '0.06em' }}>/100</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span style={{ fontFamily: PH.fontSans, fontSize: 13, fontWeight: 600, color: PH.ink }}>{label}</span>
      </div>
      <div style={{ fontFamily: PH.fontMono, fontSize: 10, color: pos ? PH.ok : PH.coral, fontWeight: 700, background: pos ? `${PH.ok}14` : `${PH.coral}14`, padding: '2px 8px', borderRadius: 999 }}>
        {sign}{Math.round(delta ?? 0)} за период
      </div>
    </div>
  );
}

/* ── Week bar chart ── */
function WeekChart({ data = [] }) {
  const max    = Math.max(...data, 1);
  const today  = new Date().getDay();
  const days   = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];
  const labels = Array.from({ length: 7 }, (_, i) => days[(today - 6 + i + 7) % 7]);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 80, padding: '0 4px' }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          {v > 0 && (
            <span style={{ fontFamily: PH.fontMono, fontSize: 8, color: PH.inkFaint, marginBottom: 2 }}>{v}м</span>
          )}
          <div style={{
            width: '100%', background: v > 0 ? PH.limeBright : PH.bgSoft,
            borderRadius: 4, height: `${Math.max(6, (v / max) * 56)}px`,
            transition: 'height 0.7s cubic-bezier(.22,.68,0,1.2)',
            boxShadow: v > 0 ? `0 2px 8px ${PH.limeBright}44` : 'none',
          }} />
          <span style={{ fontFamily: PH.fontMono, fontSize: 9, color: PH.inkFaint }}>{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Game name badge ── */
const GAME_META = {
  'Sparrow':      { icon: '🐦', color: PH.lime },
  'Pulse Run':    { icon: '⚡', color: PH.violet },
  'Steady Climb': { icon: '🧗', color: PH.coral },
};

export default function ProgressPage({ onBack, onReport }) {
  const [progress, setProgress] = useState(null);
  const [sessions, setSessions]  = useState([]);
  const [loading,  setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      api.getProgress().catch(() => null),
      api.getSessions(8).catch(() => []),
    ]).then(([prog, sess]) => { setProgress(prog); setSessions(sess); setLoading(false); });
  }, []);

  const skills = progress ? [
    { label: 'Активация',   value: progress.activation_avg, delta: progress.activation_delta, color: PH.limeBright, icon: '⚡' },
    { label: 'Точность',    value: progress.precision_avg,  delta: progress.precision_delta,  color: PH.violet,     icon: '🎯' },
    { label: 'Дозирование', value: progress.dosing_avg,     delta: progress.dosing_delta,     color: PH.coral,      icon: '🎛️' },
  ] : [];

  const weekDelta = progress?.week_pct_change ?? 0;

  return (
    <div style={s.root} className="page-enter">

      {/* ── Top bar ── */}
      <div style={s.topBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="btn-ghost" style={s.backBtn} onClick={onBack}>← Назад</button>
          <div style={s.topDivider} />
          <span style={s.topBrand}>Phantom<span style={{ color: PH.lime }}>.</span></span>
        </div>
        <span style={s.topTitle}>Прогресс</span>
        <button className="btn-primary btn-print" style={s.reportBtn} onClick={onReport}>
          📄 Отчёт для врача
        </button>
      </div>

      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
          <div style={s.spinner} />
          <span style={{ fontFamily: PH.fontMono, fontSize: 12, color: PH.inkFaint }}>Загрузка данных...</span>
        </div>
      ) : (
        <div style={s.scroll}>

          {/* ── Hero stat row ── */}
          <div style={s.statRow}>
            {[
              { icon: '🎮', label: 'Сессий всего',  val: progress?.total_sessions ?? 0, unit: '',     accent: PH.lime },
              { icon: '⏱️', label: 'Общее время',   val: progress?.total_minutes   ?? 0, unit: ' мин', accent: PH.violet },
              { icon: '📅', label: 'За неделю',     val: progress?.week_minutes    ?? 0, unit: ' мин', accent: PH.ok },
              { icon: weekDelta >= 0 ? '📈' : '📉', label: 'Динамика',  val: `${weekDelta >= 0 ? '+' : ''}${weekDelta}`, unit: '%', accent: weekDelta >= 0 ? PH.ok : PH.coral },
              { icon: '🔥', label: 'Серия подряд',  val: progress?.streak_days ?? 0, unit: ' дн',  accent: PH.coral },
            ].map((c, i) => (
              <div key={i} className="stat-card anim-pop-in" style={{ ...s.statCard, borderTop: `3px solid ${c.accent}` }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{c.icon}</div>
                <div style={s.statVal}>{c.val}<span style={s.statUnit}>{c.unit}</span></div>
                <div style={s.statLbl}>{c.label}</div>
              </div>
            ))}
          </div>

          {/* ── 2-col layout: chart + skills ── */}
          <div style={s.twoCol}>

            {/* Activity chart */}
            <div style={s.card}>
              <div style={s.cardHead}>
                <span style={s.cardTitle}>АКТИВНОСТЬ</span>
                <span style={s.cardSub}>7 дней · минуты</span>
              </div>
              <WeekChart data={progress?.daily_minutes ?? []} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                <span style={s.chartNote}>↑ рост: {weekDelta >= 0 ? '+' : ''}{weekDelta}% к прошлой неделе</span>
                <span style={s.chartNote}>всего {progress?.total_minutes ?? 0} мин</span>
              </div>
            </div>

            {/* Streak/week summary */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ ...s.card, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 6, background: `linear-gradient(135deg, ${PH.limeSoft}, #fff)`, borderColor: `${PH.lime}40` }}>
                <div style={{ fontSize: 36 }}>🔥</div>
                <div style={{ fontFamily: PH.fontSans, fontSize: 32, fontWeight: 800, color: PH.ink, letterSpacing: '-0.04em' }}>
                  {progress?.streak_days ?? 0}
                </div>
                <div style={{ fontFamily: PH.fontMono, fontSize: 10, color: PH.inkFaint, letterSpacing: '0.1em' }}>ДНЕЙ ПОДРЯД</div>
              </div>
              <div style={{ ...s.card, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 6, background: `linear-gradient(135deg, ${PH.violetSoft}, #fff)`, borderColor: `${PH.violet}40` }}>
                <div style={{ fontSize: 36 }}>🎮</div>
                <div style={{ fontFamily: PH.fontSans, fontSize: 32, fontWeight: 800, color: PH.ink, letterSpacing: '-0.04em' }}>
                  {progress?.total_sessions ?? 0}
                </div>
                <div style={{ fontFamily: PH.fontMono, fontSize: 10, color: PH.inkFaint, letterSpacing: '0.1em' }}>СЕССИЙ ВСЕГО</div>
              </div>
            </div>
          </div>

          {/* ── Skill rings ── */}
          <div style={s.card}>
            <div style={s.cardHead}>
              <span style={s.cardTitle}>EMG НАВЫКИ</span>
              <span style={s.cardSub}>среднее за последние 20 сессий</span>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              {skills.length > 0
                ? skills.map(sk => <SkillCard key={sk.label} {...sk} />)
                : (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0', gap: 8 }}>
                    <span style={{ fontSize: 32 }}>🎮</span>
                    <span style={{ fontFamily: PH.fontSans, fontSize: 14, color: PH.inkDim }}>Сыграй первую сессию — появятся навыки</span>
                  </div>
                )
              }
            </div>
          </div>

          {/* ── Sessions table ── */}
          {sessions.length > 0 && (
            <div style={s.card}>
              <div style={s.cardHead}>
                <span style={s.cardTitle}>ПОСЛЕДНИЕ СЕССИИ</span>
                <span style={s.cardSub}>{sessions.length} записей</span>
              </div>
              <table style={s.table}>
                <thead>
                  <tr>
                    {['Дата','Игра','Счёт','Длит.','Активация','Точность','Дозирование'].map(h => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((sess, i) => {
                    const gm = GAME_META[sess.game] ?? { icon: '🎮', color: PH.inkFaint };
                    return (
                      <tr key={sess.id} className="table-row" style={{ background: i % 2 === 0 ? '#fff' : PH.bg }}>
                        <td style={s.td}>{new Date(sess.played_at).toLocaleDateString('ru-RU')}</td>
                        <td style={s.td}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                            <span>{gm.icon}</span>
                            <span style={{ color: gm.color, fontWeight: 600 }}>{sess.game}</span>
                          </span>
                        </td>
                        <td style={{ ...s.td, fontWeight: 700, color: PH.ink }}>{sess.score}</td>
                        <td style={{ ...s.td, color: PH.inkDim }}>{sess.duration_sec}с</td>
                        <td style={s.td}><Pill val={sess.activation_score ?? 0} color={PH.ok} /></td>
                        <td style={s.td}><Pill val={sess.precision_score  ?? 0} color={PH.violet} /></td>
                        <td style={s.td}><Pill val={sess.dosing_score     ?? 0} color={PH.coral} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {sessions.length === 0 && (
            <div style={s.emptyState}>
              <div style={{ fontSize: 48 }}>🎮</div>
              <div style={{ fontFamily: PH.fontSans, fontSize: 18, fontWeight: 700, color: PH.ink }}>Сессий пока нет</div>
              <div style={{ fontFamily: PH.fontSans, fontSize: 14, color: PH.inkDim }}>Сыграй первую игру — здесь появится твой прогресс</div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

/* tiny colored pill for score columns */
function Pill({ val, color }) {
  return (
    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 999, background: `${color}15`, color, fontWeight: 700, fontSize: 11 }}>
      {val}
    </span>
  );
}

const s = {
  root: { width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: PH.bg, overflow: 'hidden', fontFamily: PH.fontSans },

  /* topbar */
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: 56, background: PH.bgAlt, borderBottom: `1px solid ${PH.hair}`, flexShrink: 0 },
  backBtn: { fontFamily: PH.fontMono, fontSize: 12, color: PH.inkDim, background: 'transparent', border: 'none', cursor: 'pointer', letterSpacing: '0.02em' },
  topDivider: { width: 1, height: 18, background: PH.hair },
  topBrand: { fontFamily: PH.fontSans, fontSize: 16, fontWeight: 700, letterSpacing: '-0.03em', color: PH.ink },
  topTitle: { fontFamily: PH.fontSans, fontSize: 15, fontWeight: 600, color: PH.ink },
  reportBtn: { fontFamily: PH.fontSans, fontSize: 13, fontWeight: 600, color: '#fff', background: PH.ink, border: 'none', padding: '9px 18px', borderRadius: 10, cursor: 'pointer' },

  /* loading */
  spinner: { width: 28, height: 28, border: `3px solid ${PH.bgSoft}`, borderTop: `3px solid ${PH.lime}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' },

  /* scroll content */
  scroll: { flex: 1, overflowY: 'auto', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 960, margin: '0 auto', width: '100%', boxSizing: 'border-box' },

  /* stat cards */
  statRow: { display: 'flex', gap: 10 },
  statCard: { flex: 1, background: PH.bgAlt, border: `1px solid ${PH.hair}`, borderRadius: 14, padding: '14px 16px', display: 'flex', flexDirection: 'column' },
  statVal: { fontFamily: PH.fontSans, fontSize: 24, fontWeight: 800, color: PH.ink, letterSpacing: '-0.03em', lineHeight: 1 },
  statUnit: { fontSize: 13, fontWeight: 500, marginLeft: 2 },
  statLbl: { fontFamily: PH.fontMono, fontSize: 9, color: PH.inkFaint, letterSpacing: '0.08em', marginTop: 4 },

  /* 2-col */
  twoCol: { display: 'flex', gap: 16 },

  /* generic card */
  card: { background: PH.bgAlt, border: `1px solid ${PH.hair}`, borderRadius: 16, padding: '18px 20px', flex: 1 },
  cardHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 },
  cardTitle: { fontFamily: PH.fontMono, fontSize: 9, color: PH.inkFaint, letterSpacing: '0.14em', textTransform: 'uppercase' },
  cardSub: { fontFamily: PH.fontMono, fontSize: 9, color: PH.inkFaint, letterSpacing: '0.04em' },
  chartNote: { fontFamily: PH.fontMono, fontSize: 9, color: PH.inkFaint },

  /* skill ring card */
  skillCard: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 12px', border: `1.5px solid`, borderRadius: 14, background: PH.bg },
  ringCenter: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },

  /* table */
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { fontFamily: PH.fontMono, fontSize: 9, color: PH.inkFaint, textAlign: 'left', padding: '6px 10px', borderBottom: `1px solid ${PH.hair}`, letterSpacing: '0.08em', textTransform: 'uppercase' },
  td: { fontFamily: PH.fontMono, fontSize: 11, color: PH.inkDim, padding: '9px 10px' },

  /* empty */
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: 10 },
};
