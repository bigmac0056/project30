import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { PH, FONTS } from '../constants/theme';
import { PrimaryBtn } from '../components/Buttons';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Введите email и пароль');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (e) {
      setError(e.message || 'Неверный email или пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={s.container}>
          <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
            <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <Path d="M14 6l-6 6 6 6" stroke={PH.ink} strokeWidth="2.4" strokeLinecap="round" />
            </Svg>
          </TouchableOpacity>

          <Text style={s.title}>Войти</Text>
          <Text style={s.subtitle}>Прогресс загрузится автоматически</Text>

          <View style={s.form}>
            <View style={s.fieldWrap}>
              <Text style={s.label}>Email</Text>
              <TextInput
                style={s.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@email.com"
                placeholderTextColor={PH.inkFaint}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <View style={s.fieldWrap}>
              <Text style={s.label}>Пароль</Text>
              <TextInput
                style={s.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={PH.inkFaint}
                secureTextEntry
              />
            </View>
          </View>

          {error ? <Text style={s.error}>{error}</Text> : null}

          <PrimaryBtn full onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : 'Войти →'}
          </PrimaryBtn>

          <TouchableOpacity style={s.link} onPress={() => navigation.navigate('Register')}>
            <Text style={s.linkTxt}>НЕТ АККАУНТА → ЗАРЕГИСТРИРОВАТЬСЯ</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PH.bg },
  container: { flex: 1, paddingHorizontal: 28, paddingBottom: 40, paddingTop: 12 },
  back: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: PH.bgSoft, borderWidth: 1, borderColor: PH.hair,
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  title: {
    fontFamily: FONTS.sansBold, fontSize: 42,
    letterSpacing: -2, lineHeight: 44, color: PH.ink, marginBottom: 10,
  },
  subtitle: {
    fontFamily: FONTS.sans, fontSize: 15, color: PH.inkDim,
    lineHeight: 22, marginBottom: 28,
  },
  form: { gap: 14, marginBottom: 18, flex: 0 },
  fieldWrap: {},
  label: {
    fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1,
    color: PH.inkFaint, marginBottom: 6, textTransform: 'uppercase',
  },
  input: {
    backgroundColor: PH.bgAlt, borderWidth: 1, borderColor: PH.hair,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13,
    fontFamily: FONTS.sans, fontSize: 15, color: PH.ink,
  },
  error: {
    fontFamily: FONTS.sans, fontSize: 13, color: PH.coral,
    marginBottom: 14, textAlign: 'center',
  },
  link: { alignItems: 'center', marginTop: 14 },
  linkTxt: { fontFamily: FONTS.mono, fontSize: 11, color: PH.inkFaint, letterSpacing: 0.6 },
});
