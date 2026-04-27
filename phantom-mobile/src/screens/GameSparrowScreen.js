import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity, Animated,
} from 'react-native';
import Svg, { Path, Circle, Ellipse, Rect } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { PH, FONTS } from '../constants/theme';

const { width: W, height: H } = Dimensions.get('window');
const GROUND_Y = H - 160;
const THRESHOLD = 0.35;   // легче активировать
const PIPE_W = 58;
const GAP = 240;           // более широкий зазор
const PIPE_SPEED = 2.0;    // медленнее

function makePipes() {
  return [
    { x: W + 80, topH: 110 + Math.random() * 130, scored: false },
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

export default function GameSparrowScreen({ navigation }) {
  const [emgLevel, setEmgLevel] = useState(0);
  const [birdY, setBirdY] = useState(H * 0.42);
  const [pipes, setPipes] = useState(makePipes);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [phase, setPhase] = useState('idle'); // idle | playing | dead

  const emgRef = useRef(0);
  const birdRef = useRef(H * 0.42);
  const velRef = useRef(0);
  const pipesRef = useRef(makePipes());
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const frameRef = useRef(null);
  const pressing = useRef(false);
  const phaseRef = useRef('idle');
  const startTimeRef = useRef(null);
  const emgPeakRef = useRef(0);
  const emgSumRef = useRef(0);
  const emgSamplesRef = useRef(0);

  const setPhaseSync = (p) => {
    phaseRef.current = p;
    setPhase(p);
    if (p === 'playing' && !startTimeRef.current) startTimeRef.current = Date.now();
  };

  const reset = () => {
    const p = makePipes();
    pipesRef.current = p; setPipes([...p]);
    birdRef.current = H * 0.42; setBirdY(H * 0.42);
    velRef.current = 0;
    emgRef.current = 0; setEmgLevel(0);
    startTimeRef.current = null; emgPeakRef.current = 0;
    emgSumRef.current = 0; emgSamplesRef.current = 0;
    scoreRef.current = 0; setScore(0);
    comboRef.current = 0; setCombo(0);
    setPhaseSync('idle');
  };

  useFocusEffect(
    useCallback(() => {
      return () => {
        if (frameRef.current) cancelAnimationFrame(frameRef.current);
        phaseRef.current = 'idle';
      };
    }, [])
  );

  useEffect(() => {
    if (phase !== 'playing') return;
    let last = null;
    const tick = (t) => {
      if (phaseRef.current !== 'playing') return;
      if (!last) { last = t; frameRef.current = requestAnimationFrame(tick); return; }
      const dt = Math.min((t - last) / 16.67, 3);
      last = t;

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

      const newPipes = pipesRef.current.map(p => {
        let nx = p.x - PIPE_SPEED * dt;
        let { topH, scored } = p;
        if (nx < 58 && !scored) {
          scoreRef.current += 10; setScore(scoreRef.current);
          comboRef.current += 1; setCombo(comboRef.current);
          scored = true;
        }
        if (nx < -PIPE_W) {
          nx = W + 60; topH = 100 + Math.random() * 155; scored = false;
        }
        return { x: nx, topH, scored };
      });
      pipesRef.current = newPipes;
      setPipes([...newPipes]);

      // Collision
      const bX = 60, bY = birdRef.current, bR = 22;
      for (const p of newPipes) {
        const overlap = bX + bR > p.x && bX - bR < p.x + PIPE_W;
        if (overlap && (bY - bR < p.topH || bY + bR > p.topH + GAP)) {
          setPhaseSync('dead'); return;
        }
      }
      if (birdRef.current >= GROUND_Y - 48) { setPhaseSync('dead'); return; }

      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [phase]);

  const handlePressIn = () => {
    pressing.current = true;
    if (phaseRef.current === 'idle') setPhaseSync('playing');
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

  return (
    <View style={s.root}>
      <LinearGradient colors={['#DCE8F2', '#F2D998']} style={StyleSheet.absoluteFill} />

      {/* Sun */}
      <View style={s.sun} />
      <Cloud x={40} y={110} size={70} />
      <Cloud x={W - 110} y={190} size={52} />

      {/* Hills */}
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

      {/* Bird */}
      <View style={[s.bird, { top: birdY - 28, left: 32 }]}>
        <Svg width="56" height="56" viewBox="0 0 56 56">
          <Circle cx="28" cy="28" r="26" fill={PH.lime} />
          <Path d="M10 28 Q 18 16, 32 24 L 38 18 L 37 28 Q 32 34, 22 34 Q 14 34, 10 28 Z" fill="#FFF" />
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
            <Text style={[s.scoreVal, { color: PH.lime }]}>{score.toLocaleString()}</Text>
          </View>
          <View style={s.div} />
          <View style={s.scoreItem}>
            <Text style={s.scoreLbl}>СЕРИЯ</Text>
            <Text style={s.scoreVal}>×{combo}</Text>
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

      {/* Touch zone */}
      <TouchableOpacity
        style={s.touch}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      />

      {/* Idle hint */}
      {phase === 'idle' && (
        <View style={s.hint}>
          <View style={s.hintDot} />
          <Text style={s.hintText}>Зажми экран — взлетай, отпусти — падай</Text>
        </View>
      )}

      {/* Dead overlay */}
      {phase === 'dead' && (
        <View style={s.overlay}>
          <Text style={s.ovTitle}>ГОТОВО!</Text>
          <Text style={s.ovScore}>{score.toLocaleString()}</Text>
          <Text style={s.ovLabel}>SPARROW · ОЧКИ</Text>
          <TouchableOpacity
            style={s.ovBtn}
            onPress={() => {
              const dur = startTimeRef.current ? Math.round((Date.now() - startTimeRef.current) / 1000) : 0;
              const peak = emgPeakRef.current;
              const avg = emgSamplesRef.current > 0 ? emgSumRef.current / emgSamplesRef.current : 0;
              reset();
              navigation.navigate('Results', { score, game: 'Sparrow', durationSec: dur, emgPeak: peak, emgAvg: avg });
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
  sun: {
    position: 'absolute', right: 30, top: 90,
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: '#F4B850',
    shadowColor: '#F4B850', shadowRadius: 20, shadowOpacity: 0.5, elevation: 4,
  },
  hills: {
    position: 'absolute', left: 0, right: 0, height: 120,
    clipPath: undefined, overflow: 'hidden',
  },
  pipe: {
    position: 'absolute', width: PIPE_W,
    backgroundColor: PH.lime,
  },
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
  },
  scoreItem: { alignItems: 'center' },
  scoreLbl: { fontFamily: FONTS.mono, fontSize: 9, color: PH.inkFaint, letterSpacing: 1 },
  scoreVal: { fontFamily: FONTS.sansBold, fontSize: 18, color: PH.ink, lineHeight: 20 },
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
  emgFill: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: PH.limeBright,
  },
  emgThresh: {
    position: 'absolute', left: -3, right: -3, height: 2,
    backgroundColor: PH.violet,
  },
  emgVal: {
    fontFamily: FONTS.mono, fontSize: 10, color: PH.lime, marginTop: 6,
    backgroundColor: 'rgba(255,255,255,0.88)', paddingHorizontal: 5,
    paddingVertical: 2, borderRadius: 999, fontVariant: ['tabular-nums'],
  },
  touch: {
    position: 'absolute', top: 100, left: 60, right: 0, bottom: 80, zIndex: 5,
  },
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
    backgroundColor: 'rgba(245,242,236,0.95)',
    alignItems: 'center', justifyContent: 'center', zIndex: 20,
  },
  ovTitle: {
    fontFamily: FONTS.mono, fontSize: 12, color: PH.inkFaint, letterSpacing: 1,
  },
  ovScore: {
    fontFamily: FONTS.sansBold, fontSize: 64, color: PH.lime,
    letterSpacing: -3, lineHeight: 68, marginTop: 4,
  },
  ovLabel: {
    fontFamily: FONTS.mono, fontSize: 11, color: PH.inkFaint,
    letterSpacing: 1, marginBottom: 24,
  },
  ovBtn: {
    backgroundColor: PH.ink, paddingHorizontal: 28, paddingVertical: 14,
    borderRadius: 14, marginBottom: 10,
  },
  ovBtnTxt: { fontFamily: FONTS.sansSemiBold, fontSize: 16, color: '#FFF' },
  ovSec: { padding: 10 },
  ovSecTxt: { fontFamily: FONTS.sans, fontSize: 14, color: PH.inkDim },
});
