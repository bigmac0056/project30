/**
 * DeviceStatus.js  (React Native)
 * ─────────────────────────────────
 * Status pill row shown at the top of any screen that uses the sensor.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function DeviceStatus({ wsConnected, deviceConnected }) {
  return (
    <View style={s.row}>
      <StatusPill
        label={wsConnected ? 'Backend ●' : 'Backend ○'}
        active={wsConnected}
      />
      <StatusPill
        label={deviceConnected ? 'Arduino ●' : 'Arduino ○'}
        active={deviceConnected}
      />
    </View>
  );
}

function StatusPill({ label, active }) {
  return (
    <View style={[s.pill, active ? s.pillActive : s.pillInactive]}>
      <Text style={[s.pillText, active ? s.pillTextActive : s.pillTextInactive]}>
        {label}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  row          : { flexDirection: 'row', gap: 8, marginBottom: 16 },
  pill         : { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  pillActive   : { backgroundColor: 'rgba(168,204,92,0.15)', borderWidth: 1, borderColor: '#A8CC5C' },
  pillInactive : { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: '#333' },
  pillText     : { fontSize: 12, fontWeight: '600', letterSpacing: 0.4 },
  pillTextActive  : { color: '#A8CC5C' },
  pillTextInactive: { color: '#555' },
});
