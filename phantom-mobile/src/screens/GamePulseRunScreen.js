import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity,
} from 'react-native';
import Svg, { Path, Circle, Rect, Ellipse, G } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { PH, FONTS } from '../constants/theme';

const { width: W, height: H } = Dimensions.get('window');
const GROUND = H - 150;
const RUNNER_X = 70;
const THRESHOLD = 0.40;   // легче активировать
const OBS_W = 28;
const OBS_SPEED = 2.4;    // медленнее

function makeObs() {
  return [
    { x: W + 80, h: 50 + Math.random() * 40, scored: false },
    { x: W + 80 + W * 0.55, h: 44 + Math.random() * 44, scored: false },
  ];
}

export default function GamePulseRunScreen({ navigation }) {
  const [emgLevel, setEmgLevel] = useState(0);
  const [jumping, setJumping] = useState(false);
  const [runnerY, setRunnerY] = useState(0);
  const [obs, setObs] = useState(makeObs);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState('idle');

  const emgRef = useRef(0);
  const jumpingRef = useRef(false);
  const runnerYRef = useRef(0);
  const velRef = useRef(0);
  const obsRef = useRef(makeObs());
  const scoreRef = useRef(0);
  const frameRef = useRef(null);
  const pressing = useRef(false);
  const phaseRef = useRef('idle');

  const startTimeRef = useRef(null);
  const emgPeakRef = useRef(0);

  const setPhaseS = (p) => {
    phaseRef.current = p;
    setPhase(p);
    if (p === 'playing' && !startTimeRef.current) startTimeRef.current = Date.now();
  };

  const reset = () => {
    const o = makeObs();
    obsRef.current = o; setObs([...o]);
    runnerYRef.current = 0; setRunnerY(0);
    velRef.current = 0;
    jumpingRef.current = false; setJumping(false);
    emgRef.current = 0; setEmgLevel(0);
    scoreRef.current = 0; setScore(0);
    startTimeRef.current = null; emgPeakRef.current = 0;
    setPhaseS('idle');
  };

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
      if (!last) { last = t; frameRef.current = requestAnimationFrame(tick); return; }
      const dt = Math.min((t - last) / 16.67, 3);
      last = t;

      const emg = emgRef.current;
      if (emg > emgPeakRef.current) emgPeakRef.current = emg;
      const wasJumping = jumpingRef.current;

      if (!wasJumping && emg > THRESHOLD) {
        velRef.current = -11;
        jumpingRef.current = true; setJumping(true);
      }
      if (wasJumping) {
        velRef.current = Math.min(velRef.current + 0.7 * dt, 14);
        const ny = Math.max(-130, Math.min(0, runnerYRef.current + velRef.current * dt));
        runnerYRef.current = ny; setRunnerY(ny);
        if (ny >= 0) { runnerYRef.current = 0; velRef.current = 0; jumpingRef.current = false; setJumping(false); }
      }

      // Move obstacles
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

      // Collision
      const ry = runnerYRef.current;
      for (const o of newObs) {
        const horizOk = RUNNER_X + 22 > o.x && RUNNER_X - 10 < o.x + OBS_W;
        const vertOk = GROUND + ry - 10 < GROUND - 0 && GROUND + ry + 70 > GROUND - o.h;
        if (horizOk && vertOk && ry >= -o.h + 10) { setPhaseS('dead'); return; }
      }

      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [phase]);

  const handlePressIn = () => {
    pressing.current = true;
    if (phaseRef.current === 'idle') setPhaseS('playing');
    const rise = () => {
      if (!pressing.current) return;
      emgRef.current = Math.min(emgRef.current + 0.08, 1);
      setEmgLevel(emgRef.current);
      setTimeout(rise, 24);
    };
    rise();
  };
  const handlePressOut = () => {
    pressing.current = false;
    const fall = () => {
      if (pressing.current) return;
      emgRef.current = Math.max(emgRef.current - 0.06, 0);
      setEmgLevel(emgRef.current);
      if (emgRef.current > 0) setTimeout(fall, 24);
    };
    fall();
  };

  const isJumping = jumping;
  const pct = Math.round(emgLevel * 100);

  return (
    <View style={s.root}>
      <LinearGradient colors={['#E9DFFB', '#FFE5D6']} style={StyleSheet.absoluteFill} />

      {/* Speed lines */}
      {[200, 270, 330, 390].map((y, i) => (
        <View key={i} style={[s.speedLine, { top: y }]} />
      ))}

      {/* Ground */}
      <View style={[s.ground, { top: GROUND }]}>
        <LinearGradient colors={['#B5A6E8', '#8870D8']} style={StyleSheet.absoluteFill} />
        <View style={s.groundTop} />
      </View>

      {/* Obstacles */}
      {obs.map((o, i) => (
        <View key={i} style={[s.obs, { left: o.x, height: o.h, bottom: H - GROUND }]}>
          <View style={s.obsCap} />
        </View>
      ))}

      {/* Runner */}
      <View style={[s.runner, { top: GROUND + runnerY - 80 }]}>
        <Svg width="56" height="80" viewBox="0 0 56 80">
          {!isJumping && <Ellipse cx="28" cy="78" rx="22" ry="3" fill="rgba(0,0,0,0.2)" />}
          <G fill={PH.violet}>
            <Circle cx="28" cy="13" r="9" />
            <Path d={isJumping
              ? 'M20 22 L12 40 L22 40 L16 58 L28 50 L40 40 L44 22 Z'
              : 'M20 22 L14 44 L24 44 L20 62 L28 62 L34 44 L42 22 Z'} />
          </G>
          <Path d={isJumping ? 'M26 28 L42 16' : 'M26 32 L14 36'}
            stroke={PH.violet} strokeWidth="6" strokeLinecap="round" />
        </Svg>
      </View>

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
        </View>
      </View>

      {/* Impulse bar bottom */}
      <View style={s.impBar}>
        <View style={s.impHeader}>
          <Text style={s.impLbl}>ИМПУЛЬС</Text>
          <Text style={[s.impState, { color: isJumping ? PH.violet : PH.inkFaint }]}>
            {isJumping ? '⚡ ПРЫЖОК' : `${pct}%`}
          </Text>
        </View>
        <View style={s.impTrack}>
          <View style={[s.impFill, {
            width: `${pct}%`,
            backgroundColor: isJumping ? PH.violet : PH.violetSoft,
          }]} />
          <View style={[s.impThresh, { left: `${THRESHOLD * 100}%` }]} />
        </View>
        <View style={s.impFooter}>
          <Text style={s.impNote}>покой</Text>
          <Text style={[s.impNote, { color: PH.coral }]}>↑ порог</Text>
          <Text style={s.impNote}>макс</Text>
        </View>
      </View>

      {/* Touch zone */}
      <TouchableOpacity
        style={s.touch}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      />

      {phase === 'idle' && (
        <View style={s.hint}>
          <View style={s.hintDot} />
          <Text style={s.hintText}>Резко зажми экран — прыжок!</Text>
        </View>
      )}

      {phase === 'dead' && (
        <View style={s.overlay}>
          <Text style={s.ovTitle}>ГОТОВО!</Text>
          <Text style={[s.ovScore, { color: PH.violet }]}>{score.toLocaleString()}</Text>
          <Text style={s.ovLabel}>PULSE RUN · ОЧКИ</Text>
          <TouchableOpacity
            style={s.ovBtn}
            onPress={() => {
              const dur = startTimeRef.current ? Math.round((Date.now() - startTimeRef.current) / 1000) : 0;
              const peak = emgPeakRef.current;
              reset();
              navigation.navigate('Results', { score, game: 'Pulse Run', durationSec: dur, emgPeak: peak, emgAvg: peak * 0.7 });
            }}
          >
            <Text style={s.ovBtnTxt}>Результаты →</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.ovSec} onPress={reset}>
            <Text style={s.ovSecTxt}>Заново</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  speedLine: {
    position: 'absolute', left: 0, right: 0, height: 2,
    backgroundColor: `${PH.violet}28`,
  },
  ground: { position: 'absolute', left: 0, right: 0, height: 70, overflow: 'hidden' },
  groundTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: PH.violet },
  obs: {
    position: 'absolute', width: OBS_W,
    backgroundColor: PH.coral, borderTopLeftRadius: 4, borderTopRightRadius: 4,
  },
  obsCap: {
    position: 'absolute', top: -8, left: -4, right: -4, height: 12,
    backgroundColor: PH.coral, borderRadius: 4,
  },
  runner: { position: 'absolute', left: RUNNER_X - 28, width: 56, height: 80 },
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
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 999, borderWidth: 1, borderColor: PH.hair,
  },
  scoreItem: { alignItems: 'center' },
  scoreLbl: { fontFamily: FONTS.mono, fontSize: 9, color: PH.inkFaint, letterSpacing: 1 },
  scoreVal: { fontFamily: FONTS.sansBold, fontSize: 18, lineHeight: 20 },
  impBar: {
    position: 'absolute', bottom: 28, left: 70, right: 70,
    padding: 10, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.95)', borderWidth: 1, borderColor: PH.hair,
    zIndex: 6,
  },
  impHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  impLbl: { fontFamily: FONTS.mono, fontSize: 9, color: PH.inkFaint, letterSpacing: 1 },
  impState: { fontFamily: FONTS.mono, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  impTrack: {
    height: 10, backgroundColor: PH.bgSoft, borderRadius: 5,
    overflow: 'hidden', position: 'relative',
  },
  impFill: { position: 'absolute', top: 0, left: 0, bottom: 0, borderRadius: 5 },
  impThresh: {
    position: 'absolute', top: -2, bottom: -2, width: 2,
    backgroundColor: PH.coral, zIndex: 2,
  },
  impFooter: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: 4,
  },
  impNote: { fontFamily: FONTS.mono, fontSize: 9, color: PH.inkFaint },
  touch: { position: 'absolute', top: 100, left: 0, right: 0, bottom: 120, zIndex: 5 },
  hint: {
    position: 'absolute', bottom: 130, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 999,
    borderWidth: 1, borderColor: PH.hair, zIndex: 8,
  },
  hintDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: PH.violet },
  hintText: { fontFamily: FONTS.sans, fontSize: 12, color: PH.ink },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(245,242,236,0.95)',
    alignItems: 'center', justifyContent: 'center', zIndex: 20,
  },
  ovTitle: { fontFamily: FONTS.mono, fontSize: 12, color: PH.inkFaint, letterSpacing: 1 },
  ovScore: { fontFamily: FONTS.sansBold, fontSize: 64, letterSpacing: -3, lineHeight: 68, marginTop: 4 },
  ovLabel: { fontFamily: FONTS.mono, fontSize: 11, color: PH.inkFaint, letterSpacing: 1, marginBottom: 24 },
  ovBtn: { backgroundColor: PH.ink, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14, marginBottom: 10 },
  ovBtnTxt: { fontFamily: FONTS.sansSemiBold, fontSize: 16, color: '#FFF' },
  ovSec: { padding: 10 },
  ovSecTxt: { fontFamily: FONTS.sans, fontSize: 14, color: PH.inkDim },
});
