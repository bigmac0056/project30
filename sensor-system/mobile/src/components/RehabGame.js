/**
 * RehabGame.js  (React Native)
 * ──────────────────────────────
 * "Squeeze to lift" rehab game using real Arduino sensor data.
 *
 * Mechanics:
 *   • Sensor norm value (0–1) controls ball height
 *   • A target zone appears at random heights
 *   • Holding the ball in the zone for 2 seconds scores a point
 *   • Without a device: Slider lets therapist demo the mechanic
 *
 * Integration into your existing phantom-mobile:
 *   1. Import useSensor hook
 *   2. Replace the touch/onPressIn simulation with sensorData.norm
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Easing,
  Dimensions, TouchableOpacity, PanResponder,
} from 'react-native';

const { width: SCREEN_W } = Dimensions.get('window');
const GAME_H       = 420;
const BALL_SIZE    = 44;
const ZONE_H       = 80;
const HOLD_MS      = 2000;

export default function RehabGame({ sensorData, deviceConnected }) {
  const [score,   setScore]   = useState(0);
  const [holdPct, setHoldPct] = useState(0);   // 0–100
  const [zoneTop, setZoneTop] = useState(0.35); // 0–1 from top
  const [manualNorm, setManualNorm] = useState(0);

  // Current normalised value as a ref so animation loop can read it sync
  const normRef     = useRef(0);
  const holdStart   = useRef(null);
  const gameLoop    = useRef(null);

  // Animated values
  const ballY  = useRef(new Animated.Value(GAME_H - BALL_SIZE)).current;
  const holdW  = useRef(new Animated.Value(0)).current;

  // ── Update normRef ─────────────────────────────────────────
  useEffect(() => {
    const raw  = deviceConnected ? (sensorData?.norm ?? 0) : manualNorm;
    normRef.current = raw;

    // Move ball: norm=0 → bottom, norm=1 → top
    const targetY = (1 - raw) * (GAME_H - BALL_SIZE);
    Animated.timing(ballY, {
      toValue        : targetY,
      duration       : 80,
      easing         : Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [sensorData, manualNorm, deviceConnected]);

  // ── Zone randomiser ────────────────────────────────────────
  const randomiseZone = () => {
    setZoneTop(0.12 + Math.random() * 0.55);
  };
  useEffect(() => { randomiseZone(); }, []);

  // ── Game tick (60fps via setInterval) ─────────────────────
  useEffect(() => {
    gameLoop.current = setInterval(() => {
      const norm   = normRef.current;
      const ballPy = (1 - norm);                 // 0(top) … 1(bottom)
      const zTop   = zoneTop;
      const zBot   = zoneTop + ZONE_H / GAME_H;
      const inZone = ballPy >= zTop && ballPy <= zBot;

      if (inZone) {
        if (!holdStart.current) holdStart.current = Date.now();
        const elapsed = Date.now() - holdStart.current;
        const pct     = Math.min((elapsed / HOLD_MS) * 100, 100);
        setHoldPct(Math.round(pct));
        Animated.timing(holdW, {
          toValue        : pct / 100,
          duration       : 50,
          useNativeDriver: false,
        }).start();
        if (elapsed >= HOLD_MS) {
          setScore(s => s + 1);
          holdStart.current = null;
          setHoldPct(0);
          holdW.setValue(0);
          randomiseZone();
        }
      } else {
        holdStart.current = null;
        setHoldPct(0);
        Animated.timing(holdW, {
          toValue        : 0,
          duration       : 100,
          useNativeDriver: false,
        }).start();
      }
    }, 50);

    return () => clearInterval(gameLoop.current);
  }, [zoneTop]);

  // ── Demo slider responder ──────────────────────────────────
  const sliderRef    = useRef(null);
  const sliderWidth  = useRef(0);
  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => !deviceConnected,
    onMoveShouldSetPanResponder : () => !deviceConnected,
    onPanResponderGrant : ({ nativeEvent }) => {
      const norm = Math.min(Math.max(nativeEvent.locationX / sliderWidth.current, 0), 1);
      setManualNorm(norm);
    },
    onPanResponderMove : ({ nativeEvent }) => {
      const norm = Math.min(Math.max(nativeEvent.locationX / sliderWidth.current, 0), 1);
      setManualNorm(norm);
    },
  })).current;

  // ── Target zone pixel positions ───────────────────────────
  const zonePxTop = zoneTop * GAME_H;

  const holdBarWidth = holdW.interpolate({
    inputRange : [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={s.wrap}>
      {/* Score */}
      <View style={s.scoreRow}>
        <Text style={s.scoreLbl}>SCORE</Text>
        <Text style={s.scoreVal}>{score}</Text>
      </View>

      {/* Game area */}
      <View style={s.game}>
        {/* Target zone */}
        <View style={[s.zone, { top: zonePxTop, height: ZONE_H }]}>
          <Text style={s.zoneLabel}>TARGET</Text>
        </View>

        {/* Ball */}
        <Animated.View
          style={[s.ball, { transform: [{ translateY: ballY }] }]}
        />
      </View>

      {/* Hold progress */}
      <View style={s.holdBg}>
        <Animated.View style={[s.holdFill, { width: holdBarWidth }]} />
      </View>
      {holdPct > 0 && (
        <Text style={s.holdLabel}>Hold … {holdPct}%</Text>
      )}

      {/* Demo slider */}
      {!deviceConnected && (
        <View style={s.sliderWrap}>
          <Text style={s.sliderLabel}>No device — drag to simulate squeeze</Text>
          <View
            ref={sliderRef}
            style={s.sliderTrack}
            onLayout={e => { sliderWidth.current = e.nativeEvent.layout.width; }}
            {...panResponder.panHandlers}
          >
            <View style={[s.sliderFill, { width: `${manualNorm * 100}%` }]} />
            <View style={[s.sliderThumb, { left: `${manualNorm * 100}%` }]} />
          </View>
        </View>
      )}
    </View>
  );
}

