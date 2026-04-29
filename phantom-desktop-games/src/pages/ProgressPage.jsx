/**
 * ProgressPage.jsx — phantom-desktop-games
 * ─────────────────────────────────────────
 * Shows skill averages, session history and weekly activity — same data as mobile.
 */
import React, { useState, useEffect } from 'react';
import { PH } from '../theme';
import { api } from '../services/api';

function Ring({ value, color, size = 72 }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={PH.bgSoft} strokeWidth={8} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={8}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
    </svg>
  );
}

function SkillCard({ label, value, delta, color }) {
  const pct = Math.round(value ?? 0);
  const sign = (delta ?? 0) >= 0 ? '+' : '';
  return (
    <div style={css.skillCard}>
      <div style={{ position: 'relative', width: 72, height: 72 }}>
        <Ring value={pct} color={color} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
          <span style={{ fontFamily: PH.fontSans, fontSize: 15, fontWeight: 700, color: PH.ink }}>{pct}</span>
        </div>
      </div>
      <div style={css.skillName}>{label}</div>
      <div style={{ fontFamily: PH.fontMono, fontSize: 11, color: (delta ?? 0) >= 0 ? PH.ok : PH.coral, fontWeight: 700 }}>
        {sign}{Math.round(delta ?? 0)} за период
      </div>
    </div>
  );
}

