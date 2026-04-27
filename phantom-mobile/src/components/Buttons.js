import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { PH, FONTS } from '../constants/theme';

export function PrimaryBtn({ children, onPress, full = false, style, disabled = false, loading = false }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.82}
      disabled={disabled || loading}
      style={[styles.primary, full && styles.full, (disabled || loading) && styles.disabled, style]}
    >
      {loading
        ? <ActivityIndicator color="#FFF" size="small" />
        : <Text style={styles.primaryText}>{children}</Text>
      }
    </TouchableOpacity>
  );
}

export function GhostBtn({ children, onPress, full = false, style, disabled = false }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      disabled={disabled}
      style={[styles.ghost, full && styles.full, disabled && styles.ghostDisabled, style]}
    >
      <Text style={[styles.ghostText, disabled && styles.ghostTextDisabled]}>{children}</Text>
    </TouchableOpacity>
  );
}

export function IconBtn({ children, onPress, style }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.icon, style]}
    >
      {children}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  primary: {
    backgroundColor: PH.ink,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    shadowColor: '#14141E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 7,
    elevation: 5,
  },
  primaryText: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  disabled: {
    backgroundColor: PH.inkFaint,
    shadowOpacity: 0,
    elevation: 0,
  },
  ghost: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PH.hairStrong,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
  },
  ghostDisabled: {
    backgroundColor: PH.bgSoft,
    borderColor: PH.hair,
  },
  ghostText: {
    fontFamily: FONTS.sansMedium,
    fontSize: 14,
    color: PH.ink,
  },
  ghostTextDisabled: {
    color: PH.inkFaint,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: PH.bgAlt,
    borderWidth: 1,
    borderColor: PH.hair,
    alignItems: 'center',
    justifyContent: 'center',
  },
  full: {
    width: '100%',
  },
});
