/**
 * GamePulseRunScreen — Ghost Mode + Timed + Live EMG Sensor only
 * ───────────────────────────────────────────────────────────────
 * Input: Live Arduino via useSensor() exclusively.
 * Sharp EMG spike above threshold → jump.
 * When device not connected → full-screen overlay blocks gameplay.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity, Animated,
} from 'react-native';
import Svg, { Path, Circle, Rect, Ellipse, G } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { PH, FONTS } from '../constants/theme';
import { useSensor } from '../hooks/useSensor';

const { width: W, height: H } = Dimensions.get('window');
const GROUND    = H - 150;
const RUNNER_X  = 70;
const THRESHOLD = 0.40;
const OBS_W     = 28;
const OBS_SPEED = 2.4;
const INVINCIBLE_MS = 1000;

function makeObs() {
  return [
    { x: W + 80,            h: 50 + Math.random() * 40, scored: false },
    { x: W + 80 + W * 0.55, h: 44 + Math.random() * 44, scored: false },
  ];
}

function fmt(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function GamePulseRunScreen({ navigation, route }) {
  const durationMin = route?.params?.durationMin ?? 10;
  const totalSec    = durationMin * 60;

  const [emgLevel,  setEmgLevel]  = useState(0);
  const [jumping,   setJumping]   = useState(false);
  const [runnerY,   setRunnerY]   = useState(0);
  const [obs,       setObs]       = useState(makeObs);
  const [score,     setScore]     = useState(0);
  const [phase,     setPhase]     = useState('idle');
  const [timeLeft,  setTimeLeft]  = useState(totalSec);
  const [runnerHit, setRunnerHit] = useState(false);

  const emgRef       = useRef(0);
  const jumpingRef   = useRef(false);
  const runnerYRef   = useRef(0);
  const velRef       = useRef(0);
  const obsRef       = useRef(makeObs());
  const scoreRef     = useRef(0);
  const frameRef     = useRef(null);
  const phaseRef     = useRef('idle');
  const startTimeRef = useRef(null);
  const emgPeakRef   = useRef(0);
  const timeLeftRef  = useRef(totalSec);
  const lastSecRef   = useRef(null);
  const hitTimeRef   = useRef(0);
  const runnerFlash  = useRef(new Animated.Value(1)).current;

  const setPhaseS = (p) => { phaseRef.current = p; setPhase(p); };

  // ── Live sensor (only input source) ──────────────────────
  const { deviceConnected, sensorData } = useSensor();

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

  const triggerHitFlash = () => {
    hitTimeRef.current = Date.now();
    setRunnerHit(true);
    Animated.sequence([
      Animated.timing(runnerFlash, { toValue: 0.2, duration: 100, useNativeDriver: true }),
      Animated.timing(runnerFlash, { toValue: 1.0, duration: 100, useNativeDriver: true }),
      Animated.timing(runnerFlash, { toValue: 0.3, duration: 100, useNativeDriver: true }),
      Animated.timing(runnerFlash, { toValue: 1.0, duration: 100, useNativeDriver: true }),
    ]).start(() => setRunnerHit(false));
  };

  const reset = useCallback(() => {
    const o = makeObs();
    obsRef.current = o; setObs([...o]);
    runnerYRef.current = 0; setRunnerY(0);
    velRef.current = 0;
    jumpingRef.current = false; setJumping(false);
    emgRef.current = 0; setEmgLevel(0);
    scoreRef.current = 0; setScore(0);
    startTimeRef.current = null; emgPeakRef.current = 0;
    timeLeftRef.current = totalSec; setTimeLeft(totalSec);
    lastSecRef.current = null; hitTimeRef.current = 0;
    setRunnerHit(false);
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
      const dt = Math.min((t - last) / 16.67, 3);
      last = t;

      // Countdown
      const secElapsed = Math.floor((t - lastSecRef.current) / 1000);
      if (secElapsed >= 1) {
        timeLeftRef.current = Math.max(0, timeLeftRef.current - secElapsed);
        setTimeLeft(timeLeftRef.current);
        lastSecRef.current = t - ((t - lastSecRef.current) % 1000);
      }
      if (timeLeftRef.current <= 0) { setPhaseS('done'); return; }

      // EMG
      const emg = emgRef.current;
      if (emg > emgPeakRef.current) emgPeakRef.current = emg;
      const wasJumping = jumpingRef.current;

      if (!wasJumping && emg > THRESHOLD) {
        velRef.current = -22; jumpingRef.current = true; setJumping(true);
      }
      if (wasJumping) {
        velRef.current = Math.min(velRef.current + 0.55 * dt, 16);
        const ny = Math.max(-260, Math.min(0, runnerYRef.current + velRef.current * dt));
        runnerYRef.current = ny; setRunnerY(ny);
        if (ny >= 0) { runnerYRef.current = 0; velRef.current = 0; jumpingRef.current = false; setJumping(false); }
      }

      // Obstacles
      const newObs = obsRef.current.map(o => {
        let nx = o.x - OBS_SPEED * dt;
        let { h, scored } = o;
        if (nx < RUNNER_X + 20 && !scored) {
          scoreRef.current += 15; setScore(scoreRef.current); scored = true;
        }
        if (nx < -OBS_W) { nx = W + 60; h = 44 + Math.random() * 44; scored = false; }
        return { x: nx, h, scored };
      });
      obsRef.current = newObs; setObs([...newObs]);

      // Ghost collision
      const isInvincible = Date.now() - hitTimeRef.current < INVINCIBLE_MS;
      if (!isInvincible) {
        const ry = runnerYRef.current;
        for (const o of newObs) {
          const horizOk = RUNNER_X + 22 > o.x && RUNNER_X - 10 < o.x + OBS_W;
          const vertOk  = GROUND + ry + 70 > GROUND - o.h && ry >= -o.h + 10;
          if (horizOk && vertOk) { triggerHitFlash(); break; }
        }
      }

      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [phase]);

  // Navigate to results when done
  useEffect(() => {
    if (phase !== 'done') return;
    const dur  = startTimeRef.current ? Math.round((Date.now() - startTimeRef.current) / 1000) : totalSec;
    const peak = emgPeakRef.current;
    navigation.replace('Results', { score: scoreRef.current, game: 'Pulse Run', durationSec: dur, emgPeak: peak, emgAvg: peak * 0.7 });
  }, [phase]);

  const isJumping  = jumping;
  const pct        = Math.round(emgLevel * 100);
  const timerColor = timeLeft <= 30 ? PH.coral : timeLeft <= 60 ? '#F4B850' : PH.ink;

  return (
    <View style={s.root}>
      <LinearGradient colors={['#E9DFFB', '#FFE5D6']} style={StyleSheet.absoluteFill} />

      {[200, 270, 330, 390].map((y, i) => (
        <View key={i} style={[s.speedLine, { top: y }]} />
      ))}

      <View style={[s.ground, { top: GROUND }]}>
        <LinearGradient colors={['#B5A6E8', '#8870D8']} style={StyleSheet.absoluteFill} />
        <View style={s.groundTop} />
      </View>

      {obs.map((o, i) => (
        <View key={i} style={[s.obs, { left: o.x, height: o.h, bottom: H - GROUND }]}>
          <View style={s.obsCap} />
        </View>
      ))}

      {/* Runner with flash animation */}
      <Animated.View style={[s.runner, { top: GROUND + runnerY - 80, opacity: runnerFlash }]}>
        <Svg width="56" height="80" viewBox="0 0 56 80">
          {!isJumping && <Ellipse cx="28" cy="78" rx="22" ry="3" fill="rgba(0,0,0,0.2)" />}
          <G fill={runnerHit ? PH.coral : PH.violet}>
            <Circle cx="28" cy="13" r="9" />
            <Path d={isJumping
              ? 'M20 22 L12 40 L22 40 L16 58 L28 50 L40 40 L44 22 Z'
              : 'M20 22 L14 44 L24 44 L20 62 L28 62 L34 44 L42 22 Z'} />
          </G>
          <Path d={isJumping ? 'M26 28 L42 16' : 'M26 32 L14 36'}
            stroke={runnerHit ? PH.coral : PH.violet} strokeWidth="6" strokeLinecap="round" />
        </Svg>
      </Animated.View>

      {/* HUD */}
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
            <Text style={[s.scoreVal, { color: PH.violet }]}>{score.toLocaleString()}</Text>
          </View>
          <View style={s.div} />
          <View style={s.scoreItem}>
            <Text style={s.scoreLbl}>ВРЕМЯ</Text>
            <Text style={[s.scoreVal, { color: timerColor, fontVariant: ['tabular-nums'] }]}>{fmt(timeLeft)}</Text>
          </View>
        </View>
      </View>

      {/* Impulse bar */}
      <View style={s.impBar}>
        <View style={s.impHeader}>
          <Text style={s.impLbl}>ИМПУЛЬС</Text>
          <Text style={[s.impState, { color: isJumping ? PH.violet : PH.inkFaint }]}>
            {isJumping ? '⚡ ПРЫЖОК' : `${pct}%`}
          </Text>
        </View>
        <View style={s.impTrack}>
          <View style={[s.impFill, { width: `${pct}%`, backgroundColor: isJumping ? PH.violet : PH.violetSoft }]} />
          <View style={[s.impThresh, { left: `${THRESHOLD * 100}%` }]} />
        </View>
        <View style={s.impFooter}>
          <Text style={s.impNote}>покой</Text>
          <Text style={[s.impNote, { color: PH.coral }]}>↑ порог</Text>
          <Text style={s.impNote}>макс</Text>
        </View>
      </View>

      {phase === 'idle' && deviceConnected && (
        <View style={s.hint}>
          <View style={[s.hintDot, { backgroundColor: PH.violet }]} />
          <Text style={s.hintText}>Резкое сжатие мышцы — прыжок!</Text>
        </View>
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
  speedLine: { position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: `${PH.violet}28` },
  ground: { position: 'absolute', left: 0, right: 0, height: 70, overflow: 'hidden' },
  groundTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: PH.violet },
  obs: { position: 'absolute', width: OBS_W, backgroundColor: PH.coral, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  obsCap: { position: 'absolute', top: -8, left: -4, right: -4, height: 12, backgroundColor: PH.coral, borderRadius: 4 },
  runner: { position: 'absolute', left: RUNNER_X - 28, width: 56, height: 80 },
  hud: { position: 'absolute', top: 54, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', gap: 10, zIndex: 10 },
  pauseBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.9)', borderWidth: 1, borderColor: PH.hair, alignItems: 'center', justifyContent: 'center' },
  scoreBox: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 999, borderWidth: 1, borderColor: PH.hair, flex: 1, justifyContent: 'center' },
  scoreItem: { alignItems: 'center' },
  scoreLbl: { fontFamily: FONTS.mono, fontSize: 9, color: PH.inkFaint, letterSpacing: 1 },
  scoreVal: { fontFamily: FONTS.sansBold, fontSize: 16, lineHeight: 18 },
  div: { width: 1, height: 22, backgroundColor: PH.hair },
  impBar: { position: 'absolute', bottom: 28, left: 70, right: 70, padding: 10, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.95)', borderWidth: 1, borderColor: PH.hair, zIndex: 6 },
  impHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  impLbl: { fontFamily: FONTS.mono, fontSize: 9, color: PH.inkFaint, letterSpacing: 1 },
  impState: { fontFamily: FONTS.mono, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  impTrack: { height: 10, backgroundColor: PH.bgSoft, borderRadius: 5, overflow: 'hidden', position: 'relative' },
  impFill: { position: 'absolute', top: 0, left: 0, bottom: 0, borderRadius: 5 },
  impThresh: { position: 'absolute', top: -2, bottom: -2, width: 2, backgroundColor: PH.coral, zIndex: 2 },
  impFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  impNote: { fontFamily: FONTS.mono, fontSize: 9, color: PH.inkFaint },
  hint: { position: 'absolute', bottom: 130, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 999, borderWidth: 1, borderColor: PH.hair, zIndex: 8 },
  hintDot: { width: 6, height: 6, borderRadius: 3 },
  hintText: { fontFamily: FONTS.sans, fontSize: 12, color: PH.ink },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(245,242,236,0.96)', alignItems: 'center', justifyContent: 'center', zIndex: 30, gap: 10 },
  ovEmoji: { fontSize: 44 },
  ovTitle: { fontFamily: FONTS.sansBold, fontSize: 22, color: PH.ink, letterSpacing: -0.5 },
  ovSub: { fontFamily: FONTS.sans, fontSize: 14, color: PH.inkDim, textAlign: 'center', paddingHorizontal: 40, lineHeight: 21 },
  ovBack: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999, borderWidth: 1, borderColor: PH.hairStrong, backgroundColor: PH.bgSoft },
  ovBackTxt: { fontFamily: FONTS.sansMedium, fontSize: 14, color: PH.ink },
});
