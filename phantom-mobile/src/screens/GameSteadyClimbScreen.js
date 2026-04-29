/**
 * GameSteadyClimbScreen — Timed + Live Sensor
 * ─────────────────────────────────────────────
 * EMG source priority:
 *   1. Live Arduino via useSensor() — hold signal in target zone to climb
 *   2. Touch fallback when no device (press and hold)
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity,
} from 'react-native';
import Svg, { Path, Circle, G, Rect } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { PH, FONTS } from '../constants/theme';
import { useSensor } from '../hooks/useSensor';

const { width: W, height: H } = Dimensions.get('window');
const TARGET_MIN = 0.30;
const TARGET_MAX = 0.68;
const METER_TOP  = 120;
const METER_BOT  = 110;
const METER_H    = H - METER_TOP - METER_BOT;

function fmt(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function GameSteadyClimbScreen({ navigation, route }) {
  const durationMin = route?.params?.durationMin ?? 10;
  const totalSec    = durationMin * 60;

  const [emgLevel, setEmgLevel] = useState(0);
  const [score,    setScore]    = useState(0);
  const [holdTime, setHoldTime] = useState(0);
  const [meters,   setMeters]   = useState(0);
  const [phase,    setPhase]    = useState('idle');
  const [timeLeft, setTimeLeft] = useState(totalSec);
  const emgRef       = useRef(0);
  const scoreRef     = useRef(0);
  const holdRef      = useRef(0);
  const metersRef    = useRef(0);
  const frameRef     = useRef(null);
  const phaseRef     = useRef('idle');
  const startTimeRef = useRef(null);
  const emgPeakRef   = useRef(0);
  const timeLeftRef  = useRef(totalSec);
  const lastSecRef   = useRef(null);

  const setPhaseS = (p) => { phaseRef.current = p; setPhase(p); };

  const { deviceConnected, sensorData } = useSensor();

  // Live sensor (only input source) → emgRef
  useEffect(() => {
    if (!deviceConnected || !sensorData) {
      emgRef.current = 0; setEmgLevel(0);
      if (phaseRef.current === 'playing') setPhaseS('paused');
      return;
    }
    if (phaseRef.current === 'paused') {
      lastSecRef.current = null;
      setPhaseS('playing');
    }
    const norm = Math.max(0, Math.min(1, sensorData.norm ?? 0));
    emgRef.current = norm;
    setEmgLevel(norm);
    if (norm > 0.15 && phaseRef.current === 'idle') {
      startTimeRef.current = Date.now();
      lastSecRef.current = null;
      setPhaseS('playing');
    }
  }, [sensorData, deviceConnected]);

  const reset = useCallback(() => {
    emgRef.current = 0;       setEmgLevel(0);
    scoreRef.current = 0;     setScore(0);
    holdRef.current = 0;      setHoldTime(0);
    metersRef.current = 0;    setMeters(0);
    startTimeRef.current = null; emgPeakRef.current = 0;
    timeLeftRef.current = totalSec; setTimeLeft(totalSec);
    lastSecRef.current = null;
    setPhaseS('idle');
  }, [totalSec]);

  useFocusEffect(useCallback(() => {
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      phaseRef.current = 'idle';
    };
  }, []));

  useEffect(() => {
    if (phase !== 'playing') return;
    let last = null;
    const tick = (t) => {
      if (phaseRef.current !== 'playing') return;
      if (!last) { last = t; lastSecRef.current = t; frameRef.current = requestAnimationFrame(tick); return; }
      const dt = (t - last) / 1000;
      last = t;

      // Countdown
      const secElapsed = Math.floor((t - lastSecRef.current) / 1000);
      if (secElapsed >= 1) {
        timeLeftRef.current = Math.max(0, timeLeftRef.current - secElapsed);
        setTimeLeft(timeLeftRef.current);
        lastSecRef.current = t - ((t - lastSecRef.current) % 1000);
      }
      if (timeLeftRef.current <= 0) { setPhaseS('done'); return; }

      // EMG logic
      const emg = emgRef.current;
      if (emg > emgPeakRef.current) emgPeakRef.current = emg;
      const inZone = emg >= TARGET_MIN && emg <= TARGET_MAX;

      if (inZone) {
        holdRef.current += dt;
        metersRef.current += dt;
        scoreRef.current += Math.round(dt * 20);
        setHoldTime(+holdRef.current.toFixed(1));
        setMeters(Math.round(metersRef.current));
        setScore(scoreRef.current);
      } else {
        holdRef.current = Math.max(0, holdRef.current - dt * 0.5);
        setHoldTime(+holdRef.current.toFixed(1));
      }

      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [phase]);

  // Navigate to Results when timer ends
  useEffect(() => {
    if (phase !== 'done') return;
    const dur  = startTimeRef.current ? Math.round((Date.now() - startTimeRef.current) / 1000) : totalSec;
    const peak = emgPeakRef.current;
    const avg  = holdRef.current > 0 ? Math.min(1, holdRef.current / Math.max(dur, 1)) : 0;
    navigation.replace('Results', { score: scoreRef.current, game: 'Steady Climb', durationSec: dur, emgPeak: peak, emgAvg: avg });
  }, [phase]);

  const handleFinish = () => {
    setPhaseS('done');
  };

  const inZone       = emgLevel >= TARGET_MIN && emgLevel <= TARGET_MAX;
  const pct          = emgLevel * 100;
  const climberTop   = METER_TOP + METER_H * (1 - Math.min(emgLevel, 1)) - 30;
  const timerColor   = timeLeft <= 30 ? PH.coral : timeLeft <= 60 ? '#F4B850' : PH.ink;

  return (
    <View style={s.root}>
      <LinearGradient colors={['#FFE5D6', '#FCD8C2', '#E89E7E']} style={StyleSheet.absoluteFill} />

      {/* Mountain */}
      <Svg width={W} height={H} style={StyleSheet.absoluteFill} preserveAspectRatio="none">
        <Path d={`M-20 ${H} L 60 ${H*0.28} L 120 ${H*0.46} L ${W*0.51} ${H*0.10} L ${W*0.72} ${H*0.40} L ${W*0.92} ${H*0.22} L ${W+10} ${H} Z`}
          fill="#D67555" opacity="0.85" />
        <Path d="M60 196 L 82 228 L 70 250 Z" fill="#FFF" opacity="0.7" />
        <Path d={`M${W*0.51} ${H*0.10} L ${W*0.56} ${H*0.17} L ${W*0.53} ${H*0.21} Z`} fill="#FFF" opacity="0.7" />
        <Path d={`M-20 ${H} L 30 ${H*0.54} L 90 ${H*0.69} L 160 ${H*0.45} L 230 ${H*0.65} L 300 ${H*0.51} L ${W+10} ${H*0.77} L ${W+10} ${H} Z`}
          fill="#B85839" opacity="0.5" />
      </Svg>

      {/* Rope */}
      <View style={[s.rope, { top: METER_TOP, height: METER_H }]}>
        {[0.15, 0.45, 0.75].map((p, i) => (
          <View key={i} style={[s.checkpoint, {
            top: METER_H * p - 6,
            backgroundColor: i === 0 ? PH.lime : '#FFF',
          }]} />
        ))}
      </View>

      {/* Climber */}
      <View style={[s.climber, { top: climberTop }]}>
        <Svg width="52" height="70" viewBox="0 0 52 70">
          <G fill={PH.ink}>
            <Circle cx="26" cy="12" r="8" />
            <Path d="M18 20 L 14 42 L 22 42 L 18 58 L 26 55 L 34 42 L 38 20 Z" />
          </G>
          <Path d="M24 28 L 46 10" stroke={PH.coral} strokeWidth="4" strokeLinecap="round" />
          <Path d="M26 36 L 38 24" stroke={PH.coral} strokeWidth="3" strokeDasharray="3 2" strokeLinecap="round" />
          <Circle cx="26" cy="9" r="3" fill={inZone ? PH.limeBright : PH.coral} />
        </Svg>
      </View>

      {/* HUD top */}
      <View style={s.hud}>
        <TouchableOpacity style={s.pauseBtn} onPress={() => navigation.goBack()}>
          <Svg width="14" height="14" viewBox="0 0 24 24" fill={PH.ink}>
            <Rect x="6" y="5" width="4" height="14" />
            <Rect x="14" y="5" width="4" height="14" />
          </Svg>
        </TouchableOpacity>
        <View style={s.scoreBox}>
          <View style={s.scoreItem}>
            <Text style={s.scoreLbl}>SCORE</Text>
            <Text style={[s.scoreVal, { color: PH.coral }]}>{score.toLocaleString()}</Text>
          </View>
          <View style={s.div} />
          <View style={s.scoreItem}>
            <Text style={s.scoreLbl}>HOLD</Text>
            <Text style={[s.scoreVal, { color: PH.coral }]}>{holdTime}s</Text>
          </View>
          <View style={s.div} />
          <View style={s.scoreItem}>
            <Text style={s.scoreLbl}>ВРЕМЯ</Text>
            <Text style={[s.scoreVal, { color: timerColor, fontVariant: ['tabular-nums'] }]}>{fmt(timeLeft)}</Text>
          </View>
        </View>
      </View>

      {/* Zone meter */}
      <View style={s.zoneMeter}>
        <Text style={s.zoneLabel}>ДЕРЖИ В ЗОНЕ</Text>
        <View style={s.zoneTrack}>
          <View style={[s.zoneTarget, {
            bottom: `${TARGET_MIN * 100}%`,
            height: `${(TARGET_MAX - TARGET_MIN) * 100}%`,
            backgroundColor: inZone ? `${PH.limeBright}55` : `${PH.lime}22`,
          }]} />
          <View style={[s.zoneMarker, { bottom: `${pct}%`, backgroundColor: inZone ? PH.lime : PH.coral }]} />
        </View>
        <View style={[s.zoneStatus, {
          backgroundColor: inZone ? PH.limeSoft : '#FCE6DD',
          borderColor: inZone ? `${PH.lime}44` : `${PH.coral}44`,
        }]}>
          <Text style={[s.zoneStatusTxt, { color: inZone ? PH.lime : PH.coral }]}>
            {inZone ? '● В ЦЕЛИ' : '✕ ВНЕ'}
          </Text>
        </View>
      </View>

      {/* Bottom card */}
      <View style={s.bottomCard}>
        <View style={s.bottomLeft}>
          <Text style={s.bottomTitle}>{inZone ? 'В зоне! Держи...' : 'Не слишком сильно, не слишком слабо'}</Text>
          <Text style={s.bottomSub}>Каждая секунда в зоне = 1 метр вверх</Text>
        </View>
        <View style={s.bottomStats}>
          <Text style={s.statLbl}>МЕТРОВ</Text>
          <Text style={[s.statVal, { color: PH.coral }]}>{meters}m</Text>
        </View>
      </View>

      {phase === 'idle' && deviceConnected && (
        <View style={s.hint}>
          <View style={[s.hintDot, { backgroundColor: PH.coral }]} />
          <Text style={s.hintText}>Удерживай сжатие в зелёной зоне</Text>
        </View>
      )}

      {/* Early finish */}
      {phase === 'playing' && meters >= 5 && (
        <TouchableOpacity style={s.finishBtn} onPress={handleFinish}>
          <Text style={s.finishTxt}>Завершить →</Text>
        </TouchableOpacity>
      )}

      {/* Device not connected — always blocks game */}
      {!deviceConnected && (
        <View style={s.overlay}>
          <Text style={s.ovEmoji}>🦾</Text>
          <Text style={s.ovTitle}>Подключи EMG датчик</Text>
          <Text style={s.ovSub}>Игра управляется только через датчик мышц.{'\n'}Подключи Arduino — игра стартует сама.</Text>
          <TouchableOpacity style={s.ovBack} onPress={() => navigation.goBack()}>
            <Text style={s.ovBackTxt}>← Назад</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  rope: { position: 'absolute', left: 56, width: 4, backgroundColor: 'rgba(184,88,57,0.4)', borderRadius: 2 },
  checkpoint: { position: 'absolute', left: -4, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: PH.coral },
  climber: { position: 'absolute', left: 36, width: 52, height: 70, zIndex: 5 },
  hud: { position: 'absolute', top: 54, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', gap: 10, zIndex: 10 },
  pauseBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.9)', borderWidth: 1, borderColor: PH.hair, alignItems: 'center', justifyContent: 'center' },
  scoreBox: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 999, borderWidth: 1, borderColor: PH.hair, flex: 1, justifyContent: 'center' },
  scoreItem: { alignItems: 'center' },
  scoreLbl: { fontFamily: FONTS.mono, fontSize: 9, color: PH.inkFaint, letterSpacing: 1 },
  scoreVal: { fontFamily: FONTS.sansBold, fontSize: 15, lineHeight: 18 },
  div: { width: 1, height: 22, backgroundColor: PH.hair },
  zoneMeter: { position: 'absolute', right: 18, top: METER_TOP, bottom: METER_BOT, width: 64, alignItems: 'center', zIndex: 6 },
  zoneLabel: { fontFamily: FONTS.mono, fontSize: 8, letterSpacing: 0.8, color: PH.ink, backgroundColor: 'rgba(255,255,255,0.85)', paddingHorizontal: 5, paddingVertical: 3, borderRadius: 999, marginBottom: 8, textAlign: 'center' },
  zoneTrack: { flex: 1, width: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.85)', borderWidth: 1, borderColor: PH.hair, overflow: 'hidden', position: 'relative' },
  zoneTarget: { position: 'absolute', left: -6, right: -6, borderTopWidth: 2, borderBottomWidth: 2, borderTopColor: PH.lime, borderBottomColor: PH.lime, borderStyle: 'dashed' },
  zoneMarker: { position: 'absolute', left: -8, right: -8, height: 4, borderRadius: 2 },
  zoneStatus: { marginTop: 8, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 999, borderWidth: 1 },
  zoneStatusTxt: { fontFamily: FONTS.mono, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  bottomCard: { position: 'absolute', bottom: 26, left: 16, right: 96, padding: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.94)', borderWidth: 1, borderColor: PH.hair, flexDirection: 'row', alignItems: 'center', gap: 12, zIndex: 6 },
  bottomLeft: { flex: 1 },
  bottomTitle: { fontFamily: FONTS.sansSemiBold, fontSize: 13, color: PH.ink },
  bottomSub: { fontFamily: FONTS.sans, fontSize: 11, color: PH.inkDim, marginTop: 2 },
  bottomStats: { alignItems: 'flex-end' },
  statLbl: { fontFamily: FONTS.mono, fontSize: 9, color: PH.inkFaint, letterSpacing: 1 },
  statVal: { fontFamily: FONTS.sansBold, fontSize: 20, lineHeight: 22 },
  hint: { position: 'absolute', bottom: 130, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 999, borderWidth: 1, borderColor: PH.hair, zIndex: 8 },
  hintDot: { width: 6, height: 6, borderRadius: 3 },
  hintText: { fontFamily: FONTS.sans, fontSize: 12, color: PH.ink },
  finishBtn: { position: 'absolute', bottom: 36, alignSelf: 'center', backgroundColor: PH.ink, paddingHorizontal: 28, paddingVertical: 13, borderRadius: 14, zIndex: 10 },
  finishTxt: { fontFamily: FONTS.sansSemiBold, fontSize: 15, color: '#FFF' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(245,242,236,0.96)', alignItems: 'center', justifyContent: 'center', zIndex: 30, gap: 10 },
  ovEmoji: { fontSize: 44 },
  ovTitle: { fontFamily: FONTS.sansBold, fontSize: 22, color: PH.ink, letterSpacing: -0.5 },
  ovSub: { fontFamily: FONTS.sans, fontSize: 14, color: PH.inkDim, textAlign: 'center', paddingHorizontal: 40, lineHeight: 21 },
  ovBack: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999, borderWidth: 1, borderColor: PH.hairStrong, backgroundColor: PH.bgSoft },
  ovBackTxt: { fontFamily: FONTS.sansMedium, fontSize: 14, color: PH.ink },
});
