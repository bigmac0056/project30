import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PH, FONTS } from '../constants/theme';

export default function Pill({ children, color = PH.lime, filled = false, style }) {
  const bg = filled ? color : (color === PH.lime ? PH.limeSoft : `${color}22`);
  const tc = filled ? '#FFFFFF' : color;
  const bc = filled ? 'transparent' : `${color}33`;

  return (
    <View style={[styles.base, { backgroundColor: bg, borderColor: bc }, style]}>
      <Text style={[styles.text, { color: tc }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  text: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
