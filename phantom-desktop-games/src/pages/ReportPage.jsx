/**
 * ReportPage.jsx — phantom-desktop-games
 * ─────────────────────────────────────────
 * Official clinical EMG report for prosthetist / physiotherapist.
 * A4 preview → window.print() → PDF.
 */
import React, { useState, useEffect } from 'react';
import { PH } from '../theme';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

/* ─── helpers ─────────────────────────────────────────────────────────────── */
function pct(v) { return Math.max(0, Math.min(100, Math.round(v ?? 0))); }
function sign(v) { return (v ?? 0) >= 0 ? `+${Math.round(v ?? 0)}` : `${Math.round(v ?? 0)}`; }
function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/* clinical interpretation of 0-100 score */
function clinLevel(v) {
  if (v >= 80) return { txt: 'Высокий',       color: '#2A9D5C' };
  if (v >= 55) return { txt: 'Удовлетворит.', color: '#F4A261' };
  return           { txt: 'Требует работы',   color: '#E8553A' };
}

function ClinBar({ label, clinical, value, delta, color, hint }) {
  const p = pct(value);
  const lv = clinLevel(p);
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <div>
          <span style={{ fontFamily: PH.fontSans, fontSize: 12, color: PH.ink, fontWeight: 600 }}>{label}</span>
          {clinical && <span style={{ fontFamily: PH.fontMono, fontSize: 9, color: PH.inkFaint, marginLeft: 6 }}>{clinical}</span>}
        </div>
        <span style={{ fontFamily: PH.fontMono, fontSize: 11, color: PH.ink }}>
          {p}/100&nbsp;&nbsp;
          <span style={{ color: (delta ?? 0) >= 0 ? '#2A9D5C' : '#E8553A', fontWeight: 700 }}>{sign(delta)}</span>
        </span>
      </div>
      <div style={{ height: 5, background: '#EDE9DF', borderRadius: 3, overflow: 'hidden', marginBottom: 3 }}>
        <div style={{ width: `${p}%`, height: '100%', background: color, borderRadius: 3 }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: PH.fontMono, fontSize: 9, color: lv.color, fontWeight: 700 }}>{lv.txt}</span>
        {hint && <span style={{ fontFamily: PH.fontMono, fontSize: 9, color: PH.inkFaint }}>{hint}</span>}
      </div>
    </div>
  );
}

