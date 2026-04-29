/**
 * ReportPage.jsx — phantom-desktop-games
 * ─────────────────────────────────────────
 * Official doctor/prosthetist report — A4 preview + browser Print-to-PDF.
 */
import React, { useState, useEffect, useRef } from 'react';
import { PH } from '../theme';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

/* ─── tiny bar component ─── */
function SkillBar({ label, value, delta, color }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const sign = delta >= 0 ? '+' : '';
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontFamily: PH.fontSans, fontSize: 13, color: PH.inkDim }}>{label}</span>
        <span style={{ fontFamily: PH.fontMono, fontSize: 12, color: PH.ink }}>
          {pct}/100&nbsp;&nbsp;
          <span style={{ color: delta >= 0 ? PH.limeBright : PH.coral, fontWeight: 700 }}>
            {sign}{Math.round(delta)}
          </span>
        </span>
      </div>
      <div style={{ height: 5, background: PH.bgSoft, borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.8s ease' }} />
      </div>
    </div>
  );
}

/* ─── mini bar-chart for 7-day activity ─── */
function WeekChart({ data = [] }) {
  const max = Math.max(...data, 1);
  const days = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
  const today = new Date().getDay(); // 0=Sun
  const labels = Array.from({ length: 7 }, (_, i) => {
    const d = (today - 6 + i + 7) % 7;
    return days[d === 0 ? 6 : d - 1];
  });
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 40 }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div style={{
            width: '100%', background: v > 0 ? PH.limeBright : PH.bgSoft,
            borderRadius: 2, height: `${Math.max(4, (v / max) * 36)}px`,
            transition: 'height 0.5s ease',
          }} />
          <span style={{ fontFamily: PH.fontMono, fontSize: 8, color: PH.inkFaint }}>{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

export default function ReportPage({ onBack }) {
  const { user } = useAuth();
  const [progress, setProgress] = useState(null);
  const [sessions, setSessions]  = useState([]);
  const [loading,  setLoading]   = useState(true);
  const printRef = useRef(null);

  const today = new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
  const todayIso = new Date().toISOString().split('T')[0];

  useEffect(() => {
    Promise.all([
      api.getProgress().catch(() => null),
      api.getSessions(10).catch(() => []),
    ]).then(([prog, sess]) => {
      setProgress(prog);
      setSessions(sess);
      setLoading(false);
    });
  }, []);

  const skills = progress ? [
    { label: 'Активация мышц',   value: progress.activation_avg, delta: progress.activation_delta, color: PH.limeBright },
    { label: 'Точность импульса', value: progress.precision_avg,  delta: progress.precision_delta,  color: PH.violet },
    { label: 'Дозирование силы', value: progress.dosing_avg,      delta: progress.dosing_delta,     color: PH.coral },
  ] : [];

  const weakSkill = skills.length ? skills.reduce((a, b) => a.value < b.value ? a : b) : null;

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={css.root}>
        <div style={css.topBar}>
          <button style={css.backBtn} onClick={onBack}>← Назад</button>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: PH.fontMono, fontSize: 13, color: PH.inkFaint }}>Загрузка данных...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={css.root}>
      {/* ── toolbar (hidden when printing) ── */}
      <div style={css.topBar} className="no-print">
        <button style={css.backBtn} onClick={onBack}>← Назад</button>
        <span style={{ fontFamily: PH.fontMono, fontSize: 11, color: PH.inkFaint, letterSpacing: '0.06em' }}>
          ПРЕДПРОСМОТР ОТЧЁТА
        </span>
        <button style={css.printBtn} onClick={handlePrint}>
          📄 Скачать PDF / Напечатать
        </button>
      </div>

      {/* ── A4 sheet ── */}
      <div style={css.scroll}>
        <div style={css.page} ref={printRef} id="report-page">

          {/* header */}
          <div style={css.pageHeader}>
            <div>
              <div style={css.brand}>Phantom<span style={{ color: PH.limeBright }}>.</span></div>
              <div style={css.brandSub}>EMG ТРЕНАЖЁР ДЛЯ РЕАБИЛИТАЦИИ · ОТЧЁТ ПАЦИЕНТА</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={css.metaLine}>Дата: {today}</div>
              <div style={css.metaLine}>ID пациента: #{user?.id ?? '—'}</div>
              <div style={css.metaLine}>стр. 1 / 1</div>
            </div>
          </div>

          <div style={css.divider} />

          {/* patient info */}
          <div style={css.section}>
            <div style={css.sectionTitle}>ПАЦИЕНТ</div>
            <div style={{ display: 'flex', gap: 40 }}>
              <div>
                <div style={css.fieldLabel}>ФИО / Имя</div>
                <div style={css.fieldValue}>{user?.name ?? '—'}</div>
              </div>
              <div>
                <div style={css.fieldLabel}>Email</div>
                <div style={css.fieldValue}>{user?.email ?? '—'}</div>
              </div>
              <div>
                <div style={css.fieldLabel}>Уровень ампутации</div>
                <div style={css.fieldValue}>{user?.amputation_level ?? 'Не указан'}</div>
              </div>
              <div>
                <div style={css.fieldLabel}>Неделя реабилитации</div>
                <div style={css.fieldValue}>Неделя {progress?.current_week ?? 1}</div>
              </div>
            </div>
          </div>

          <div style={css.divider} />

          {/* summary stats */}
          <div style={css.section}>
            <div style={css.sectionTitle}>СВОДКА · ПОСЛЕДНИЕ 7 ДНЕЙ</div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              {[
                { label: 'Всего сессий',    value: progress?.total_sessions ?? 0, unit: '',    color: PH.ink },
                { label: 'Время за неделю', value: progress?.week_minutes ?? 0,   unit: ' мин', color: PH.ink },
                { label: 'Рост активности', value: (progress?.week_pct_change ?? 0) >= 0 ? `+${progress?.week_pct_change ?? 0}` : progress?.week_pct_change ?? 0, unit: '%', color: (progress?.week_pct_change ?? 0) >= 0 ? PH.ok : PH.coral },
                { label: 'Серия дней',      value: progress?.streak_days ?? 0,    unit: ' дн', color: PH.limeBright },
              ].map(s => (
                <div key={s.label} style={css.statBox}>
                  <div style={css.statLabel}>{s.label}</div>
                  <div style={{ ...css.statValue, color: s.color }}>{s.value}{s.unit}</div>
                </div>
              ))}
              <div style={{ ...css.statBox, flex: 2 }}>
                <div style={css.statLabel}>Активность по дням</div>
                <WeekChart data={progress?.daily_minutes ?? []} />
              </div>
            </div>
          </div>

          <div style={css.divider} />

          {/* skills */}
          <div style={css.section}>
            <div style={css.sectionTitle}>EMG НАВЫКИ (среднее за последние 20 сессий)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 32px' }}>
              {skills.map(sk => <SkillBar key={sk.label} {...sk} />)}
            </div>
          </div>

          <div style={css.divider} />

          {/* recent sessions table */}
          {sessions.length > 0 && (
            <div style={css.section}>
              <div style={css.sectionTitle}>ПОСЛЕДНИЕ СЕССИИ</div>
              <table style={css.table}>
                <thead>
                  <tr>
                    {['Дата', 'Игра', 'Счёт', 'Длит.', 'EMG пик', 'Активация', 'Точность', 'Дозирование'].map(h => (
                      <th key={h} style={css.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s, i) => (
                    <tr key={s.id} style={{ background: i % 2 === 0 ? '#fff' : PH.bg }}>
                      <td style={css.td}>{new Date(s.played_at).toLocaleDateString('ru-RU')}</td>
                      <td style={css.td}>{s.game}</td>
                      <td style={{ ...css.td, fontWeight: 600 }}>{s.score}</td>
                      <td style={css.td}>{s.duration_sec}с</td>
                      <td style={css.td}>{Math.round((s.emg_peak ?? 0) * 100)}%</td>
                      <td style={{ ...css.td, color: PH.ok }}>{s.activation_score ?? 0}/100</td>
                      <td style={{ ...css.td, color: PH.violet }}>{s.precision_score ?? 0}/100</td>
                      <td style={{ ...css.td, color: PH.coral }}>{s.dosing_score ?? 0}/100</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={css.divider} />

          {/* prosthetist note */}
          <div style={css.noteBox}>
            <div style={css.noteTitle}>📋 Заметка для протезиста / физиотерапевта</div>
            <div style={css.noteBody}>
              Данный отчёт сформирован автоматически приложением <strong>Phantom EMG</strong> на основе{' '}
              <strong>{progress?.total_sessions ?? 0} игровых сессий</strong>. Показатели отражают способность пациента
              управлять мышечным напряжением через биофидбэк-игры.
              {weakSkill && weakSkill.value < 60 && (
                <> <strong>Требует внимания:</strong> навык «{weakSkill.label}» ({Math.round(weakSkill.value)}/100) —
                  рекомендуется усилить тренировки соответствующей игры.</>
              )}
              {' '}Неделя <strong>{progress?.current_week ?? 1}</strong> программы реабилитации.
              Общее время тренировок: <strong>{progress?.total_minutes ?? 0} мин</strong>.
            </div>
          </div>

          {/* footer */}
          <div style={css.pageFooter}>
            <span>Phantom EMG · phantom-emg.app · Сформировано {todayIso}</span>
            <span>Данные хранятся на защищённом сервере · только для медицинского использования</span>
          </div>

        </div>
      </div>

      {/* print styles injected into <head> */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; background: white; }
          #report-page {
            box-shadow: none !important;
            border-radius: 0 !important;
            margin: 0 !important;
            width: 210mm !important;
            max-width: 210mm !important;
            padding: 20mm !important;
          }
        }
        @page { size: A4; margin: 0; }
      `}</style>
    </div>
  );
}

const css = {
  root: {
    width: '100vw', height: '100vh',
    display: 'flex', flexDirection: 'column',
    background: PH.bgSoft, overflow: 'hidden',
  },
  topBar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 24px', background: PH.bgAlt, borderBottom: `1px solid ${PH.hair}`,
    flexShrink: 0,
  },
  backBtn: {
    fontFamily: PH.fontMono, fontSize: 12, color: PH.inkDim,
    background: 'transparent', border: 'none', cursor: 'pointer', letterSpacing: '0.04em',
  },
  printBtn: {
    fontFamily: PH.fontSans, fontSize: 13, fontWeight: 600,
    color: '#fff', background: PH.ink, border: 'none',
    padding: '9px 20px', borderRadius: 10, cursor: 'pointer',
    letterSpacing: '0.01em',
  },
  scroll: { flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', justifyContent: 'center' },
  page: {
    background: '#FFFFFF',
    width: '210mm', maxWidth: '100%',
    minHeight: '297mm',
    padding: '20mm',
    boxShadow: '0 8px 48px rgba(0,0,0,0.14)',
    borderRadius: 4,
    boxSizing: 'border-box',
    fontFamily: PH.fontSans,
    color: PH.ink,
  },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  brand: { fontSize: 26, fontWeight: 700, letterSpacing: '-0.04em', color: PH.ink },
  brandSub: { fontFamily: PH.fontMono, fontSize: 8, color: PH.inkFaint, letterSpacing: '0.12em', marginTop: 3 },
  metaLine: { fontFamily: PH.fontMono, fontSize: 9, color: PH.inkFaint, letterSpacing: '0.06em', marginBottom: 2 },
  divider: { height: 1, background: '#E5E1D6', margin: '14px 0' },
  section: { marginBottom: 4 },
  sectionTitle: {
    fontFamily: PH.fontMono, fontSize: 8, letterSpacing: '0.14em',
    color: PH.inkFaint, textTransform: 'uppercase', marginBottom: 10,
  },
  fieldLabel: { fontFamily: PH.fontMono, fontSize: 8, color: PH.inkFaint, letterSpacing: '0.08em', marginBottom: 3 },
  fieldValue: { fontFamily: PH.fontSans, fontSize: 13, fontWeight: 600, color: PH.ink },
  statBox: {
    flex: 1, background: PH.bg, borderRadius: 6,
    padding: '10px 12px', border: `1px solid ${PH.hair}`,
  },
  statLabel: { fontFamily: PH.fontMono, fontSize: 8, color: PH.inkFaint, letterSpacing: '0.08em', marginBottom: 4 },
  statValue: { fontFamily: PH.fontSans, fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 11 },
  th: {
    fontFamily: PH.fontMono, fontSize: 8, letterSpacing: '0.08em',
    color: PH.inkFaint, textAlign: 'left', padding: '6px 8px',
    borderBottom: `1px solid ${PH.hair}`, textTransform: 'uppercase',
  },
  td: { fontFamily: PH.fontMono, fontSize: 11, color: PH.ink, padding: '6px 8px' },
  noteBox: {
    background: '#F0F8E0', border: `1px solid ${PH.limeBright}44`,
    borderLeft: `3px solid ${PH.limeBright}`,
    padding: '12px 16px', borderRadius: 4, marginTop: 4,
  },
  noteTitle: { fontFamily: PH.fontSans, fontSize: 12, fontWeight: 700, color: PH.ink, marginBottom: 6 },
  noteBody: { fontFamily: PH.fontSans, fontSize: 11, color: '#444', lineHeight: 1.6 },
  pageFooter: {
    display: 'flex', justifyContent: 'space-between',
    fontFamily: PH.fontMono, fontSize: 8, color: PH.inkFaint,
    letterSpacing: '0.06em', marginTop: 24, paddingTop: 12,
    borderTop: `1px solid ${PH.hair}`,
  },
};
