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

export default function DoctorPDFScreen({ navigation }) {
  const { user } = useAuth();
  const [progress, setProgress] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    api.getProgress().then(setProgress).catch(() => {});
    api.getSessions(8).then(setSessions).catch(() => {});
  }, []);

  const today = new Date().toISOString().split('T')[0];

  const skills = progress
    ? [
        { n: 'Активация', v: Math.round(progress.activation_avg), d: progress.activation_delta >= 0 ? `+${progress.activation_delta}` : `${progress.activation_delta}` },
        { n: 'Точность импульса', v: Math.round(progress.precision_avg), d: progress.precision_delta >= 0 ? `+${progress.precision_delta}` : `${progress.precision_delta}` },
        { n: 'Дозирование силы', v: Math.round(progress.dosing_avg), d: progress.dosing_delta >= 0 ? `+${progress.dosing_delta}` : `${progress.dosing_delta}` },
      ]
    : [
        { n: 'Активация', v: 0, d: '0' },
        { n: 'Точность импульса', v: 0, d: '0' },
        { n: 'Дозирование силы', v: 0, d: '0' },
      ];

  const handleShare = async () => {
    setSharing(true);
    try {
      const weakSkill = skills.length ? skills.reduce((a, b) => a.v < b.v ? a : b) : null;

      const skillsHtml = skills.map(sk => `
        <div style="margin-bottom:12px">
          <div style="display:flex;justify-content:space-between;margin-bottom:5px">
            <span style="font-size:12px;color:#333">${sk.n}</span>
            <span style="font-size:12px;font-weight:700;color:#1A1A1F">
              ${sk.v}/100&nbsp;&nbsp;<span style="color:${parseInt(sk.d) >= 0 ? '#7FCB3A' : '#E8553A'}">${parseInt(sk.d) >= 0 ? '+' : ''}${sk.d}</span>
            </span>
          </div>
          <div style="height:6px;background:#E5E1D6;border-radius:3px;overflow:hidden">
            <div style="height:100%;width:${Math.max(sk.v, 2)}%;background:#7FCB3A;border-radius:3px"></div>
          </div>
        </div>
      `).join('');

      const sessionsHtml = sessions.length > 0 ? `
        <div class="label" style="margin-top:16px">ПОСЛЕДНИЕ СЕССИИ</div>
        <table style="width:100%;border-collapse:collapse;font-size:10px;margin-top:6px">
          <thead>
            <tr style="background:#F5F2EC">
              <th style="text-align:left;padding:5px 6px;font-size:8px;color:#888;letter-spacing:0.8px;text-transform:uppercase;border-bottom:1px solid #E5E1D6">Дата</th>
              <th style="text-align:left;padding:5px 6px;font-size:8px;color:#888;letter-spacing:0.8px;text-transform:uppercase;border-bottom:1px solid #E5E1D6">Игра</th>
              <th style="text-align:center;padding:5px 6px;font-size:8px;color:#888;letter-spacing:0.8px;text-transform:uppercase;border-bottom:1px solid #E5E1D6">Счёт</th>
              <th style="text-align:center;padding:5px 6px;font-size:8px;color:#888;letter-spacing:0.8px;text-transform:uppercase;border-bottom:1px solid #E5E1D6">Актив.</th>
              <th style="text-align:center;padding:5px 6px;font-size:8px;color:#888;letter-spacing:0.8px;text-transform:uppercase;border-bottom:1px solid #E5E1D6">Точн.</th>
              <th style="text-align:center;padding:5px 6px;font-size:8px;color:#888;letter-spacing:0.8px;text-transform:uppercase;border-bottom:1px solid #E5E1D6">Доз.</th>
            </tr>
          </thead>
          <tbody>
            ${sessions.map((s, i) => `
              <tr style="background:${i % 2 === 0 ? '#fff' : '#F9F7F2'}">
                <td style="padding:5px 6px;color:#555">${new Date(s.played_at).toLocaleDateString('ru-RU')}</td>
                <td style="padding:5px 6px;color:#1A1A1F">${s.game}</td>
                <td style="padding:5px 6px;text-align:center;font-weight:700;color:#1A1A1F">${s.score}</td>
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
          @page { size: A4; margin: 20mm; }
          body { font-family: -apple-system, Helvetica Neue, sans-serif; color: #1A1A1F; background: #fff; margin: 0; }
          .brand { font-size: 24px; font-weight: 800; letter-spacing: -1px; }
          .dot { color: #7FCB3A; }
          .label { font-size: 8px; color: #888; letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 5px; }
          .divider { border: none; border-top: 1px solid #E5E1D6; margin: 14px 0; }
          .stats { display: flex; gap: 10px; margin-bottom: 14px; }
          .stat-box { flex: 1; background: #F5F2EC; padding: 10px 12px; border-radius: 6px; }
          .stat-val { font-size: 22px; font-weight: 800; margin: 3px 0 2px; color: #1A1A1F; }
          .green { color: #7FCB3A; font-size: 10px; font-weight: 700; }
        </style></head>
        <body>
          <!-- Header -->
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px">
            <div>
              <div class="brand">Phantom<span class="dot">.</span></div>
              <div class="label" style="margin-top:3px">EMG ТРЕНАЖЁР ДЛЯ РЕАБИЛИТАЦИИ · ОТЧЁТ ПАЦИЕНТА</div>
            </div>
            <div style="text-align:right;font-size:9px;color:#888;line-height:1.6">
              Дата: ${today}<br>
              ID пациента: #${user?.id || '—'}<br>
              стр. 1 / 1
            </div>
          </div>
          <hr class="divider">

          <!-- Patient info -->
          <div style="display:flex;gap:32px;margin-bottom:14px">
            <div>
              <div class="label">ФИО / Имя</div>
              <div style="font-size:15px;font-weight:600">${user?.name || '—'}</div>
            </div>
            <div>
              <div class="label">Уровень ампутации</div>
              <div style="font-size:13px;color:#555">${user?.amputation_level || 'Не указан'}</div>
            </div>
            <div>
              <div class="label">Неделя реабилитации</div>
              <div style="font-size:13px;font-weight:600">Неделя ${progress?.current_week ?? 1}</div>
            </div>
            <div>
              <div class="label">Всего тренировок</div>
              <div style="font-size:13px;font-weight:600">${progress?.total_minutes ?? 0} мин</div>
            </div>
          </div>
          <hr class="divider">

          <!-- Stats summary -->
          <div class="label">СВОДКА · 7 ДНЕЙ</div>
          <div class="stats">
            <div class="stat-box">
              <div class="label">Время</div>
              <div class="stat-val">${progress?.week_minutes ?? 0} <span style="font-size:13px;font-weight:400">мин</span></div>
              <div class="green">${progress ? (progress.week_pct_change >= 0 ? '+' : '') + progress.week_pct_change + '%' : '—'} к прошлой неделе</div>
            </div>
            <div class="stat-box">
              <div class="label">Сессий всего</div>
              <div class="stat-val">${progress?.total_sessions ?? 0}</div>
              <div class="green">серия: ${progress?.streak_days ?? 0} дн подряд</div>
            </div>
            <div class="stat-box">
              <div class="label">Лучший навык</div>
              <div class="stat-val" style="font-size:15px;padding-top:4px">${
                skills.length ? skills.reduce((a, b) => a.v > b.v ? a : b).n : '—'
              }</div>
              <div class="green">${skills.length ? Math.max(...skills.map(s => s.v)) : 0}/100</div>
            </div>
          </div>
          <hr class="divider">

          <!-- Skills -->
          <div class="label">EMG НАВЫКИ (среднее за последние 20 сессий)</div>
          <div style="margin-top:8px">${skillsHtml}</div>

          <!-- Sessions table -->
          ${sessionsHtml}
          <hr class="divider">

          <!-- Prosthetist note -->
          <div style="background:#F0F8E0;border-left:3px solid #7FCB3A;padding:12px 14px;border-radius:4px;margin-top:4px">
            <div style="font-size:12px;font-weight:700;margin-bottom:6px">📋 Заметка для протезиста / физиотерапевта</div>
            <div style="font-size:11px;color:#444;line-height:1.6">
              Сформировано автоматически приложением <strong>Phantom EMG</strong> на основе
              <strong>${progress?.total_sessions ?? 0} игровых сессий</strong>.
              Показатели отражают способность пациента управлять мышечным напряжением через биофидбэк-игры.
              ${weakSkill && weakSkill.v < 60 ? `<strong>Требует внимания:</strong> навык «${weakSkill.n}» (${weakSkill.v}/100) — рекомендуется усилить тренировки.` : ''}
              Неделя <strong>${progress?.current_week ?? 1}</strong> программы реабилитации.
            </div>
          </div>

          <!-- Footer -->
          <div style="display:flex;justify-content:space-between;margin-top:20px;padding-top:10px;border-top:1px solid #E5E1D6;font-size:8px;color:#aaa">
            <span>Phantom EMG · Сформировано ${today}</span>
            <span>Данные хранятся на защищённом сервере · только для медицинского использования</span>
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