function WeekMiniChart({ data = [] }) {
  const max = Math.max(...data, 1);
  const today = new Date().getDay();
  const days = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];
  const labels = Array.from({ length: 7 }, (_, i) => days[(today - 6 + i + 7) % 7]);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 32 }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div style={{ width: '100%', background: v > 0 ? '#7FCB3A' : '#EDE9DF', borderRadius: 2, height: `${Math.max(2, (v/max)*26)}px` }} />
          <span style={{ fontFamily: 'monospace', fontSize: 7, color: '#9A9AA8' }}>{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── main component ──────────────────────────────────────────────────────── */
export default function ReportPage({ onBack }) {
  const { user } = useAuth();
  const [progress, setProgress] = useState(null);
  const [sessions, setSessions]  = useState([]);
  const [calib,    setCalib]     = useState(null);
  const [loading,  setLoading]   = useState(true);

  const todayFull = new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
  const todayIso  = new Date().toISOString().split('T')[0];

  useEffect(() => {
    Promise.all([
      api.getProgress().catch(() => null),
      api.getSessions(5).catch(() => []),
      api.getCalibration().catch(() => null),
    ]).then(([prog, sess, cal]) => {
      setProgress(prog); setSessions(sess); setCalib(cal);
      setLoading(false);
    });
  }, []);

  /* ── derived clinical values ── */
  const maxEMG   = calib?.max_emg   ?? 1.0;   // from calibration session
  const threshold= calib?.threshold ?? 0.42;  // activation threshold fraction

  // emg_peak is already 0-1 (fraction of calibrated max)
  const avgPeakPct = sessions.length
    ? Math.round(sessions.reduce((s, x) => s + (x.emg_peak ?? 0), 0) / sessions.length * 100)
    : 0;
  const avgAvgPct = sessions.length
    ? Math.round(sessions.reduce((s, x) => s + (x.emg_avg ?? 0), 0) / sessions.length * 100)
    : 0;
  const thresholdPct = Math.round(threshold * 100);

  const indicators = progress ? [
    {
      label: 'Активация ЭМГ',
      clinical: '(Muscle activation level)',
      value: progress.activation_avg,
      delta: progress.activation_delta,
      color: '#7FCB3A',
      hint: `Пик ЭМГ: ${avgPeakPct}% от МПС`,
    },
    {
      label: 'Точность дозирования',
      clinical: '(Force grading precision)',
      value: progress.precision_avg,
      delta: progress.precision_delta,
      color: '#5B4DD9',
      hint: `Сред. амплитуда: ${avgAvgPct}% от МПС`,
    },
    {
      label: 'Стабильность сигнала',
      clinical: '(EMG signal stability)',
      value: progress.dosing_avg,
      delta: progress.dosing_delta,
      color: '#E8553A',
      hint: `Порог: ${thresholdPct}% от МПС`,
    },
  ] : [];

  const weakest = indicators.length
    ? indicators.reduce((a, b) => a.value < b.value ? a : b)
    : null;
  const strongest = indicators.length
    ? indicators.reduce((a, b) => a.value > b.value ? a : b)
    : null;

  const GAME_NAMES = { Sparrow: 'Удержание (Sparrow)', 'Pulse Run': 'Импульс (Pulse Run)', 'Steady Climb': 'Дозирование (Steady Climb)' };

  const Toolbar = () => (
    <div style={css.toolbar} className="no-print">
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button className="btn-ghost" style={css.backBtn} onClick={onBack}>← Назад</button>
        <div style={css.toolbarDivider} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={css.toolbarIcon}>📋</div>
          <div>
            <div style={{ fontFamily: PH.fontSans, fontSize: 13, fontWeight: 700, color: PH.ink, lineHeight: 1 }}>Клинический отчёт ЭМГ</div>
            <div style={{ fontFamily: PH.fontMono, fontSize: 9, color: PH.inkFaint, letterSpacing: '0.08em', marginTop: 2 }}>
              ФОРМА PHM-EMG-01 · ПРЕДПРОСМОТР A4
            </div>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={css.patientBadge}>
          <span style={{ fontSize: 11 }}>👤</span>
          <span>{user?.name ?? '—'}</span>
        </div>
        <button style={css.printBtn} onClick={() => window.print()}>
          📄 Скачать PDF / Напечатать
        </button>
      </div>
    </div>
  );

  if (loading) return (
    <div style={css.root}>
      <Toolbar />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        <div style={css.loadSpinner} />
        <span style={{ fontFamily: PH.fontMono, fontSize: 12, color: PH.inkFaint, letterSpacing: '0.06em' }}>
          Загрузка клинических данных...
        </span>
      </div>
    </div>
  );

  return (
    <div style={css.root} className="page-enter report-root">
      <Toolbar />

      <div style={css.scroll} className="report-scroll">
        <div style={css.page} id="report-page">

          {/* ── PAGE HEADER ── */}
          <div style={css.pageHead}>
            <div>
              <div style={css.brand}>Phantom<span style={{ color: '#7FCB3A' }}>.</span></div>
              <div style={css.brandSub}>СИСТЕМА ЭМГ-РЕАБИЛИТАЦИИ · КЛИНИЧЕСКИЙ ОТЧЁТ</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={css.metaLine}>Дата формирования: {todayFull}</div>
              <div style={css.metaLine}>ID пациента: #{user?.id ?? '—'}</div>
              <div style={css.metaLine}>Форма: PHM-EMG-01</div>
            </div>
          </div>

          <div style={css.rule} />

          {/* ── PATIENT BLOCK ── */}
          <div style={css.sectionLabel}>1. ДАННЫЕ ПАЦИЕНТА</div>
          <div style={css.grid4}>
            <div style={css.field}>
              <div style={css.fieldLbl}>ФИО / Имя</div>
              <div style={css.fieldVal}>{user?.name ?? '—'}</div>
            </div>
            <div style={css.field}>
              <div style={css.fieldLbl}>Email</div>
              <div style={css.fieldVal}>{user?.email ?? '—'}</div>
            </div>
            <div style={css.field}>
              <div style={css.fieldLbl}>Уровень ампутации</div>
              <div style={css.fieldVal}>{user?.amputation_level || 'Не указан'}</div>
            </div>
            <div style={css.field}>
              <div style={css.fieldLbl}>Неделя реабилитации</div>
              <div style={css.fieldVal}>Неделя {progress?.current_week ?? 1}</div>
            </div>
          </div>

          <div style={css.rule} />

          {/* ── CALIBRATION BLOCK ── */}
          <div style={css.sectionLabel}>2. КАЛИБРОВКА ЭМГ ДАТЧИКА</div>
          <div style={css.grid4}>
            <div style={css.statBox}>
              <div style={css.statLbl}>Порог активации</div>
              <div style={css.statVal}>{thresholdPct}<span style={css.statUnit}>% МПС</span></div>
            </div>
            <div style={css.statBox}>
              <div style={css.statLbl}>Макс. амплитуда (МПС)</div>
              <div style={css.statVal}>{Math.round(maxEMG * 1000)}<span style={css.statUnit}>усл. ед.</span></div>
            </div>
            <div style={css.statBox}>
              <div style={css.statLbl}>Средний пик ЭМГ</div>
              <div style={css.statVal}>{avgPeakPct}<span style={css.statUnit}>% МПС</span></div>
            </div>
            <div style={css.statBox}>
              <div style={css.statLbl}>Последняя калибровка</div>
              <div style={{ ...css.statVal, fontSize: 13, paddingTop: 4 }}>
                {calib ? fmtDate(calib.calibrated_at) : 'Нет данных'}
              </div>
            </div>
          </div>
          <div style={{ ...css.infoBox, marginTop: 8, marginBottom: 4 }}>
            <span style={{ fontFamily: PH.fontMono, fontSize: 9, color: PH.inkFaint }}>
              МПС — максимальное произвольное сокращение. Порог активации — минимальный уровень ЭМГ, необходимый для управления протезом.
            </span>
          </div>

          <div style={css.rule} />

          {/* ── TRAINING SUMMARY ── */}
          <div style={css.sectionLabel}>3. СВОДКА ТРЕНИРОВОЧНОГО ПЕРИОДА</div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            {[
              { lbl: 'Сессий всего',       val: progress?.total_sessions ?? 0, unit: '' },
              { lbl: 'Общее время',         val: progress?.total_minutes   ?? 0, unit: ' мин' },
              { lbl: 'За последние 7 дней', val: progress?.week_minutes    ?? 0, unit: ' мин' },
              { lbl: 'Динамика недели',     val: `${(progress?.week_pct_change ?? 0) >= 0 ? '+' : ''}${progress?.week_pct_change ?? 0}%`, unit: '', color: (progress?.week_pct_change ?? 0) >= 0 ? '#2A9D5C' : '#E8553A' },
              { lbl: 'Непрерывная серия',   val: progress?.streak_days ?? 0, unit: ' дн' },
            ].map((s, i) => (
              <div key={i} style={css.statBox}>
                <div style={css.statLbl}>{s.lbl}</div>
                <div style={{ ...css.statVal, color: s.color ?? PH.ink }}>{s.val}{s.unit}</div>
              </div>
            ))}
            <div style={{ ...css.statBox, flex: 2 }}>
              <div style={css.statLbl}>Активность (7 дней)</div>
              <WeekMiniChart data={progress?.daily_minutes ?? []} />
            </div>
          </div>

          <div style={css.rule} />

          {/* ── CLINICAL EMG INDICATORS ── */}
          <div style={css.sectionLabel}>4. КЛИНИЧЕСКИЕ ПОКАЗАТЕЛИ ЭМГ</div>
          <div style={{ marginTop: 8 }}>
            {indicators.length > 0
              ? indicators.map(ind => <ClinBar key={ind.label} {...ind} />)
              : <div style={{ fontFamily: PH.fontMono, fontSize: 11, color: PH.inkFaint }}>Нет данных — необходимо провести тренировочные сессии</div>
            }
          </div>

          <div style={css.rule} />

          {/* ── SESSIONS TABLE ── */}
          {sessions.length > 0 && (<>
            <div style={css.sectionLabel}>5. ЖУРНАЛ ТРЕНИРОВОЧНЫХ СЕССИЙ</div>
            <table style={css.table}>
              <thead>
                <tr style={{ background: '#F5F2EC' }}>
                  {['Дата', 'Упражнение', 'Длит.', 'Пик ЭМГ\n(% МПС)', 'Сред. ЭМГ\n(% МПС)', 'Активация', 'Точность', 'Стабильность'].map(h => (
                    <th key={h} style={css.th}>{h.replace('\\n', '\n')}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sessions.map((s, i) => (
                  <tr key={s.id} style={{ background: i % 2 === 0 ? '#fff' : '#F9F7F2' }}>
                    <td style={css.td}>{fmtDate(s.played_at)}</td>
                    <td style={css.td}>{GAME_NAMES[s.game] ?? s.game}</td>
                    <td style={css.td}>{s.duration_sec}с</td>
                    <td style={{ ...css.td, fontWeight: 700 }}>{Math.round((s.emg_peak ?? 0) * 100)}%</td>
                    <td style={css.td}>{Math.round((s.emg_avg  ?? 0) * 100)}%</td>
                    <td style={{ ...css.td, color: '#2A9D5C' }}>{s.activation_score ?? 0}/100</td>
                    <td style={{ ...css.td, color: '#5B4DD9' }}>{s.precision_score  ?? 0}/100</td>
                    <td style={{ ...css.td, color: '#E8553A' }}>{s.dosing_score     ?? 0}/100</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>)}

          <div style={css.rule} />

          {/* ── CLINICAL ASSESSMENT ── */}
          <div style={css.sectionLabel}>6. КЛИНИЧЕСКОЕ ЗАКЛЮЧЕНИЕ</div>
          <div className="report-assess" style={css.assessBox}>
            <div style={css.assessTitle}>Автоматическое заключение системы Phantom EMG</div>
            <div style={css.assessBody}>
              {progress && indicators.length > 0 ? (<>
                Пациент <strong>{user?.name ?? '—'}</strong> прошёл{' '}
                <strong>{progress.total_sessions}</strong> тренировочных сессий
                ({progress.total_minutes} мин суммарно) на системе ЭМГ-биофидбэка Phantom.{' '}
                Средний пик ЭМГ-сигнала составил <strong>{avgPeakPct}% от МПС</strong> при пороге активации{' '}
                <strong>{thresholdPct}% МПС</strong>.{' '}
                {strongest && <>Наибольший прогресс достигнут в области <strong>{strongest.label.toLowerCase()}</strong>{' '}
                ({pct(strongest.value)}/100, динамика {sign(strongest.delta)}).</>}{' '}
                {weakest && pct(weakest.value) < 60 && (
                  <>Требует дополнительной работы: <strong>{weakest.label.toLowerCase()}</strong>{' '}
                  ({pct(weakest.value)}/100). Рекомендуется увеличить частоту соответствующих упражнений.</>
                )}
                {' '}Неделя <strong>{progress.current_week}</strong> программы предпротезной реабилитации.
              </>) : 'Недостаточно данных для формирования заключения.'}
            </div>
          </div>

          {/* signature block */}
          <div className="report-signatures" style={{ display: 'flex', gap: 40, marginTop: 20 }}>
            {['Протезист / подпись', 'Физиотерапевт / подпись', 'Дата осмотра'].map(lbl => (
              <div key={lbl} style={{ flex: 1 }}>
                <div style={{ borderBottom: '1px solid #CCC', height: 28, marginBottom: 4 }} />
                <div style={{ fontFamily: 'monospace', fontSize: 8, color: '#aaa', letterSpacing: '0.06em' }}>{lbl}</div>
              </div>
            ))}
          </div>

          {/* page footer */}
          <div className="report-footer" style={css.pageFooter}>
            <span>Phantom EMG · Форма PHM-EMG-01 · {todayIso}</span>
            <span>Конфиденциально — только для медицинского персонала</span>
          </div>

        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          html, body { margin: 0 !important; padding: 0 !important; background: white !important; }

          .report-root {
            height: auto !important;
            overflow: visible !important;
            background: white !important;
          }
          .report-scroll {
            height: auto !important;
            overflow: visible !important;
            padding: 0 !important;
            display: block !important;
          }

          #report-page {
            box-shadow: none !important;
            border-radius: 0 !important;
            margin: 0 !important;
            padding: 12mm !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: 0 !important;
            box-sizing: border-box !important;
          }

          .report-signatures, .report-footer, .report-assess {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
        @page { size: A4 portrait; margin: 8mm; }
      `}</style>
    </div>
  );
}

const css = {
  root: { width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: '#EDEAE3', overflow: 'hidden', contain: 'layout' },
  toolbar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 20px 10px 20px',
    background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)',
    borderBottom: `1px solid ${PH.hair}`, flexShrink: 0,
    boxShadow: '0 1px 12px rgba(0,0,0,0.05)',
  },
  toolbarDivider: { width: 1, height: 24, background: PH.hair },
  toolbarIcon: {
    width: 32, height: 32, borderRadius: 9, background: PH.bgSoft,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 16, border: `1px solid ${PH.hair}`,
  },
  patientBadge: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '5px 12px', borderRadius: 999,
    background: PH.bgSoft, border: `1px solid ${PH.hair}`,
    fontFamily: PH.fontMono, fontSize: 11, color: PH.inkDim,
  },
  backBtn: {
    fontFamily: PH.fontSans, fontSize: 13, fontWeight: 500,
    color: PH.inkDim, background: 'transparent', border: 'none', cursor: 'pointer',
    padding: '5px 2px',
  },
  printBtn: {
    fontFamily: PH.fontSans, fontSize: 13, fontWeight: 600, color: '#fff',
    background: PH.ink, border: 'none', padding: '9px 20px', borderRadius: 10, cursor: 'pointer',
    boxShadow: '0 3px 12px rgba(0,0,0,0.18)',
  },
  loadSpinner: {
    width: 24, height: 24, borderRadius: '50%',
    border: `3px solid ${PH.bgSoft}`, borderTopColor: PH.lime,
    animation: 'spin 0.7s linear infinite',
  },
  scroll: { flex: 1, overflowY: 'auto', padding: '32px 28px', display: 'flex', justifyContent: 'center' },
  page: {
    background: '#FFFFFF', width: '210mm', maxWidth: '100%', minHeight: '297mm',
    padding: '14mm', boxShadow: '0 8px 48px rgba(0,0,0,0.14)', borderRadius: 4,
    boxSizing: 'border-box', fontFamily: PH.fontSans, color: PH.ink,
  },
  pageHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  brand: { fontSize: 24, fontWeight: 700, letterSpacing: '-0.04em', color: PH.ink },
  brandSub: { fontFamily: 'monospace', fontSize: 8, color: '#888', letterSpacing: '0.1em', marginTop: 3 },
  metaLine: { fontFamily: 'monospace', fontSize: 8.5, color: '#888', letterSpacing: '0.04em', marginBottom: 2 },
  rule: { height: 1, background: '#E5E1D6', margin: '12px 0' },
  sectionLabel: { fontFamily: 'monospace', fontSize: 8, letterSpacing: '0.14em', color: '#888', textTransform: 'uppercase', marginBottom: 10 },
  grid4: { display: 'flex', gap: 16, marginBottom: 4 },
  field: { flex: 1 },
  fieldLbl: { fontFamily: 'monospace', fontSize: 8, color: '#888', letterSpacing: '0.08em', marginBottom: 3 },
  fieldVal: { fontFamily: PH.fontSans, fontSize: 13, fontWeight: 600, color: PH.ink },
  statBox: { flex: 1, background: '#F5F2EC', borderRadius: 6, padding: '10px 12px', border: '1px solid #E5E1D6' },
  statLbl: { fontFamily: 'monospace', fontSize: 8, color: '#888', letterSpacing: '0.08em', marginBottom: 4 },
  statVal: { fontFamily: PH.fontSans, fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: PH.ink },
  statUnit: { fontSize: 11, fontWeight: 400, marginLeft: 2 },
  infoBox: { background: '#F5F5F5', borderRadius: 4, padding: '6px 10px' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 10 },
  th: { fontFamily: 'monospace', fontSize: 7.5, letterSpacing: '0.05em', color: '#888', textAlign: 'left', padding: '5px 6px', borderBottom: '1px solid #E5E1D6', whiteSpace: 'pre-line' },
  td: { fontFamily: 'monospace', fontSize: 10, color: PH.ink, padding: '5px 6px' },
  assessBox: { background: '#F0F8E0', border: '1px solid #C5E08A', borderLeft: '3px solid #7FCB3A', padding: '12px 16px', borderRadius: 4 },
  assessTitle: { fontFamily: PH.fontSans, fontSize: 11, fontWeight: 700, color: PH.ink, marginBottom: 6 },
  assessBody: { fontFamily: PH.fontSans, fontSize: 11, color: '#333', lineHeight: 1.65 },
  pageFooter: {
    display: 'flex', justifyContent: 'space-between', marginTop: 20, paddingTop: 10,
    borderTop: '1px solid #E5E1D6', fontFamily: 'monospace', fontSize: 7.5, color: '#aaa', letterSpacing: '0.04em',
  },
};
