import React from 'react';
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { PH, FONTS } from '../constants/theme';
import EMGWave from '../components/EMGWave';
import ArmIllustration from '../components/ArmIllustration';
import Pill from '../components/Pill';
import { PrimaryBtn } from '../components/Buttons';

const { width, height } = Dimensions.get('window');

export default function OnboardingScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Background EMG wave */}
        <View style={styles.waveBg} pointerEvents="none">
          <EMGWave width={width} height={height * 0.6} intensity={1} density={0.8} color={PH.lime} glow={false} />
        </View>

        <View style={styles.content}>
          <Pill style={styles.pill}>EMG · v0.4</Pill>

          <Text style={styles.title}>
            Phantom<Text style={styles.dot}>.</Text>
          </Text>

          <Text style={styles.subtitle}>
            Тренируй мышцы культи в{' '}игре.{'\n'}Подготовь руку к{' '}бионическому протезу.
          </Text>

          <View style={styles.armWrap}>
            <ArmIllustration width={Math.min(width - 60, 300)} active />
          </View>
        </View>

        <View style={styles.footer}>
          <PrimaryBtn full onPress={() => navigation.navigate('Register')}>
            Начать
          </PrimaryBtn>
          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginText}>УЖЕ ЕСТЬ АККАУНТ → ВОЙТИ</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PH.bg },
  container: { flex: 1, paddingHorizontal: 28, paddingBottom: 40 },
  waveBg: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    opacity: 0.18,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  pill: { marginBottom: 24 },
  title: {
    fontFamily: FONTS.sansBold,
    fontSize: 56,
    letterSpacing: -2.5,
    lineHeight: 52,
    color: PH.ink,
  },
  dot: { color: PH.lime },
  subtitle: {
    marginTop: 18,
    fontFamily: FONTS.sans,
    fontSize: 17,
    lineHeight: 26,
    color: PH.inkDim,
    maxWidth: 300,
  },
  armWrap: {
    marginTop: 28,
    alignItems: 'center',
  },
  footer: {},
  loginLink: {
    alignItems: 'center',
    marginTop: 14,
  },
  loginText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: PH.inkFaint,
    letterSpacing: 0.6,
  },
});
