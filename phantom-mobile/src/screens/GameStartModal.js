/**
 * GameStartModal.js
 * ─────────────────
 * Pre-game screen that appears before any game:
 *   1. Quick EMG pulse check (press the circle)
 *   2. Duration picker (5 / 10 / 15 / 30 / 40 min)
 *   3. Start → navigate to the actual game with durationMin param
 *
 * Navigate here like:
 *   navigation.navigate('GameStart', { game: 'Sparrow', route: 'GameSparrow', color: PH.lime })
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { PH, FONTS } from '../constants/theme';
import GameCover from '../components/GameCover';
import { PrimaryBtn } from '../components/Buttons';
import { useSensor } from '../hooks/useSensor';

const { width: W } = Dimensions.get('window');
const DURATIONS = [5, 10, 15, 30, 40];

const GAME_INFO = {
  Sparrow     : { kind: 'sparrow', desc: 'Сжимай мышцу — птица взлетает. Пролетай через щели и набирай очки.', skill: 'Активация' },
  'Pulse Run' : { kind: 'pulse',   desc: 'Резкие импульсы — прыжок через препятствие. Точность важнее силы.',  skill: 'Точность'  },
  'Steady Climb': { kind: 'climb', desc: 'Держи сигнал в узком диапазоне как можно дольше. Контроль дозы.',     skill: 'Контроль'  },
};

export default function GameStartModal({ navigation, route }) {
  const { game = 'Sparrow', route: gameRoute = 'GameSparrow', color = PH.lime } = route?.params ?? {};
  const info = GAME_INFO[game] ?? GAME_INFO.Sparrow;

  const { deviceConnected, sensorData } = useSensor();

  const [selectedMin, setSelectedMin] = useState(10);
  const [emgPct, setEmgPct]     = useState(0);
  const [pulsed, setPulsed]     = useState(false);
  const [pressing, setPressing] = useState(false);

  const emgRef    = useRef(0);
  const pressRef  = useRef(false);
  const barAnim   = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // ── Live sensor → EMG bar ────────────────────────────────
  useEffect(() => {
    if (!deviceConnected || !sensorData) return;
    const norm = Math.max(0, Math.min(1, sensorData.norm ?? 0));
    emgRef.current = norm;
    const pct = Math.round(norm * 100);
    setEmgPct(pct);
    Animated.timing(barAnim, { toValue: norm, duration: 60, useNativeDriver: false }).start();
    if (norm > 0.6 && !pulsed) setPulsed(true);
  }, [sensorData, deviceConnected]);

  // ── Touch simulation (fallback when no device) ───────────
  useEffect(() => {
    if (deviceConnected) return;
    let timer;
    const step = () => {
      if (pressRef.current) emgRef.current = Math.min(emgRef.current + 0.07, 1);
      else                  emgRef.current = Math.max(emgRef.current - 0.055, 0);
      const pct = Math.round(emgRef.current * 100);
      setEmgPct(pct);
      Animated.timing(barAnim, { toValue: emgRef.current, duration: 60, useNativeDriver: false }).start();
      if (pressRef.current || emgRef.current > 0) timer = setTimeout(step, 28);
    };
    if (pressing) { pressRef.current = true; step(); }
    else          { pressRef.current = false; step(); }
    return () => clearTimeout(timer);
  }, [pressing, deviceConnected]);

  // ── Pulse ring on strong signal ──────────────────────────
  useEffect(() => {
    if (emgPct > 60) {
      if (!pulsed) setPulsed(true);
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.18, duration: 180, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0,  duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [emgPct]);

  const barWidth = barAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const barColor = emgPct > 70 ? '#A8CC5C' : emgPct > 35 ? '#F4B850' : PH.bgSoft;

  const handleStart = () => {
    navigation.replace(gameRoute, { durationMin: selectedMin });
  };

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.closeBtn} onPress={() => navigation.goBack()}>
          <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <Path d="M6 6l12 12M6 18L18 6" stroke={PH.ink} strokeWidth="2.4" strokeLinecap="round" />
          </Svg>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Перед игрой</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Game identity card */}
      <View style={[s.gameCard, { borderColor: `${color}44` }]}>
        <GameCover kind={info.kind} width={64} height={64} />
        <View style={{ flex: 1 }}>
          <Text style={[s.gameName, { color }]}>{game}</Text>
          <Text style={s.gameDesc}>{info.desc}</Text>
          <View style={[s.skillBadge, { backgroundColor: `${color}18`, borderColor: `${color}44` }]}>
            <Text style={[s.skillTxt, { color }]}>● {info.skill}</Text>
          </View>
        </View>
      </View>

      {/* ── Step 1: EMG / device check ────────────────────── */}
      <View style={s.section}>
        <View style={s.stepRow}>
          <View style={[s.stepDot, pulsed && s.stepDotDone]}>
            <Text style={[s.stepNum, pulsed && { color: '#FFF' }]}>{pulsed ? '✓' : '1'}</Text>
          </View>
          <Text style={s.stepTitle}>Проверь сигнал мышцы</Text>
          {/* Device status badge */}
          <View style={[s.deviceBadge, { backgroundColor: deviceConnected ? '#EDF7E3' : PH.bgSoft, borderColor: deviceConnected ? `${PH.lime}55` : PH.hair }]}>
            <View style={[s.deviceDot, { backgroundColor: deviceConnected ? PH.limeBright : PH.inkFaint }]} />
            <Text style={[s.deviceTxt, { color: deviceConnected ? PH.lime : PH.inkFaint }]}>
              {deviceConnected ? 'Датчик' : 'Симуляция'}
            </Text>
          </View>
        </View>

        <View style={s.emgCard}>
          {deviceConnected ? (
            /* ── Sensor mode: live bar, no button needed ── */
            <View style={s.sensorLive}>
              <Text style={s.sensorLiveEmoji}>💪</Text>
              <Text style={[s.sensorLivePct, { color }]}>{emgPct}%</Text>
              <Text style={s.sensorLiveHint}>
                {pulsed ? '✓ Сигнал есть — можно начинать!' : 'Сожми мышцу чтобы проверить сигнал'}
              </Text>
            </View>
          ) : (
            /* ── Touch fallback: press circle ── */
            <View style={s.circleWrap}>
              <Animated.View style={[s.pulsRing, { borderColor: color, transform: [{ scale: pulseAnim }] }]} />
              <TouchableOpacity
                style={[s.pressCircle, { backgroundColor: pressing ? color : 'transparent', borderColor: color }]}
                onPressIn={() => setPressing(true)}
                onPressOut={() => setPressing(false)}
                activeOpacity={1}
              >
                <Text style={[s.pressLabel, { color: pressing ? PH.bg : color }]}>
                  {pressing ? `${emgPct}%` : 'ЖМИ'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Bar — always shown */}
          <View style={s.emgBarWrap}>
            <Animated.View style={[s.emgBarFill, { width: barWidth, backgroundColor: barColor }]} />
            <View style={s.emgBarThresh} />
          </View>
          <Text style={s.emgHint}>
            {pulsed
              ? `✓ Сигнал подтверждён · ${emgPct}%`
              : deviceConnected
                ? 'Сожми мышцу — убедись что полоска двигается'
                : 'Зажми кнопку — убедись что сигнал отвечает'}
          </Text>
        </View>
      </View>

      {/* ── Step 2: Duration ──────────────────────────────── */}
      <View style={s.section}>
        <View style={s.stepRow}>
          <View style={[s.stepDot, { backgroundColor: PH.bgSoft, borderColor: PH.hairStrong }]}>
            <Text style={s.stepNum}>2</Text>
          </View>
          <Text style={s.stepTitle}>Выбери длительность</Text>
        </View>

        <View style={s.durationRow}>
          {DURATIONS.map((m) => (
            <TouchableOpacity
              key={m}
              style={[s.durBtn, selectedMin === m && { backgroundColor: color, borderColor: color }]}
              onPress={() => setSelectedMin(m)}
            >
              <Text style={[s.durMin, selectedMin === m && { color: PH.bg }]}>{m}</Text>
              <Text style={[s.durUnit, selectedMin === m && { color: `${PH.bg}BB` }]}>мин</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.durNote}>
          Максимум 40 мин · Рекомендовано 10–15 мин для начала
        </Text>
      </View>

      {/* ── Start button ──────────────────────────────────── */}
      <View style={s.footer}>
        <PrimaryBtn full onPress={handleStart}>
          Начать {selectedMin} мин →
        </PrimaryBtn>
        {!pulsed && (
          <Text style={s.skipNote}>Можно начать без проверки сигнала</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PH.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: PH.hair,
  },
  headerTitle: { fontFamily: FONTS.sansSemiBold, fontSize: 16, color: PH.ink },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: PH.bgSoft, borderWidth: 1, borderColor: PH.hair,
    alignItems: 'center', justifyContent: 'center',
  },

  gameCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    margin: 20, padding: 14, borderRadius: 16,
    borderWidth: 1, backgroundColor: PH.bgAlt,
  },
  gameName: { fontFamily: FONTS.sansBold, fontSize: 22, letterSpacing: -0.5, marginBottom: 4 },
  gameDesc: { fontFamily: FONTS.sans, fontSize: 12, color: PH.inkDim, lineHeight: 18, marginBottom: 8 },
  skillBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 999, borderWidth: 1,
  },
  skillTxt: { fontFamily: FONTS.mono, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

  section: { paddingHorizontal: 20, marginBottom: 20 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  stepDot: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: PH.bgSoft, borderWidth: 1.5, borderColor: PH.hairStrong,
    alignItems: 'center', justifyContent: 'center',
  },
  stepDotDone: { backgroundColor: PH.lime, borderColor: PH.lime },
  stepNum: { fontFamily: FONTS.sansBold, fontSize: 12, color: PH.inkDim },
  stepTitle: { fontFamily: FONTS.sansSemiBold, fontSize: 15, color: PH.ink },

  emgCard: {
    backgroundColor: PH.bgAlt, borderRadius: 14, borderWidth: 1, borderColor: PH.hair,
    padding: 16, alignItems: 'center', gap: 14,
  },
  circleWrap: { alignItems: 'center', justifyContent: 'center', width: 100, height: 100 },
  pulsRing: {
    position: 'absolute', width: 90, height: 90, borderRadius: 45,
    borderWidth: 2, opacity: 0.4,
  },
  pressCircle: {
    width: 76, height: 76, borderRadius: 38,
    borderWidth: 2.5, alignItems: 'center', justifyContent: 'center',
  },
  pressLabel: { fontFamily: FONTS.sansBold, fontSize: 16, letterSpacing: -0.5 },

  emgBarWrap: {
    width: '100%', height: 10, backgroundColor: PH.bgSoft,
    borderRadius: 5, overflow: 'hidden', position: 'relative',
  },
  emgBarFill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 5 },
  emgBarThresh: {
    position: 'absolute', left: '35%', top: -3, bottom: -3,
    width: 2, backgroundColor: PH.violet, borderRadius: 1,
  },
  emgHint: {
    fontFamily: FONTS.mono, fontSize: 10, color: PH.inkDim,
    textAlign: 'center', letterSpacing: 0.3,
  },

  durationRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  durBtn: {
    flex: 1, minWidth: 52, paddingVertical: 12, borderRadius: 12,
    borderWidth: 1.5, borderColor: PH.hairStrong,
    backgroundColor: PH.bgAlt, alignItems: 'center',
  },
  durMin: { fontFamily: FONTS.sansBold, fontSize: 18, color: PH.ink },
  durUnit: { fontFamily: FONTS.mono, fontSize: 9, color: PH.inkFaint, letterSpacing: 0.5, marginTop: 2 },
  durNote: {
    fontFamily: FONTS.sans, fontSize: 11, color: PH.inkFaint,
    marginTop: 10, textAlign: 'center',
  },

  footer: { paddingHorizontal: 20, marginTop: 'auto', paddingBottom: 20, gap: 8 },
  skipNote: {
    fontFamily: FONTS.sans, fontSize: 11, color: PH.inkFaint,
    textAlign: 'center', marginTop: 4,
  },

  // Device badge in step header
  deviceBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999,
    borderWidth: 1, marginLeft: 'auto',
  },
  deviceDot: { width: 6, height: 6, borderRadius: 3 },
  deviceTxt: { fontFamily: FONTS.mono, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },

  // Live sensor display
  sensorLive: { alignItems: 'center', gap: 4, paddingVertical: 8 },
  sensorLiveEmoji: { fontSize: 32 },
  sensorLivePct: { fontFamily: FONTS.sansBold, fontSize: 36, letterSpacing: -1, lineHeight: 40 },
  sensorLiveHint: { fontFamily: FONTS.sans, fontSize: 12, color: PH.inkDim, textAlign: 'center' },
});