const BALL_COLOR  = '#7B8BFF';
const ZONE_COLOR  = 'rgba(168,204,92,0.18)';
const ZONE_BORDER = '#A8CC5C';

const s = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 8, gap: 12 },

  scoreRow  : { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  scoreLbl  : { fontSize: 11, color: '#666', letterSpacing: 2 },
  scoreVal  : { fontSize: 38, fontWeight: '800', color: '#fff' },

  game: {
    width           : SCREEN_W - 40,
    height          : GAME_H,
    backgroundColor : '#0E0E14',
    borderRadius    : 18,
    overflow        : 'hidden',
    borderWidth     : 1,
    borderColor     : '#1E1E28',
  },

  zone: {
    position        : 'absolute',
    left            : 0,
    right           : 0,
    backgroundColor : ZONE_COLOR,
    borderTopWidth  : 2,
    borderBottomWidth: 2,
    borderColor     : ZONE_BORDER,
    alignItems      : 'center',
    justifyContent  : 'flex-start',
    paddingTop      : 4,
  },
  zoneLabel: { fontSize: 10, color: ZONE_BORDER, letterSpacing: 1, fontWeight: '700' },

  ball: {
    position        : 'absolute',
    left            : (SCREEN_W - 40) / 2 - BALL_SIZE / 2,
    width           : BALL_SIZE,
    height          : BALL_SIZE,
    borderRadius    : BALL_SIZE / 2,
    backgroundColor : BALL_COLOR,
    shadowColor     : BALL_COLOR,
    shadowOpacity   : 0.7,
    shadowRadius    : 12,
    elevation       : 8,
  },

  holdBg: {
    width           : SCREEN_W - 40,
    height          : 8,
    backgroundColor : '#1E1E28',
    borderRadius    : 4,
    overflow        : 'hidden',
  },
  holdFill: {
    height          : '100%',
    backgroundColor : '#A8CC5C',
    borderRadius    : 4,
  },
  holdLabel: { fontSize: 12, color: '#A8CC5C', fontWeight: '700', letterSpacing: 0.5 },

  sliderWrap  : { width: SCREEN_W - 40, marginTop: 8, gap: 8 },
  sliderLabel : { fontSize: 12, color: '#555', textAlign: 'center' },
  sliderTrack : {
    height          : 20,
    backgroundColor : '#1E1E28',
    borderRadius    : 10,
    overflow        : 'visible',
    justifyContent  : 'center',
  },
  sliderFill  : {
    height          : 20,
    backgroundColor : '#A8CC5C',
    borderRadius    : 10,
  },
  sliderThumb : {
    position        : 'absolute',
    width           : 28,
    height          : 28,
    borderRadius    : 14,
    backgroundColor : '#fff',
    top             : -4,
    marginLeft      : -14,
    shadowColor     : '#000',
    shadowOpacity   : 0.3,
    shadowRadius    : 4,
    elevation       : 4,
  },
});
