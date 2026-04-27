import React from 'react';
import { View, StyleSheet } from 'react-native';
import { PH } from '../constants/theme';

export default function Card({ children, style, padded = true, raised = false }) {
  return (
    <View
      style={[
        styles.base,
        padded && styles.padded,
        raised && styles.raised,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: PH.bgAlt,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PH.hair,
    overflow: 'hidden',
  },
  padded: {
    padding: 18,
  },
  raised: {
    shadowColor: '#14141E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
});
