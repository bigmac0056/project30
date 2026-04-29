import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { PH, FONTS } from '../constants/theme';
import EMGWave from '../components/EMGWave';
import { PrimaryBtn, IconBtn } from '../components/Buttons';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const GAME_NAMES = { Sparrow: 'Удержание мышц', 'Pulse Run': 'Точность импульса', 'Steady Climb': 'Дозирование усилия' };

function clinLabel(v) {
  if (v >= 80) return 'Высокий';
  if (v >= 55) return 'Удовлетв.';
  return 'Требует работы';
}

export default function DoctorPDFScreen({ navigation }) {
  const { user } = useAuth();
  const [progress, setProgress] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [calib,    setCalib]    = useState(null);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    api.getProgress().then(setProgress).catch(() => {});
    api.getSessions(8).then(setSessions).catch(() => {});
    api.getCalibration().then(setCalib).catch(() => {});
  }, []);

  const today = new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
  const todayIso = new Date().toISOString().split('T')[0];

  const thresholdPct = Math.round((calib?.threshold ?? 0.42) * 100);
  const avgPeakPct   = sessions.length
    ? Math.round(sessions.reduce((s, x) => s + (x.emg_peak ?? 0), 0) / sessions.length * 100)
    : 0;
  const avgAvgPct    = sessions.length
    ? Math.round(sessions.reduce((s, x) => s + (x.emg_avg ?? 0), 0) / sessions.length * 100)
    : 0;

  const indicators = progress ? [
    { n: 'Активация ЭМГ',         clinical: 'Muscle activation level',   v: Math.round(progress.activation_avg), d: Math.round(progress.activation_delta), color: '#7FCB3A' },
    { n: 'Точность дозирования',  clinical: 'Force grading precision',    v: Math.round(progress.precision_avg),  d: Math.round(progress.precision_delta),  color: '#5B4DD9' },
    { n: 'Стабильность сигнала',  clinical: 'EMG signal stability',       v: Math.round(progress.dosing_avg),     d: Math.round(progress.dosing_delta),     color: '#E8553A' },
  ] : [];

  // keep old skills alias for the preview UI below
  const skills = indicators.length ? indicators.map(i => ({ n: i.n, v: i.v, d: (i.d >= 0 ? `+${i.d}` : `${i.d}`) }))
    : [{ n: 'Активация ЭМГ', v: 0, d: '0' }, { n: 'Точность дозирования', v: 0, d: '0' }, { n: 'Стабильность сигнала', v: 0, d: '0' }];

  const handleShare = async () => {
    setSharing(true);
    try {
      const weakInd  = indicators.length ? indicators.reduce((a, b) => a.v < b.v ? a : b) : null;
      const strongInd= indicators.length ? indicators.reduce((a, b) => a.v > b.v ? a : b) : null;

      const indicatorsHtml = indicators.map(ind => `
        <div style="margin-bottom:13px">
          <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px">
            <div>
              <span style="font-size:12px;font-weight:600;color:#1A1A1F">${ind.n}</span>
              <span style="font-size:9px;color:#aaa;margin-left:6px">${ind.clinical}</span>
            </div>
            <span style="font-size:11px;font-weight:700;color:#1A1A1F">
              ${ind.v}/100&nbsp;<span style="color:${ind.d >= 0 ? '#2A9D5C' : '#E8553A'}">${ind.d >= 0 ? '+' : ''}${ind.d}</span>
            </span>
          </div>
          <div style="height:5px;background:#E5E1D6;border-radius:3px;overflow:hidden;margin-bottom:3px">
            <div style="height:100%;width:${Math.max(ind.v, 2)}%;background:${ind.color};border-radius:3px"></div>
          </div>
          <div style="font-size:9px;font-weight:700;color:${ind.v >= 80 ? '#2A9D5C' : ind.v >= 55 ? '#F4A261' : '#E8553A'}">${clinLabel(ind.v)}</div>
        </div>
      `).join('');

      const sessionsHtml = sessions.length > 0 ? `
        <div class="label" style="margin-top:4px">5. ЖУРНАЛ ТРЕНИРОВОЧНЫХ СЕССИЙ</div>
        <table style="width:100%;border-collapse:collapse;font-size:9px;margin-top:6px">
          <thead>
            <tr style="background:#F5F2EC">
              <th style="text-align:left;padding:5px 6px;font-size:7px;color:#888;letter-spacing:0.8px;text-transform:uppercase;border-bottom:1px solid #E5E1D6">Дата</th>
              <th style="text-align:left;padding:5px 6px;font-size:7px;color:#888;letter-spacing:0.8px;text-transform:uppercase;border-bottom:1px solid #E5E1D6">Упражнение</th>
              <th style="text-align:center;padding:5px 6px;font-size:7px;color:#888;letter-spacing:0.8px;text-transform:uppercase;border-bottom:1px solid #E5E1D6">Длит.</th>
              <th style="text-align:center;padding:5px 6px;font-size:7px;color:#888;letter-spacing:0.8px;text-transform:uppercase;border-bottom:1px solid #E5E1D6">Пик ЭМГ</th>
              <th style="text-align:center;padding:5px 6px;font-size:7px;color:#888;letter-spacing:0.8px;text-transform:uppercase;border-bottom:1px solid #E5E1D6">Актив.</th>
              <th style="text-align:center;padding:5px 6px;font-size:7px;color:#888;letter-spacing:0.8px;text-transform:uppercase;border-bottom:1px solid #E5E1D6">Точн.</th>
              <th style="text-align:center;padding:5px 6px;font-size:7px;color:#888;letter-spacing:0.8px;text-transform:uppercase;border-bottom:1px solid #E5E1D6">Стаб.</th>
            </tr>
          </thead>
          <tbody>
            ${sessions.map((s, i) => `
              <tr style="background:${i % 2 === 0 ? '#fff' : '#F9F7F2'}">
                <td style="padding:5px 6px;color:#555">${new Date(s.played_at).toLocaleDateString('ru-RU')}</td>
                <td style="padding:5px 6px;color:#1A1A1F">${GAME_NAMES[s.game] ?? s.game}</td>
                <td style="padding:5px 6px;text-align:center;color:#555">${s.duration_sec}с</td>
                <td style="padding:5px 6px;text-align:center;font-weight:700;color:#1A1A1F">${Math.round((s.emg_peak ?? 0)*100)}%</td>
                <td style="padding:5px 6px;text-align:center;color:#2A9D5C">${s.activation_score ?? 0}</td>
                <td style="padding:5px 6px;text-align:center;color:#5B4DD9">${s.precision_score ?? 0}</td>
                <td style="padding:5px 6px;text-align:center;color:#E8553A">${s.dosing_score ?? 0}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : '';

      const html = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><style>
          @page { size: A4; margin: 18mm; }
          body { font-family: -apple-system, Helvetica Neue, sans-serif; color: #1A1A1F; background: #fff; margin: 0; font-size: 12px; }
          .brand { font-size: 22px; font-weight: 800; letter-spacing: -1px; }
          .dot { color: #7FCB3A; }
          .label { font-size: 7.5px; color: #888; letter-spacing: 1.3px; text-transform: uppercase; margin-bottom: 8px; margin-top: 0; }
          .divider { border: none; border-top: 1px solid #E5E1D6; margin: 12px 0; }
          .stats { display: flex; gap: 8px; margin-bottom: 12px; }
          .stat-box { flex: 1; background: #F5F2EC; padding: 9px 11px; border-radius: 5px; border: 1px solid #E5E1D6; }
          .stat-val { font-size: 19px; font-weight: 800; margin: 2px 0; color: #1A1A1F; }
          .green { color: #7FCB3A; font-size: 9px; font-weight: 700; }
          .field-label { font-size: 7.5px; color: #888; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 2px; }
          .field-val { font-size: 13px; font-weight: 600; color: #1A1A1F; }
        </style></head>
        <body>
          <!-- 1. Header -->
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
            <div>
              <div class="brand">Phantom<span class="dot">.</span></div>
              <div class="label" style="margin-top:3px">СИСТЕМА ЭМГ-РЕАБИЛИТАЦИИ · КЛИНИЧЕСКИЙ ОТЧЁТ · ФОРМА PHM-EMG-01</div>
            </div>
            <div style="text-align:right;font-size:8px;color:#888;line-height:1.7">
              Дата формирования: ${today}<br>
              ID пациента: #${user?.id || '—'}<br>
              стр. 1 / 1
            </div>
          </div>
          <hr class="divider">

          <!-- 2. Patient -->
          <div class="label">1. Данные пациента</div>
          <div style="display:flex;gap:24px;margin-bottom:12px">
            <div><div class="field-label">ФИО / Имя</div><div class="field-val">${user?.name || '—'}</div></div>
            <div><div class="field-label">Уровень ампутации</div><div class="field-val">${user?.amputation_level || 'Не указан'}</div></div>
            <div><div class="field-label">Неделя реабилитации</div><div class="field-val">Неделя ${progress?.current_week ?? 1}</div></div>
            <div><div class="field-label">Общее время тренировок</div><div class="field-val">${progress?.total_minutes ?? 0} мин</div></div>
          </div>
          <hr class="divider">

          <!-- 3. Calibration -->
          <div class="label">2. Параметры калибровки ЭМГ</div>
          <div class="stats">
            <div class="stat-box">
              <div class="field-label">Порог активации</div>
              <div class="stat-val">${thresholdPct}<span style="font-size:12px;font-weight:400">% МПС</span></div>
              <div class="green">от максимального произвольного сокращения</div>
            </div>
            <div class="stat-box">
              <div class="field-label">Средний пик ЭМГ</div>
              <div class="stat-val">${avgPeakPct}<span style="font-size:12px;font-weight:400">% МПС</span></div>
              <div class="green">за все сессии</div>
            </div>
            <div class="stat-box">
              <div class="field-label">Средняя амплитуда</div>
              <div class="stat-val">${avgAvgPct}<span style="font-size:12px;font-weight:400">% МПС</span></div>
              <div class="green">средний уровень активности</div>
            </div>
            <div class="stat-box">
              <div class="field-label">Последняя калибровка</div>
              <div style="font-size:13px;font-weight:600;margin-top:2px">${calib ? new Date(calib.calibrated_at).toLocaleDateString('ru-RU') : 'Нет данных'}</div>
            </div>
          </div>
          <div style="background:#F5F5F5;padding:6px 10px;border-radius:4px;font-size:8px;color:#888;margin-bottom:4px">
            МПС — максимальное произвольное сокращение. Порог активации — минимальный уровень ЭМГ-сигнала для управления протезом.
          </div>
          <hr class="divider">

          <!-- 4. Training summary -->
          <div class="label">3. Тренировочный период</div>
          <div class="stats">
            <div class="stat-box">
              <div class="field-label">Сессий всего</div>
              <div class="stat-val">${progress?.total_sessions ?? 0}</div>
            </div>
            <div class="stat-box">
              <div class="field-label">Время за неделю</div>
              <div class="stat-val">${progress?.week_minutes ?? 0}<span style="font-size:12px;font-weight:400"> мин</span></div>
              <div class="green">${progress ? (progress.week_pct_change >= 0 ? '+' : '') + progress.week_pct_change + '%' : '—'} к прошлой неделе</div>
            </div>
            <div class="stat-box">
              <div class="field-label">Серия подряд</div>
              <div class="stat-val">${progress?.streak_days ?? 0}<span style="font-size:12px;font-weight:400"> дн</span></div>
            </div>
          </div>
          <hr class="divider">

          <!-- 5. EMG clinical indicators -->
          <div class="label">4. Клинические показатели ЭМГ (среднее за 20 сессий)</div>
          <div style="margin-top:8px">${indicatorsHtml}</div>
          <hr class="divider">

          <!-- 6. Sessions -->
          ${sessionsHtml}
          ${sessions.length > 0 ? '<hr class="divider">' : ''}

          <!-- 7. Clinical note -->
          <div class="label">${sessions.length > 0 ? '6' : '5'}. Клиническое заключение</div>
          <div style="background:#F0F8E0;border-left:3px solid #7FCB3A;padding:11px 13px;border-radius:4px">
            <div style="font-size:11px;font-weight:700;margin-bottom:5px">Автоматическое заключение системы Phantom EMG</div>
            <div style="font-size:10.5px;color:#333;line-height:1.65">
              Пациент <strong>${user?.name || '—'}</strong> прошёл <strong>${progress?.total_sessions ?? 0}</strong>
              тренировочных сессий (${progress?.total_minutes ?? 0} мин суммарно).
              Средний пик ЭМГ-сигнала составил <strong>${avgPeakPct}% от МПС</strong> при пороге активации <strong>${thresholdPct}% МПС</strong>.
              ${strongInd ? `Наибольший прогресс: <strong>${strongInd.n.toLowerCase()}</strong> (${strongInd.v}/100, ${strongInd.d >= 0 ? '+' : ''}${strongInd.d}).` : ''}
              ${weakInd && weakInd.v < 60 ? `<strong>Требует внимания:</strong> ${weakInd.n.toLowerCase()} (${weakInd.v}/100) — рекомендуется увеличить частоту тренировок.` : ''}
              Неделя <strong>${progress?.current_week ?? 1}</strong> предпротезной реабилитации.
            </div>
          </div>

          <!-- Signature -->
          <div style="display:flex;gap:30px;margin-top:18px">
            ${['Протезист / подпись', 'Физиотерапевт / подпись', 'Дата осмотра'].map(lbl =>
              `<div style="flex:1"><div style="border-bottom:1px solid #ccc;height:24px;margin-bottom:4px"></div>
              <div style="font-size:7.5px;color:#aaa;letter-spacing:0.5px">${lbl}</div></div>`
            ).join('')}
          </div>

          <!-- Footer -->
          <div style="display:flex;justify-content:space-between;margin-top:16px;padding-top:9px;border-top:1px solid #E5E1D6;font-size:7.5px;color:#aaa">
            <span>Phantom EMG · Форма PHM-EMG-01 · ${todayIso}</span>
            <span>Конфиденциально — только для медицинского персонала</span>
          </div>
        </body></html>
      `;

      const { uri } = await Print.printToFileAsync({ html, base64: false });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Отчёт для протезиста' });
      } else {
        Alert.alert('PDF сохранён', uri);
      }
    } catch (e) {
      Alert.alert('Ошибка', e.message);
    } finally {
      setSharing(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.nav}>
        <IconBtn onPress={() => navigation.goBack()}>
          <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <Path d="M14 6l-6 6 6 6" stroke={PH.ink} strokeWidth="2.4" strokeLinecap="round" />
          </Svg>
        </IconBtn>
        <Text style={s.navTitle}>Отчёт</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.sheet}>
          <View style={s.sheetHeader}>
            <View>
              <Text style={s.sheetBrand}>
                Phantom<Text style={{ color: PH.lime }}>.</Text>
              </Text>
              <Text style={s.sheetDate}>ОТЧЁТ ПАЦИЕНТА · {today}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={s.sheetId}>id #{user?.id || '—'}</Text>
              <Text style={s.sheetId}>стр. 1 / 1</Text>
            </View>
          </View>

          <View style={s.divider} />

          <Text style={s.sectionLbl}>Пациент</Text>
          <Text style={s.patientName}>{user?.name || '—'}</Text>
          <Text style={s.patientNote}>{user?.amputation_level || 'Уровень ампутации не указан'}</Text>

          <Text style={[s.sectionLbl, { marginTop: 14 }]}>СВОДКА · 7 ДНЕЙ</Text>
          <View style={s.statsGrid}>
            <View style={s.statBox}>
              <Text style={s.statBoxLbl}>Время</Text>
              <Text style={s.statBoxVal}>{progress?.week_minutes ?? '—'} мин</Text>
              {progress && (
                <Text style={[s.statBoxDelta, { color: PH.lime }]}>
                  {progress.week_pct_change >= 0 ? '+' : ''}{progress.week_pct_change}%
                </Text>
              )}
            </View>
            <View style={s.statBox}>
              <Text style={s.statBoxLbl}>Сессий</Text>
              <Text style={s.statBoxVal}>{progress?.total_sessions ?? '—'}</Text>
              <Text style={[s.statBoxDelta, { color: PH.lime }]}>
                серия: {progress?.streak_days ?? 0} дн
              </Text>
            </View>
          </View>

          <View style={s.emgBox}>
            <Text style={s.sectionLbl}>ПИК АМПЛИТУДЫ EMG</Text>
            <EMGWave width={240} height={40} color={PH.lime} intensity={0.85} glow={false} />
          </View>

          <Text style={[s.sectionLbl, { marginTop: 14 }]}>НАВЫКИ</Text>
          {skills.map(sk => (
            <View key={sk.n} style={s.skillRow}>
              <View style={s.skillMeta}>
                <Text style={s.skillName}>{sk.n}</Text>
                <Text style={s.skillScore}>
                  {sk.v}/100{'  '}
                  <Text style={{ color: PH.lime, fontWeight: '700' }}>{sk.d}</Text>
                </Text>
              </View>
              <View style={s.skillBar}>
                <View style={[s.skillFill, { width: `${Math.max(sk.v, 2)}%` }]} />
              </View>
            </View>
          ))}

          <View style={s.note}>
            <Text style={s.noteTitleTxt}>Неделя {progress?.current_week ?? 1} из {user?.weeks_to_fitting ?? 16}</Text>
            <Text style={s.noteTxt}>
              Сформировано автоматически. Всего сессий: {progress?.total_sessions ?? 0}.
              {skills[2]?.v < 50 ? ' Дозирование силы требует внимания — рекомендуется Steady Climb.' : ''}
            </Text>
          </View>
        </View>

        <View style={{ marginTop: 14 }}>
          <PrimaryBtn full onPress={handleShare} disabled={sharing}>
            {sharing ? <ActivityIndicator color="#FFF" /> : '📄 Поделиться PDF'}
          </PrimaryBtn>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PH.bg },
  nav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10,
  },
  navTitle: { fontFamily: FONTS.sansSemiBold, fontSize: 15, color: PH.ink },
  content: { paddingHorizontal: 20, paddingBottom: 32 },
  sheet: {
    backgroundColor: '#FFF', borderRadius: 6, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 15, elevation: 6,
  },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  sheetBrand: { fontFamily: FONTS.sansBold, fontSize: 20, letterSpacing: -0.5, color: '#1A1A1F' },
  sheetDate: { fontFamily: FONTS.mono, fontSize: 9, color: '#666', marginTop: 2, letterSpacing: 0.6 },
  sheetId: { fontFamily: FONTS.mono, fontSize: 9, color: '#888' },
  divider: { height: 1, backgroundColor: '#E5E1D6', marginBottom: 12 },
  sectionLbl: { fontFamily: FONTS.mono, fontSize: 9, color: '#666', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  patientName: { fontFamily: FONTS.sansSemiBold, fontSize: 14, color: '#1A1A1F', marginBottom: 4 },
  patientNote: { fontFamily: FONTS.sans, fontSize: 11, color: '#666', lineHeight: 16 },
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statBox: { flex: 1, backgroundColor: PH.bgSoft, padding: 10, borderRadius: 4 },
  statBoxLbl: { fontFamily: FONTS.mono, fontSize: 9, color: '#666', textTransform: 'uppercase', letterSpacing: 0.8 },
  statBoxVal: { fontFamily: FONTS.sansBold, fontSize: 18, color: '#1A1A1F', marginTop: 2 },
  statBoxDelta: { fontFamily: FONTS.mono, fontSize: 9, fontWeight: '700' },
  emgBox: { backgroundColor: PH.bgSoft, padding: 10, borderRadius: 4 },
  skillRow: { marginBottom: 8 },
  skillMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  skillName: { fontFamily: FONTS.sans, fontSize: 11, color: '#1A1A1F' },
  skillScore: { fontFamily: FONTS.mono, fontSize: 11, color: '#666', fontVariant: ['tabular-nums'] },
  skillBar: { height: 4, backgroundColor: '#E5E1D6', borderRadius: 2, overflow: 'hidden' },
  skillFill: { height: '100%', backgroundColor: PH.lime, borderRadius: 2 },
  note: {
    marginTop: 14, padding: 10,
    backgroundColor: PH.limeSoft,
    borderLeftWidth: 3, borderLeftColor: PH.lime,
  },
  noteTitleTxt: { fontFamily: FONTS.sansSemiBold, fontSize: 11, color: '#1A1A1F', marginBottom: 4 },
  noteTxt: { fontFamily: FONTS.sans, fontSize: 11, color: '#444', lineHeight: 17 },
});
