import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import { PH, FONTS } from '../constants/theme';
import Card from '../components/Card';
import Pill from '../components/Pill';
import GameCover from '../components/GameCover';
import { api } from '../services/api';

const GAMES = [
  {
    title: 'Sparrow', sub: 'flappy · удержание', kind: 'sparrow',
    color: PH.lime, desc: 'Напряги мышцу — взлетай. Отпусти — падай.',
    skill: 'Активация', route: 'GameSparrow', apiKey: 'Sparrow',
  },
  {
    title: 'Pulse Run', sub: 'раннер · импульс', kind: 'pulse',
    color: PH.violet, desc: 'Короткие сокращения — прыжок через препятствие.',
    skill: 'Точность', route: 'GamePulseRun', apiKey: 'Pulse Run',
  },
  {
    title: 'Steady Climb', sub: 'альпинист · дозирование', kind: 'climb',
    color: PH.coral, desc: 'Держи сигнал в узком диапазоне как можно дольше.',
    skill: 'Контроль', route: 'GameSteadyClimb', apiKey: 'Steady Climb',
  },
];

const COMING_SOON = ['Rhythm Fist', 'Co-op Lab'];

function formatDate(isoStr) {
  if (!isoStr) return null;
  const d = new Date(isoStr);
  const now = new Date();
  const diffH = Math.round((now - d) / 3600000);
  if (diffH < 1) return 'только что';
  if (diffH < 24) return `${diffH} ч назад`;
  const diffD = Math.round(diffH / 24);
  if (diffD < 7) return `${diffD} дн назад`;
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

export default function CatalogScreen({ navigation }) {
  const [stats, setStats] = useState({});

  const loadStats = useCallback(async () => {
    try {
      const sessions = await api.getSessions();
      const map = {};
      for (const g of GAMES) {
        const gameSessions = sessions.filter(s => s.game === g.apiKey);
        if (gameSessions.length === 0) continue;
        const best = Math.max(...gameSessions.map(s => s.score));
        const last = gameSessions[0]; // already sorted desc
        map[g.apiKey] = { best, lastPlayed: last.played_at, count: gameSessions.length };
      }
      setStats(map);
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => { loadStats(); }, [loadStats]));

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Игры</Text>
        <Text style={styles.subtitle}>Каждая тренирует свой навык для протеза.</Text>

        <View style={styles.gameList}>
          {GAMES.map((g) => {
            const st = stats[g.apiKey];
            return (
              <TouchableOpacity
                key={g.kind}
                activeOpacity={0.75}
                onPress={() => navigation.navigate(g.route)}
              >
                <Card padded={false} style={styles.gameCard}>
                  <View style={styles.gameRow}>
                    <GameCover kind={g.kind} width={72} height={72} />
                    <View style={styles.gameInfo}>
                      <View style={styles.gameTitleRow}>
                        <Text style={styles.gameName}>{g.title}</Text>
                        <Text style={styles.gameSub}>{g.sub}</Text>
                      </View>
                      <Text style={styles.gameDesc}>{g.desc}</Text>
                      <View style={styles.gameFooter}>
                        <Pill color={g.color} style={styles.skillPill}>● {g.skill}</Pill>
                        {st ? (
                          <View style={styles.statsBadge}>
                            <Text style={styles.statsText}>
                              🏆 {st.best.toLocaleString()}
                            </Text>
                            {st.lastPlayed && (
                              <Text style={styles.statsTime}>{formatDate(st.lastPlayed)}</Text>
                            )}
                          </View>
                        ) : (
                          <Text style={styles.notPlayed}>не играл</Text>
                        )}
                      </View>
                    </View>
                    <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <Path d="M9 6l6 6-6 6" stroke={PH.inkFaint} strokeWidth="2.4" strokeLinecap="round" />
                    </Svg>
                  </View>
                  {st && (
                    <View style={styles.sessionBar}>
                      <Text style={styles.sessionBarTxt}>
                        {st.count} {st.count === 1 ? 'сессия' : st.count < 5 ? 'сессии' : 'сессий'} · нажми чтобы играть →
                      </Text>
                    </View>
                  )}
                </Card>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.comingLabel}>СКОРО</Text>
        <View style={styles.comingRow}>
          {COMING_SOON.map((name) => (
            <TouchableOpacity
              key={name}
              style={styles.comingCard}
              onPress={() => {/* ничего не делаем, показываем pill */}}
              activeOpacity={0.6}
            >
              <Text style={styles.comingName}>{name}</Text>
              <Text style={styles.comingSub}>в разработке</Text>
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
  content: { paddingHorizontal: 20, paddingBottom: 24 },
  title: { fontFamily: FONTS.sansBold, fontSize: 30, letterSpacing: -1, color: PH.ink, marginTop: 4, marginBottom: 4 },
  subtitle: { fontFamily: FONTS.sans, fontSize: 14, color: PH.inkDim, marginBottom: 18 },

  gameList: { gap: 12, marginBottom: 22 },
  gameCard: { padding: 0 },
  gameRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  gameInfo: { flex: 1 },
  gameTitleRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 4 },
  gameName: { fontFamily: FONTS.sansSemiBold, fontSize: 17, color: PH.ink },
  gameSub: { fontFamily: FONTS.mono, fontSize: 10, color: PH.inkFaint, letterSpacing: 0.6 },
  gameDesc: { fontFamily: FONTS.sans, fontSize: 12, lineHeight: 18, color: PH.inkDim, marginBottom: 8 },
  gameFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  skillPill: {},
  statsBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statsText: { fontFamily: FONTS.mono, fontSize: 10, color: PH.ink, fontWeight: '700' },
  statsTime: { fontFamily: FONTS.mono, fontSize: 9, color: PH.inkFaint },
  notPlayed: { fontFamily: FONTS.mono, fontSize: 10, color: PH.inkFaint, letterSpacing: 0.5 },

  sessionBar: {
    borderTopWidth: 1, borderTopColor: PH.hair,
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: PH.bgSoft,
  },
  sessionBarTxt: { fontFamily: FONTS.mono, fontSize: 9, color: PH.inkFaint, letterSpacing: 0.6 },

  comingLabel: { fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1, color: PH.inkFaint, marginBottom: 8 },
  comingRow: { flexDirection: 'row', gap: 10 },
  comingCard: {
    flex: 1, padding: 14,
    borderWidth: 1, borderColor: PH.hairStrong,
    borderStyle: 'dashed', borderRadius: 12,
  },
  comingName: { fontFamily: FONTS.sansSemiBold, fontSize: 13, color: PH.inkDim },
  comingSub: { fontFamily: FONTS.sans, fontSize: 11, color: PH.inkFaint, marginTop: 2 },
});
