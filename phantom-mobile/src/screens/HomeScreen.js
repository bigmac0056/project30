import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { PH, FONTS } from '../constants/theme';
import Card from '../components/Card';
import Pill from '../components/Pill';
import { PrimaryBtn, IconBtn } from '../components/Buttons';
import GameCover from '../components/GameCover';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const { width } = Dimensions.get('window');

const MINI_GAMES = [
  { title: 'Sparrow',   kind: 'sparrow', route: 'GameSparrow',     apiKey: 'Sparrow',      color: PH.lime   },
  { title: 'Pulse Run', kind: 'pulse',   route: 'GamePulseRun',    apiKey: 'Pulse Run',    color: PH.violet },
  { title: 'Steady',    kind: 'climb',   route: 'GameSteadyClimb', apiKey: 'Steady Climb', color: PH.coral  },
];

const DAYS_RU = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
const MONTHS_RU = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    api.getProgress().then(setProgress).catch(() => {});
  }, []);

  const now = new Date();
  const dateLabel = `${DAYS_RU[now.getDay()]} · ${now.getDate()} ${MONTHS_RU[now.getMonth()]}`;

  const streakDays = progress
    ? Array.from({ length: 7 }, (_, i) => (progress.daily_minutes[i] > 0 ? 1 : 0))
    : [0, 0, 0, 0, 0, 0, 0];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.dateLabel}>{dateLabel.toUpperCase()}</Text>
            <Text style={styles.greeting}>
              Привет, <Text style={styles.name}>{user?.name?.split(' ')[0] || 'друг'}</Text>
            </Text>
          </View>
          <IconBtn onPress={() => Alert.alert('Уведомления', 'Новых уведомлений нет.\n\nКак только врач или система оставят комментарий — он появится здесь.')}>
            <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <Path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M14 21a2 2 0 01-4 0" stroke={PH.ink} strokeWidth="2" strokeLinecap="round" />
            </Svg>
          </IconBtn>
        </View>

        {/* Today's workout card */}
        <LinearGradient
          colors={[PH.limeSoft, '#FFFFFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.workoutCard}
        >
          <View style={styles.workoutCoverAbs}>
            <GameCover kind="sparrow" width={64} height={64} />
          </View>
          <Pill style={styles.workoutPill}>Сегодня · Изоляция</Pill>
          <Text style={styles.workoutTitle}>
            Сжимаемые мышцы{'\n'}
            <Text style={styles.workoutSub}>сгибатели запястья</Text>
          </Text>
          <View style={styles.workoutMeta}>
            <Text style={styles.metaItem}>⌁ 12 мин</Text>
            <Text style={styles.metaItem}>○ 3 игры</Text>
          </View>
          <PrimaryBtn full onPress={() => navigation.navigate('GameStart', { game: 'Sparrow', route: 'GameSparrow', color: PH.lime })}>
            Начать тренировку →
          </PrimaryBtn>
        </LinearGradient>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <Card padded={false} style={styles.statCard}>
            <Text style={styles.statLabel}>СЕРИЯ</Text>
            <Text style={styles.statValue}>
              {progress?.streak_days ?? 0}<Text style={styles.statUnit}> дн</Text>
            </Text>
            <View style={styles.streakRow}>
              {streakDays.map((d, i) => (
                <View
                  key={i}
                  style={[styles.streakBar, { backgroundColor: d ? PH.lime : PH.bgSoft }]}
                />
              ))}
            </View>
          </Card>
          <Card padded={false} style={styles.statCard}>
            <Text style={styles.statLabel}>НЕДЕЛЯ</Text>
            <Text style={styles.statValue}>
              {progress?.week_minutes ?? 0}<Text style={styles.statUnit}> мин</Text>
            </Text>
            <Text style={styles.statSub}>
              {progress && progress.week_pct_change !== 0
                ? `${progress.week_pct_change > 0 ? '+' : ''}${progress.week_pct_change}% к прошлой`
                : 'начни первую сессию'}
            </Text>
          </Card>
        </View>

        {/* Games section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Игры</Text>
          <TouchableOpacity onPress={() => navigation.navigate('play')}>
            <Text style={styles.sectionAll}>ВСЕ →</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.gamesRow}>
          {MINI_GAMES.map((g) => (
            <TouchableOpacity
              key={g.kind}
              style={styles.miniCard}
              onPress={() => navigation.navigate('GameStart', { game: g.apiKey, route: g.route, color: g.color })}
              activeOpacity={0.75}
            >
              <GameCover kind={g.kind} width="100%" height={80} />
              <Text style={styles.miniTitle}>{g.title}</Text>
              <Text style={styles.miniLevel}>НАЖМИ →</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PH.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 20 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 18, marginTop: 8,
  },
  dateLabel: { fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 1, color: PH.inkFaint },
  greeting: { fontFamily: FONTS.sansBold, fontSize: 26, letterSpacing: -0.5, marginTop: 2, color: PH.ink },
  name: { color: PH.lime },
  workoutCard: {
    borderRadius: 18, padding: 20, marginBottom: 14,
    borderWidth: 1, borderColor: PH.hair, overflow: 'hidden',
  },
  workoutCoverAbs: { position: 'absolute', top: 12, right: 12, opacity: 0.5 },
  workoutPill: { marginBottom: 12 },
  workoutTitle: {
    fontFamily: FONTS.sansSemiBold, fontSize: 22,
    letterSpacing: -0.5, lineHeight: 26, marginBottom: 6, color: PH.ink,
  },
  workoutSub: { color: PH.inkDim },
  workoutMeta: { flexDirection: 'row', gap: 14, marginBottom: 16 },
  metaItem: { fontFamily: FONTS.sans, fontSize: 13, color: PH.inkDim },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard: { flex: 1, padding: 14 },
  statLabel: { fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1, color: PH.inkFaint },
  statValue: { fontFamily: FONTS.sansBold, fontSize: 28, marginTop: 4, color: PH.ink },
  statUnit: { color: PH.inkDim, fontSize: 14, fontFamily: FONTS.sans },
  statSub: { fontSize: 11, color: PH.inkDim, marginTop: 4 },
  streakRow: { flexDirection: 'row', gap: 3, marginTop: 8 },
  streakBar: { flex: 1, height: 14, borderRadius: 3 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'baseline', marginBottom: 10, marginTop: 6,
  },
  sectionTitle: { fontFamily: FONTS.sansSemiBold, fontSize: 16, color: PH.ink },
  sectionAll: { fontFamily: FONTS.mono, fontSize: 11, color: PH.lime, letterSpacing: 0.6 },
  gamesRow: { flexDirection: 'row', gap: 10 },
  miniCard: {
    flex: 1, backgroundColor: PH.bgSoft, borderRadius: 14,
    borderWidth: 1, borderColor: PH.hair, padding: 10, gap: 8, overflow: 'hidden',
  },
  miniTitle: { fontFamily: FONTS.sansSemiBold, fontSize: 13, color: PH.ink },
  miniLevel: { fontFamily: FONTS.mono, fontSize: 9, color: PH.lime, letterSpacing: 0.8 },
});
