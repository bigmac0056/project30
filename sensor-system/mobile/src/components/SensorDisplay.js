/**
 * SensorDisplay.js  (React Native)
 * ──────────────────────────────────
 * Live numeric readout + animated bar meter.
 * Drop-in for any screen; hook useSensor() and pass the result here.
 */

import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Easing,
} from 'react-native';

export default function SensorDisplay({ sensorData, deviceConnected }) {
  // Animate the bar width
  const barAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!sensorData) return;
    const norm = typeof sensorData.norm === 'number'
      ? sensorData.norm
      : (sensorData.ecg ?? 0) / 1023;

    Animated.timing(barAnim, {
      toValue        : norm,
      duration       : 80,
      easing         : Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [sensorData]);

  if (!deviceConnected) {
    return (
      <View style={s.placeholder}>
        <Text style={s.placeholderTxt}>Waiting for Arduino …</Text>
      </View>
    );
  }

  const norm    = sensorData?.norm   ?? 0;
  const raw     = sensorData?.ecg    ?? '—';
  const voltage = sensorData?.v      ?? '—';
  const barPct  = Math.round(norm * 100);
  const isHigh  = norm > 0.75;

  const barWidth = barAnim.interpolate({
    inputRange : [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={s.card}>
      {/* Numeric stats */}
      <View style={s.statsRow}>
        <Stat label="RAW ADC" value={String(raw)} />
        <Stat label="NORM"    value={`${barPct}%`} />
        <Stat
          label="VOLTAGE"
          value={typeof voltage === 'number' ? `${voltage.toFixed(2)} V` : '—'}
        />
      </View>

      {/* Bar meter */}
      <View style={s.barBg}>
        <Animated.View
          style={[
            s.barFill,
            { width: barWidth, backgroundColor: isHigh ? '#FF6B6B' : '#A8CC5C' },
          ]}
        />
      </View>

      {/* Text label */}
      <Text style={s.barlabel}>
        Signal strength: {barPct}%
        {isHigh ? '  ⚠ HIGH' : ''}
      </Text>
    </View>
  );
}

function Stat({ label, value }) {
  return (
    <View style={s.statBox}>
      <Text style={s.statLabel}>{label}</Text>
      <Text style={s.statValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  placeholder: {
    padding      : 32,
    borderRadius : 12,
    borderWidth  : 1,
    borderStyle  : 'dashed',
    borderColor  : '#333',
    alignItems   : 'center',
  },
  placeholderTxt: { color: '#555', fontSize: 13 },

  card: {
    backgroundColor: '#12121A',
    borderRadius   : 16,
    padding        : 18,
    borderWidth    : 1,
    borderColor    : '#1E1E28',
    gap            : 14,
  },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statBox : { alignItems: 'center' },
  statLabel: { fontSize: 9, color: '#666', letterSpacing: 1, marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: '800', color: '#fff', fontVariant: ['tabular-nums'] },

  barBg: {
    height       : 12,
    backgroundColor: '#1E1E28',
    borderRadius : 6,
    overflow     : 'hidden',
  },
  barFill: { height: '100%', borderRadius: 6 },
  barlabel: { fontSize: 11, color: '#555', textAlign: 'center' },
});
