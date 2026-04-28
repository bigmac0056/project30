/**
 * GameSparrowScreen — Ghost Mode + Timed + Live Sensor
 * ──────────────────────────────────────────────────────
 * EMG source priority:
 *   1. Live Arduino data via useSensor() when device is connected (50 Hz)
 *   2. Touch fallback (onPressIn/Out) when no device — for dev/demo
 * devicePaused overlay only appears when WS is up but Arduino unplugs mid-game.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity, Animated,
} from 'react-native';
import Svg, { Path, Circle, Ellipse, Rect } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { PH, FONTS } from '../constants/theme';
import { useSensor } from '../hooks/useSensor';

const { width: W, height: H } = Dimensions.get('window');
const GROUND_Y   = H - 160;
const THRESHOLD  = 0.35;
const PIPE_W     = 58;
const GAP        = 240;
const PIPE_SPEED = 2.0;
const INVINCIBLE_MS = 1200; // ghost invincibility after a hit

function makePipes() {
  return [
    { x: W + 80,            topH: 110 + Math.random() * 130, scored: false },
    { x: W + 80 + W * 0.65, topH: 100 + Math.random() * 150, scored: false },
  ];
}

function Cloud({ x, y, size }) {
  return (
    <View style={{ position: 'absolute', left: x, top: y }}>
      <Svg width={size} height={size * 0.5} viewBox="0 0 100 50">
        <Ellipse cx="25" cy="35" rx="22" ry="14" fill="#FFF" opacity="0.8" />
        <Ellipse cx="55" cy="28" rx="28" ry="18" fill="#FFF" opacity="0.85" />
        <Ellipse cx="80" cy="36" rx="18" ry="12" fill="#FFF" opacity="0.8" />
      </Svg>
    </View>
  );
}

function fmt(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function GameSparrowScreen({ navigation, route }) {
  const durationMin = route?.params?.durationMin ?? 10;
  const totalSec = durationMin * 60;

  const [emgLevel,   setEmgLevel]   = useState(0);
  const [birdY,      setBirdY]      = useState(H * 0.42);
  const [pipes,      setPipes]      = useState(makePipes);
  const [score,      setScore]      = useState(0);
  const [combo,      setCombo]      = useState(0);
  const [phase,      setPhase]      = useState('idle');   // idle | playing | paused | done
  const [timeLeft,   setTimeLeft]   = useState(totalSec);
  const [birdHit,    setBirdHit]    = useState(false);    // flash state
  const [devicePaused, setDevicePaused] = useState(false);

  // Refs (avoid stale closures in rAF loop)
  const emgRef        = useRef(0);
  const birdRef       = useRef(H * 0.42);
  const velRef        = useRef(0);
  const pipesRef      = useRef(makePipes());
  const scoreRef      = useRef(0);
  const comboRef      = useRef(0);
  const frameRef      = useRef(null);
  const pressing      = useRef(false);
  const phaseRef      = useRef('idle');
  const startTimeRef  = useRef(null);
  const emgPeakRef    = useRef(0);
  const emgSumRef     = useRef(0);
  const emgSamplesRef = useRef(0);
  const timeLeftRef   = useRef(totalSec);
  const lastSecRef    = useRef(null);       // for per-second timer
  const hitTimeRef    = useRef(0);          // timestamp of last pipe hit
  const birdFlash     = useRef(new Animated.Value(1)).current; // opacity for hit flash

  const setPhaseSync = (p) => { phaseRef.current = p; setPhase(p); };

  // ── Live sensor ───────────────────────────────────────────
  const { wsConnected, deviceConnected, sensorData } = useSensor();

  // sensorData fires at ~50 Hz when Arduino is connected.
  // Writes directly to emgRef so the rAF game loop picks it up every frame.
  useEffect(() => {
    if (!deviceConnected || !sensorData) return;
    const norm = Math.max(0, Math.min(1, sensorData.norm ?? 0));
    emgRef.current = norm;
    setEmgLevel(norm);
    // Auto-start: first significant squeeze starts the game
    if (norm > 0.15 && phaseRef.current === 'idle') {
      startTimeRef.current = Date.now();
      lastSecRef.current = null;
      setPhaseSync('playing');
    }
  }, [sensorData, deviceConnected]);

  // Pause when Arduino unplugs mid-game; resume on reconnect.
  // When WS is fully down (!wsConnected) → silent touch fallback, no overlay.
  useEffect(() => {
    if (!wsConnected) return;
    if (!deviceConnected) {
      setDevicePaused(true);
      if (phaseRef.current === 'playing') setPhaseSync('paused');
    } else {
      setDevicePaused(false);
      if (phaseRef.current === 'paused') {
        lastSecRef.current = null; // reset timer ref so tick starts fresh
        setPhaseSync('playing');
      }
    }
  }, [deviceConnected, wsConnected]);

  // ── Flash animation on ghost hit ──────────────────────────
  const triggerHitFlash = () => {
    hitTimeRef.current = Date.now();
    setBirdHit(true);
    Animated.sequence([
      Animated.timing(birdFlash, { toValue: 0.2, duration: 120, useNativeDriver: true }),
      Animated.timing(birdFlash, { toValue: 1.0, duration: 120, useNativeDriver: true }),
      Animated.timing(birdFlash, { toValue: 0.3, duration: 100, useNativeDriver: true }),
      Animated.timing(birdFlash, { toValue: 1.0, duration: 100, useNativeDriver: true }),
    ]).start(() => setBirdHit(false));
  };

  const reset = useCallback(() => {
    const p = makePipes();
    pipesRef.current = p; setPipes([...p]);
    birdRef.current = H * 0.42; setBirdY(H * 0.42);
    velRef.current = 0;
    emgRef.current = 0; setEmgLevel(0);
    startTimeRef.current = null;
    emgPeakRef.current = 0; emgSumRef.current = 0; emgSamplesRef.current = 0;
    scoreRef.current = 0; setScore(0);
    comboRef.current = 0; setCombo(0);
    timeLeftRef.current = totalSec; setTimeLeft(totalSec);
    lastSecRef.current = null;
    hitTimeRef.current = 0;
    setBirdHit(false);
    setDevicePaused(false);
    setPhaseSync('idle');
  }, [totalSec]);

  useFocusEffect(useCallback(() => {
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      phaseRef.current = 'idle';
    };
  }, []));

  // ── Main game loop ─────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing') return;

    let last = null;
    const tick = (t) => {
      if (phaseRef.current !== 'playing') return;
      if (!last) { last = t; lastSecRef.current = t; frameRef.current = requestAnimationFrame(tick); return; }
      const dt = Math.min((t - last) / 16.67, 3);
      last = t;

      // ── Countdown timer ──────────────────────────────────
      const secElapsed = Math.floor((t - lastSecRef.current) / 1000);
      if (secElapsed >= 1) {
        timeLeftRef.current = Math.max(0, timeLeftRef.current - secElapsed);
        setTimeLeft(timeLeftRef.current);
        lastSecRef.current = t - ((t - lastSecRef.current) % 1000);
      }
      if (timeLeftRef.current <= 0) {
        setPhaseSync('done');
        return;
      }

      // ── EMG / physics ────────────────────────────────────
      const emg = emgRef.current;
      if (emg > 0) {
        emgPeakRef.current = Math.max(emgPeakRef.current, emg);
        emgSumRef.current += emg; emgSamplesRef.current += 1;
      }
      if (emg > THRESHOLD) {
        velRef.current = Math.max(velRef.current - 0.6 * dt, -9);
      } else {
        velRef.current = Math.min(velRef.current + 0.5 * dt, 11);
      }
      const ny = Math.max(56, Math.min(GROUND_Y - 50, birdRef.current + velRef.current * dt));
      birdRef.current = ny;
      setBirdY(ny);

      // ── Pipes ─────────────────────────────────────────────
      const newPipes = pipesRef.current.map(p => {
        let nx = p.x - PIPE_SPEED * dt;
        let { topH, scored } = p;
        if (nx < 58 && !scored) {
          scoreRef.current += 10; setScore(scoreRef.current);
          comboRef.current += 1;  setCombo(comboRef.current);
          scored = true;
        }
        if (nx < -PIPE_W) { nx = W + 60; topH = 100 + Math.random() * 155; scored = false; }
        return { x: nx, topH, scored };
      });
      pipesRef.current = newPipes;
      setPipes([...newPipes]);

      // ── Ghost collision ───────────────────────────────────
      const bX = 60, bY = birdRef.current, bR = 22;
      const isInvincible = Date.now() - hitTimeRef.current < INVINCIBLE_MS;

      if (!isInvincible) {
        for (const p of newPipes) {
          const overlap = bX + bR > p.x && bX - bR < p.x + PIPE_W;
          if (overlap && (bY - bR < p.topH || bY + bR > p.topH + GAP)) {
            triggerHitFlash();
            comboRef.current = 0; setCombo(0); // reset combo on hit
            break;
          }
        }
        // Ground/ceiling hit → bounce back (not death)
        if (birdRef.current >= GROUND_Y - 48) {
          velRef.current = -8;
          triggerHitFlash();
        }
      }

      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [phase]);

  // ── Navigate to Results when done ─────────────────────────
  useEffect(() => {
    if (phase !== 'done') return;
    const dur = startTimeRef.current ? Math.round((Date.now() - startTimeRef.current) / 1000) : totalSec;
    const peak = emgPeakRef.current;
    const avg  = emgSamplesRef.current > 0 ? emgSumRef.current / emgSamplesRef.current : 0;
    const finalScore = scoreRef.current;
    navigation.replace('Results', { score: finalScore, game: 'Sparrow', durationSec: dur, emgPeak: peak, emgAvg: avg });
  }, [phase]);

  // ── EMG press handlers ────────────────────────────────────
  const handlePressIn = () => {
    pressing.current = true;
    if (phaseRef.current === 'idle') {
      startTimeRef.current = Date.now();
      lastSecRef.current = null;
      setPhaseSync('playing');
    }
    const rise = () => {
      if (!pressing.current) return;
      emgRef.current = Math.min(emgRef.current + 0.055, 1);
      setEmgLevel(emgRef.current);
      setTimeout(rise, 28);
    };
    rise();
  };
  const handlePressOut = () => {
    pressing.current = false;
    const fall = () => {
      if (pressing.current) return;
      emgRef.current = Math.max(emgRef.current - 0.048, 0);
      setEmgLevel(emgRef.current);
      if (emgRef.current > 0) setTimeout(fall, 28);
    };
    fall();
  };

  // ── Timer colour ──────────────────────────────────────────
  const timerColor = timeLeft <= 30 ? PH.coral : timeLeft <= 60 ? '#F4B850' : PH.ink;

  return (
    <View style={s.root}>
      <LinearGradient colors={['#DCE8F2', '#F2D998']} style={StyleSheet.absoluteFill} />

      <View style={s.sun} />
      <Cloud x={40}      y={110} size={70} />
      <Cloud x={W - 110} y={190} size={52} />

      <View style={[s.hills, { top: GROUND_Y - 60 }]}>
        <LinearGradient colors={['#88C36F', '#4F8B3D']} style={StyleSheet.absoluteFill} />
      </View>

      {/* Pipes */}
      {pipes.map((p, i) => (
        <React.Fragment key={i}>
          <View style={[s.pipe, { left: p.x, height: p.topH, top: 0, borderBottomLeftRadius: 10, borderBottomRightRadius: 10 }]} />
          <View style={[s.pipe, {
            left: p.x, top: p.topH + GAP,
            height: Math.max(0, GROUND_Y - (p.topH + GAP) + 60),
            borderTopLeftRadius: 10, borderTopRightRadius: 10,
          }]} />
        </React.Fragment>
      ))}

      {/* Bird — animated opacity for hit flash */}
      <Animated.View style={[s.bird, { top: birdY - 28, left: 32, opacity: birdFlash }]}>
        <Svg width="56" height="56" viewBox="0 0 56 56">
          <Circle cx="28" cy="28" r="26" fill={birdHit ? PH.coral : PH.lime} />
          <Path d="M10 28 Q 18 16, 32 24 L 38 18 L 37 28 Q 32 34, 22 34 Q 14 34, 10 28 Z" fill="#FFF" />
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
            <Text style={[s.scoreVal, { color: PH.lime }]}>{score.toLocaleString()}</Text>
          </View>
          <View style={s.div} />
          <View style={s.scoreItem}>
            <Text style={s.scoreLbl}>СЕРИЯ</Text>
            <Text style={s.scoreVal}>×{combo}</Text>
          </View>
          <View style={s.div} />
          <View style={s.scoreItem}>
            <Text style={s.scoreLbl}>ВРЕМЯ</Text>
            <Text style={[s.scoreVal, { color: timerColor, fontVariant: ['tabular-nums'] }]}>{fmt(timeLeft)}</Text>
          </View>
        </View>
      </View>

      {/* EMG meter */}
      <View style={s.emgWrap}>
        <Text style={s.emgLbl}>EMG</Text>
        <View style={s.emgTrack}>
          <View style={[s.emgFill, { height: `${Math.round(emgLevel * 100)}%` }]} />
          <View style={[s.emgThresh, { bottom: `${THRESHOLD * 100}%` }]} />
        </View>
        <Text style={s.emgVal}>{Math.round(emgLevel * 100)}%</Text>
      </View>

      {/* Touch zone — only when no Arduino connected (fallback/demo mode) */}
      {!deviceConnected && (
        <TouchableOpacity
          style={s.touch}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
        />
      )}

      {/* Idle hint */}
      {phase === 'idle' && (
        <View style={s.hint}>
          <View style={[s.hintDot, { backgroundColor: deviceConnected ? PH.limeBright : PH.lime }]} />
          <Text style={s.hintText}>
            {deviceConnected
              ? 'Сожми мышцу — взлетай'
              : 'Зажми экран — взлетай, отпусти — падай'}
          </Text>
        </View>
      )}

      {/* Device disconnect overlay */}
      {devicePaused && (
        <View style={s.overlay}>
          <Text style={s.ovEmoji}>🔌</Text>
          <Text style={s.ovTitle}>Устройство отключено</Text>
          <Text style={s.ovSub}>Подключи датчик и игра продолжится автоматически</Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  sun: {
    position: 'absolute', right: 30, top: 90,
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: '#F4B850',
    shadowColor: '#F4B850', shadowRadius: 20, shadowOpacity: 0.5, elevation: 4,
  },
  hills: {
    position: 'absolute', left: 0, right: 0, height: 120, overflow: 'hidden',
  },
  pipe: { position: 'absolute', width: PIPE_W, backgroundColor: PH.lime },
  bird: { position: 'absolute', width: 56, height: 56 },
  hud: {
    position: 'absolute', top: 54, left: 16, right: 16,
    flexDirection: 'row', alignItems: 'center', gap: 10, zIndex: 10,
  },
  pauseBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.9)', borderWidth: 1, borderColor: PH.hair,
    alignItems: 'center', justifyContent: 'center',
  },
  scoreBox: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 999, borderWidth: 1, borderColor: PH.hair,
    flex: 1, justifyContent: 'center',
  },
  scoreItem: { alignItems: 'center' },
  scoreLbl: { fontFamily: FONTS.mono, fontSize: 9, color: PH.inkFaint, letterSpacing: 1 },
  scoreVal: { fontFamily: FONTS.sansBold, fontSize: 16, color: PH.ink, lineHeight: 18 },
  div: { width: 1, height: 22, backgroundColor: PH.hair },
  emgWrap: {
    position: 'absolute', left: 14, bottom: 100, top: 100,
    width: 36, alignItems: 'center', zIndex: 6,
  },
  emgLbl: {
    fontFamily: FONTS.mono, fontSize: 9, color: PH.ink, letterSpacing: 1,
    backgroundColor: 'rgba(255,255,255,0.88)', paddingHorizontal: 5, paddingVertical: 2,
    borderRadius: 999, marginBottom: 6,
  },
  emgTrack: {
    flex: 1, width: 14, borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.88)', borderWidth: 1, borderColor: PH.hair,
    overflow: 'hidden', justifyContent: 'flex-end',
  },
  emgFill: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: PH.limeBright },
  emgThresh: { position: 'absolute', left: -3, right: -3, height: 2, backgroundColor: PH.violet },
  emgVal: {
    fontFamily: FONTS.mono, fontSize: 10, color: PH.lime, marginTop: 6,
    backgroundColor: 'rgba(255,255,255,0.88)', paddingHorizontal: 5,
    paddingVertical: 2, borderRadius: 999, fontVariant: ['tabular-nums'],
  },
  touch: { position: 'absolute', top: 100, left: 60, right: 0, bottom: 80, zIndex: 5 },
  hint: {
    position: 'absolute', bottom: 32, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 999,
    borderWidth: 1, borderColor: PH.hair, zIndex: 8,
  },
  hintDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: PH.lime },
  hintText: { fontFamily: FONTS.sans, fontSize: 12, color: PH.ink },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(245,242,236,0.96)',
    alignItems: 'center', justifyContent: 'center', zIndex: 30, gap: 10,
  },
  ovEmoji: { fontSize: 44 },
  ovTitle: { fontFamily: FONTS.sansBold, fontSize: 22, color: PH.ink, letterSpacing: -0.5 },
  ovSub: {
    fontFamily: FONTS.sans, fontSize: 14, color: PH.inkDim,
    textAlign: 'center', paddingHorizontal: 40, lineHeight: 21,
  },
});
