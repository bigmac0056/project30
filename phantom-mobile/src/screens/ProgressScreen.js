import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { PH, FONTS } from '../constants/theme';
import Card from '../components/Card';
import Pill from '../components/Pill';
import EMGWave from '../components/EMGWave';
import { PrimaryBtn } from '../components/Buttons';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const DAY_LETTERS = ['П', 'В', 'С', 'Ч', 'П', 'С', 'В'];

export default function ProgressScreen({ navigation }) {
  const { user } = useAuth();
  const [progress, setProgress] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.getProgress();
      setProgress(data);
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const skills = progress
    ? [
        { name: 'Активация', value: Math.round(progress.activation_avg), color: PH.lime, delta: (progress.activation_delta >= 0 ? '+' : '') + progress.activation_delta },
        { name: 'Точность импульса', value: Math.round(progress.precision_avg), color: PH.violet, delta: (progress.precision_delta >= 0 ? '+' : '') + progress.precision_delta },
        { name: 'Дозирование силы', value: Math.round(progress.dosing_avg), color: PH.coral, delta: (progress.dosing_delta >= 0 ? '+' : '') + progress.dosing_delta },
      ]
    : [
        { name: 'Активация', value: 0, color: PH.lime, delta: '—' },
        { name: 'Точность импульса', value: 0, color: PH.violet, delta: '—' },
        { name: 'Дозирование силы', value: 0, color: PH.coral, delta: '—' },
      ];

  const dailyMins = progress?.daily_minutes ?? [0, 0, 0, 0, 0, 0, 0];
  const maxMins = Math.max(...dailyMins, 1);
  const weekPct = progress?.week_pct_change ?? 0;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PH.lime} />}
      >
        <Text style={s.title}>Прогресс</Text>
        <Text style={s.subtitle}>
          Неделя {progress?.current_week ?? 1} из {user?.weeks_to_fitting ?? 16} до примерки протеза.
        </Text>

        {/* Weekly bar chart */}
        <Card raised style={s.weekCard}>
          <View style={s.weekHeader}>
            <View>
              <Text style={s.weekLbl}>ЭТА НЕДЕЛЯ</Text>
              <Text style={s.weekVal}>{progress?.week_minutes ?? 0}<Text style={s.weekUnit}> мин</Text></Text>
            </View>
            {weekPct !== 0 && <Pill>{weekPct > 0 ? '+' : ''}{weekPct}%</Pill>}
          </View>
          <View style={s.barsWrap}>
            {dailyMins.map((mins, i) => {
              const isToday = i === dailyMins.length - 1;
              return (
                <View key={i} style={s.barCol}>
                  <View style={s.barBg}>
                    <View style={[s.barFill, {
                      height: `${Math.max((mins / maxMins) * 100, mins > 0 ? 6 : 2)}%`,
                      backgroundColor: isToday ? PH.lime : mins > 0 ? `${PH.lime}66` : PH.bgSoft,
                    }]} />
                  </View>
                  <Text style={[s.dayLbl, isToday && s.dayLblActive]}>{DAY_LETTERS[i]}</Text>
                </View>
              );
            })}
          </View>
        </Card>

        {/* EMG signal card */}
        <Card style={s.signalCard}>
          <Text style={s.cardLbl}>СИГНАЛ EMG — НЕДЕЛЯ</Text>
          <EMGWave width={280} height={48} intensity={0.75} density={0.9} />
        </Card>

        {/* Skills */}
        <Text style={s.skillsTitle}>Навыки</Text>
        <View style={s.skillsList}>
          {skills.map((sk) => (
            <Card key={sk.name} padded={false} style={s.skillCard}>
              <View style={s.skillHeader}>
                <Text style={s.skillName}>{sk.name}</Text>
                <Text style={s.skillVal}>
                  <Text style={{ color: sk.color }}>{sk.value}</Text>
                  <Text style={s.skillTotal}>/100  </Text>
                  <Text style={{ color: PH.lime }}>{sk.delta}</Text>
                </Text>
              </View>
              <View style={s.skillBarBg}>
                <View style={[s.skillBarFill, { width: `${Math.max(sk.value, 2)}%`, backgroundColor: sk.color }]} />
              </View>
            </Card>
          ))}
        </View>

        {/* Totals */}
        {progress && (
          <Card padded={false} style={[s.skillCard, { marginTop: 10, padding: 14 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={s.weekLbl}>СЕССИЙ</Text>
                <Text style={[s.weekVal, { fontSize: 22 }]}>{progress.total_sessions}</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={s.weekLbl}>СЕРИЯ</Text>
                <Text style={[s.weekVal, { fontSize: 22 }]}>{progress.streak_days} <Text style={s.weekUnit}>дн</Text></Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={s.weekLbl}>ВРЕМЯ</Text>
                <Text style={[s.weekVal, { fontSize: 22 }]}>{progress.total_minutes} <Text style={s.weekUnit}>мин</Text></Text>
              </View>
            </View>
          </Card>
        )}

        <View style={{ marginTop: 18 }}>
          <PrimaryBtn full onPress={() => navigation.navigate('DoctorPDF')}>
            📄 Сгенерировать отчёт для протезиста
          </PrimaryBtn>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PH.bg },
  content: { paddingHorizontal: 20, paddingBottom: 32 },
  title: { fontFamily: FONTS.sansBold, fontSize: 30, letterSpacing: -1, color: PH.ink, marginTop: 4 },
  subtitle: { fontFamily: FONTS.sans, fontSize: 14, color: PH.inkDim, marginBottom: 16, marginTop: 4 },
  weekCard: { marginBottom: 14 },
  weekHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 },
  weekLbl: { fontFamily: FONTS.mono, fontSize: 10, color: PH.inkFaint, letterSpacing: 1 },
  weekVal: { fontFamily: FONTS.sansBold, fontSize: 26, color: PH.ink, marginTop: 2 },
  weekUnit: { fontFamily: FONTS.sans, fontSize: 14, color: PH.inkDim, fontWeight: '400' },
  barsWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 90 },
  barCol: { flex: 1, alignItems: 'center', gap: 6, height: '100%' },
  barBg: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  barFill: { width: '100%', borderRadius: 4 },
  dayLbl: { fontFamily: FONTS.mono, fontSize: 10, color: PH.inkFaint },
  dayLblActive: { color: PH.lime, fontWeight: '600' },
  signalCard: { marginBottom: 14 },
  cardLbl: { fontFamily: FONTS.mono, fontSize: 10, color: PH.inkFaint, letterSpacing: 1, marginBottom: 8 },
  skillsTitle: { fontFamily: FONTS.sansSemiBold, fontSize: 16, color: PH.ink, marginBottom: 10, marginTop: 6 },
  skillsList: { gap: 10 },
  skillCard: { padding: 14 },
  skillHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 },
  skillName: { fontFamily: FONTS.sansMedium, fontSize: 14, color: PH.ink },
  skillVal: { fontFamily: FONTS.mono, fontSize: 12, fontVariant: ['tabular-nums'] },
  skillTotal: { color: PH.inkFaint, fontWeight: '400' },
  skillBarBg: { height: 6, borderRadius: 3, backgroundColor: PH.bgSoft, overflow: 'hidden' },
  skillBarFill: { height: '100%', borderRadius: 3 },
});
