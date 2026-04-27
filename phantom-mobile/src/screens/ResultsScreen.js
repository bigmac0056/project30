import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { PH, FONTS } from '../constants/theme';
import Card from '../components/Card';
import Pill from '../components/Pill';
import EMGWave from '../components/EMGWave';
import { PrimaryBtn, GhostBtn, IconBtn } from '../components/Buttons';
import { api } from '../services/api';

// Map game name to its stack route name
const GAME_ROUTES = {
  'Sparrow': 'GameSparrow',
  'Pulse Run': 'GamePulseRun',
  'Steady Climb': 'GameSteadyClimb',
};

export default function ResultsScreen({ navigation, route }) {
  const {
    score = 0,
    game = 'Sparrow',
    durationSec = 60,
    emgPeak = 0,
    emgAvg = 0,
  } = route?.params || {};

  const saved = useRef(false);

  useEffect(() => {
    if (saved.current) return;
    saved.current = true;

    const activationScore = Math.min(100, Math.round(emgPeak * 100));
    const precisionScore = Math.min(100, Math.round(score / 10));
    const dosingScore = Math.min(100, Math.round(emgAvg * 100));

    api.createSession({
      game,
      score,
      duration_sec: durationSec,
      emg_peak: emgPeak,
      emg_avg: emgAvg,
      activation_score: activationScore,
      precision_score: precisionScore,
      dosing_score: dosingScore,
    }).catch(() => {});
  }, []);

  const accuracy = emgPeak > 0 ? Math.round(Math.min(emgPeak * 100, 99)) : '—';
  const mins = Math.floor(durationSec / 60);
  const secs = durationSec % 60;
  const durationFmt = durationSec > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : '—';

  const gameRoute = GAME_ROUTES[game] ?? 'GameSparrow';

  const handleRetry = () => {
    // Replace Results with the game so back doesn't loop
    navigation.replace(gameRoute);
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Close → Home */}
        <View style={s.closeRow}>
          <IconBtn onPress={() => navigation.navigate('Main')}>
            <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <Path d="M6 6l12 12M6 18L18 6" stroke={PH.ink} strokeWidth="2.4" strokeLinecap="round" />
            </Svg>
          </IconBtn>
        </View>

        {/* Score hero */}
        <View style={s.hero}>
          <Pill filled color={PH.lime} style={s.badge}>СЕССИЯ СОХРАНЕНА</Pill>
          <Text style={s.scoreNum}>{Number(score).toLocaleString()}</Text>
          <Text style={s.gameLbl}>{game.toUpperCase()} · ОЧКИ</Text>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          <Card padded={false} style={s.statCard}>
            <Text style={s.statLbl}>ВРЕМЯ</Text>
            <Text style={s.statVal}>{durationFmt}</Text>
          </Card>
          <Card padded={false} style={s.statCard}>
            <Text style={s.statLbl}>ПИКОВЫЙ EMG</Text>
            <Text style={s.statVal}>
              {accuracy}<Text style={s.statUnit}>{emgPeak > 0 ? '%' : ''}</Text>
            </Text>
          </Card>
        </View>

        {/* EMG chart */}
        <Card style={s.waveCard}>
          <Text style={s.waveLbl}>ПИКИ СИГНАЛА</Text>
          <EMGWave width={280} height={70} intensity={emgPeak || 0.7} density={1.2} />
          <View style={s.waveFooter}>
            <Text style={s.waveTime}>0:00</Text>
            <Text style={s.waveTime}>{durationFmt}</Text>
          </View>
        </Card>

        {/* Achievement */}
        <Card style={[s.achieveCard, { backgroundColor: PH.violetSoft, borderColor: 'transparent' }]}>
          <View style={s.achieveRow}>
            <Text style={s.achieveStar}>★</Text>
            <View style={s.achieveText}>
              <Text style={s.achieveTitle}>Прогресс записан</Text>
              <Text style={s.achieveSub}>
                Каждая сессия улучшает навык. Управление мышцами — то, что нужно для работы с протезом.
              </Text>
            </View>
          </View>
        </Card>

        {/* Actions */}
        <View style={s.actions}>
          <GhostBtn onPress={handleRetry} full>
            Сыграть ещё раз
          </GhostBtn>
          <PrimaryBtn onPress={() => navigation.navigate('Main')} full>
            На главную →
          </PrimaryBtn>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PH.bg },
  content: { paddingHorizontal: 20, paddingBottom: 32 },
  closeRow: { alignItems: 'flex-end', marginTop: 8 },
  hero: { alignItems: 'center', paddingVertical: 22 },
  badge: { marginBottom: 14 },
  scoreNum: { fontFamily: FONTS.sansBold, fontSize: 64, color: PH.lime, letterSpacing: -3, lineHeight: 66 },
  gameLbl: { fontFamily: FONTS.mono, fontSize: 11, color: PH.inkFaint, letterSpacing: 1, marginTop: 6 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard: { flex: 1, padding: 14 },
  statLbl: { fontFamily: FONTS.mono, fontSize: 10, color: PH.inkFaint, letterSpacing: 1 },
  statVal: { fontFamily: FONTS.sansBold, fontSize: 26, color: PH.ink, marginTop: 4 },
  statUnit: { fontSize: 14, color: PH.inkDim },
  waveCard: { marginBottom: 14 },
  waveLbl: { fontFamily: FONTS.mono, fontSize: 10, color: PH.inkFaint, letterSpacing: 1, marginBottom: 8 },
  waveFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  waveTime: { fontFamily: FONTS.mono, fontSize: 10, color: PH.inkFaint },
  achieveCard: { marginBottom: 18 },
  achieveRow: { flexDirection: 'row', gap: 12 },
  achieveStar: { fontSize: 22, color: PH.violet },
  achieveText: { flex: 1 },
  achieveTitle: { fontFamily: FONTS.sansSemiBold, fontSize: 14, color: PH.ink },
  achieveSub: { fontFamily: FONTS.sans, fontSize: 12, color: PH.inkDim, marginTop: 4, lineHeight: 18 },
  actions: { gap: 10 },
});