function WeekChart({ data = [] }) {
  const max = Math.max(...data, 1);
  const today = new Date().getDay();
  const dayLabels = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];
  const labels = Array.from({ length: 7 }, (_, i) => {
    const d = (today - 6 + i + 7) % 7;
    return dayLabels[d];
  });
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 60, padding: '0 4px' }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{
            width: '100%', background: v > 0 ? PH.limeBright : PH.bgSoft,
            borderRadius: 3, height: `${Math.max(4, (v / max) * 48)}px`,
            transition: 'height 0.6s ease',
          }} />
          <span style={{ fontFamily: PH.fontMono, fontSize: 9, color: PH.inkFaint }}>{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

export default function ProgressPage({ onBack, onReport }) {
  const [progress, setProgress] = useState(null);
  const [sessions, setSessions]  = useState([]);
  const [loading,  setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      api.getProgress().catch(() => null),
      api.getSessions(8).catch(() => []),
    ]).then(([prog, sess]) => {
      setProgress(prog);
      setSessions(sess);
      setLoading(false);
    });
  }, []);

  const skills = progress ? [
    { label: 'Активация',  value: progress.activation_avg, delta: progress.activation_delta, color: PH.limeBright },
    { label: 'Точность',   value: progress.precision_avg,  delta: progress.precision_delta,  color: PH.violet },
    { label: 'Дозирование',value: progress.dosing_avg,      delta: progress.dosing_delta,     color: PH.coral },
  ] : [];

  return (
    <div style={css.root}>
      <div style={css.topBar}>
        <button style={css.backBtn} onClick={onBack}>← Назад</button>
        <span style={{ fontFamily: PH.fontSans, fontSize: 15, fontWeight: 700, color: PH.ink }}>Прогресс</span>
        <button style={css.reportBtn} onClick={onReport}>📄 Отчёт для врача</button>
      </div>

      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: PH.fontMono, fontSize: 13, color: PH.inkFaint }}>Загрузка...</span>
        </div>
      ) : (
        <div style={css.scroll}>
          {/* stat row */}
          <div style={css.statRow}>
            {[
              { label: 'Сессий всего',  value: progress?.total_sessions ?? 0, unit: '' },
              { label: 'Минут всего',   value: progress?.total_minutes   ?? 0, unit: ' мин' },
              { label: 'За неделю',     value: progress?.week_minutes    ?? 0, unit: ' мин' },
              { label: 'Серия',         value: progress?.streak_days     ?? 0, unit: ' дн' },
            ].map(s => (
              <div key={s.label} style={css.statCard}>
                <div style={css.statCardLabel}>{s.label}</div>
                <div style={css.statCardValue}>{s.value}{s.unit}</div>
              </div>
            ))}
          </div>

          {/* weekly chart */}
          <div style={css.card}>
            <div style={css.cardTitle}>АКТИВНОСТЬ · 7 ДНЕЙ</div>
            <WeekChart data={progress?.daily_minutes ?? []} />
          </div>

          {/* skill rings */}
          <div style={css.card}>
            <div style={css.cardTitle}>НАВЫКИ EMG</div>
            <div style={{ display: 'flex', gap: 24, justifyContent: 'center' }}>
              {skills.length > 0
                ? skills.map(sk => <SkillCard key={sk.label} {...sk} />)
                : <span style={{ fontFamily: PH.fontMono, fontSize: 12, color: PH.inkFaint }}>Нет данных — сыграй хотя бы одну сессию</span>
              }
            </div>
          </div>

          {/* sessions table */}
          {sessions.length > 0 && (
            <div style={css.card}>
              <div style={css.cardTitle}>ПОСЛЕДНИЕ СЕССИИ</div>
              <table style={css.table}>
                <thead>
                  <tr>
                    {['Дата','Игра','Счёт','Длит.','Активация','Точность','Дозирование'].map(h => (
                      <th key={h} style={css.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s, i) => (
                    <tr key={s.id} style={{ background: i % 2 === 0 ? '#fff' : PH.bg }}>
                      <td style={css.td}>{new Date(s.played_at).toLocaleDateString('ru-RU')}</td>
                      <td style={css.td}>{s.game}</td>
                      <td style={{ ...css.td, fontWeight: 700 }}>{s.score}</td>
                      <td style={css.td}>{s.duration_sec}с</td>
                      <td style={{ ...css.td, color: PH.ok }}>{s.activation_score ?? 0}</td>
                      <td style={{ ...css.td, color: PH.violet }}>{s.precision_score ?? 0}</td>
                      <td style={{ ...css.td, color: PH.coral }}>{s.dosing_score ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {sessions.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🎮</div>
              <div style={{ fontFamily: PH.fontSans, fontSize: 15, color: PH.inkDim }}>Сессий пока нет — сыграй первую игру</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const css = {
  root: { width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: PH.bg, overflow: 'hidden' },
  topBar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 24px', background: PH.bgAlt, borderBottom: `1px solid ${PH.hair}`,
    flexShrink: 0,
  },
  backBtn: { fontFamily: PH.fontMono, fontSize: 12, color: PH.inkDim, background: 'transparent', border: 'none', cursor: 'pointer' },
  reportBtn: {
    fontFamily: PH.fontSans, fontSize: 13, fontWeight: 600, color: '#fff',
    background: PH.ink, border: 'none', padding: '9px 18px', borderRadius: 10, cursor: 'pointer',
  },
  scroll: { flex: 1, overflowY: 'auto', padding: '28px 40px', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 900, margin: '0 auto', width: '100%', boxSizing: 'border-box' },
  statRow: { display: 'flex', gap: 12 },
  statCard: { flex: 1, background: PH.bgAlt, border: `1px solid ${PH.hair}`, borderRadius: 12, padding: '14px 16px' },
  statCardLabel: { fontFamily: PH.fontMono, fontSize: 9, color: PH.inkFaint, letterSpacing: '0.1em', marginBottom: 4 },
  statCardValue: { fontFamily: PH.fontSans, fontSize: 22, fontWeight: 700, color: PH.ink, letterSpacing: '-0.02em' },
  card: { background: PH.bgAlt, border: `1px solid ${PH.hair}`, borderRadius: 14, padding: '18px 20px' },
  cardTitle: { fontFamily: PH.fontMono, fontSize: 9, color: PH.inkFaint, letterSpacing: '0.12em', marginBottom: 14 },
  skillCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 },
  skillName: { fontFamily: PH.fontSans, fontSize: 12, fontWeight: 600, color: PH.ink, textAlign: 'center' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  th: { fontFamily: PH.fontMono, fontSize: 9, color: PH.inkFaint, textAlign: 'left', padding: '6px 10px', borderBottom: `1px solid ${PH.hair}`, letterSpacing: '0.08em' },
  td: { fontFamily: PH.fontMono, fontSize: 12, color: PH.ink, padding: '7px 10px' },
};
