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
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    api.getProgress().then(setProgress).catch(() => {});
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
      const skillsHtml = skills.map(sk => `
        <div style="margin-bottom:10px">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px">
            <span style="font-size:12px">${sk.n}</span>
            <span style="font-size:12px;font-weight:700">${sk.v}/100 <span style="color:#A8CC5C">${sk.d}</span></span>
          </div>
          <div style="height:6px;background:#E5E1D6;border-radius:3px;overflow:hidden">
            <div style="height:100%;width:${sk.v}%;background:#A8CC5C;border-radius:3px"></div>
          </div>
        </div>
      `).join('');

      const html = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><style>
          body { font-family: -apple-system, sans-serif; padding: 32px; color: #1A1A1F; background: #fff; }
          .brand { font-size: 22px; font-weight: 800; letter-spacing: -1px; }
          .dot { color: #A8CC5C; }
          .label { font-size: 9px; color: #888; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px; }
          .divider { border: none; border-top: 1px solid #E5E1D6; margin: 16px 0; }
          .stats { display: flex; gap: 12px; margin-bottom: 16px; }
          .stat-box { flex: 1; background: #F5F2EC; padding: 10px; border-radius: 6px; }
          .stat-val { font-size: 20px; font-weight: 800; margin: 4px 0 2px; }
          .green { color: #A8CC5C; }
        </style></head>
        <body>
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px">
            <div>
              <div class="brand">Phantom<span class="dot">.</span></div>
              <div class="label" style="margin-top:4px">ОТЧЁТ ПАЦИЕНТА · ${today}</div>
            </div>
            <div style="text-align:right;font-size:9px;color:#888">
              id #${user?.id || '—'}<br>стр. 1 / 1
            </div>
          </div>
          <hr class="divider">
          <div class="label">Пациент</div>
          <div style="font-size:15px;font-weight:600;margin-bottom:4px">${user?.name || '—'}</div>
          <div style="font-size:11px;color:#555;margin-bottom:16px">${user?.amputation_level || 'Уровень ампутации не указан'}</div>
          <div class="label">СВОДКА · 7 ДНЕЙ</div>
          <div class="stats">
            <div class="stat-box">
              <div class="label">Время</div>
              <div class="stat-val">${progress?.week_minutes ?? 0} мин</div>
              <div class="green" style="font-size:10px;font-weight:700">${progress ? (progress.week_pct_change >= 0 ? '+' : '') + progress.week_pct_change + '%' : '—'}</div>
            </div>
            <div class="stat-box">
              <div class="label">Сессий</div>
              <div class="stat-val">${progress?.total_sessions ?? 0}</div>
              <div class="green" style="font-size:10px;font-weight:700">серия: ${progress?.streak_days ?? 0} дн</div>
            </div>
          </div>
          <div class="label">НАВЫКИ</div>
          ${skillsHtml}
          <hr class="divider">
          <div style="background:#F0F8E0;border-left:3px solid #A8CC5C;padding:10px;margin-top:14px">
            <div style="font-size:11px;font-weight:700;margin-bottom:4px">Заметка для протезиста</div>
            <div style="font-size:11px;color:#444;line-height:1.5">
              Сформировано автоматически приложением Phantom EMG. Данные основаны на ${progress?.total_sessions ?? 0} игровых сессиях. Неделя ${progress?.current_week ?? 1} из ${user?.weeks_to_fitting ?? 16} до примерки протеза.
            </div>
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
