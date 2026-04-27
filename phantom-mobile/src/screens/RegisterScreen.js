import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { PH, FONTS } from '../constants/theme';
import { PrimaryBtn } from '../components/Buttons';
import { useAuth } from '../context/AuthContext';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [amputationLevel, setAmputationLevel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Заполните все обязательные поля');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register(email.trim(), name.trim(), password, amputationLevel.trim());
      navigation.reset({ index: 0, routes: [{ name: 'Calibration' }] });
    } catch (e) {
      setError(e.message || 'Ошибка регистрации');
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
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          {/* Back */}
          <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
            <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <Path d="M14 6l-6 6 6 6" stroke={PH.ink} strokeWidth="2.4" strokeLinecap="round" />
            </Svg>
          </TouchableOpacity>

          <Text style={s.title}>Создать{'\n'}аккаунт</Text>
          <Text style={s.subtitle}>Прогресс сохраняется и синхронизируется на всех устройствах</Text>

          {/* Fields */}
          <View style={s.form}>
            <Field label="Имя *" value={name} onChangeText={setName} placeholder="Алмас" />
            <Field label="Email *" value={email} onChangeText={setEmail} placeholder="you@email.com"
              keyboardType="email-address" autoCapitalize="none" />
            <Field label="Пароль *" value={password} onChangeText={setPassword}
              placeholder="Минимум 6 символов" secureTextEntry />
            <Field label="Уровень ампутации" value={amputationLevel} onChangeText={setAmputationLevel}
              placeholder="напр. правое предплечье, ⅓ верхняя" />
          </View>

          {error ? <Text style={s.error}>{error}</Text> : null}

          <PrimaryBtn full onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : 'Создать аккаунт →'}
          </PrimaryBtn>

          <TouchableOpacity style={s.link} onPress={() => navigation.navigate('Login')}>
            <Text style={s.linkTxt}>УЖЕ ЕСТЬ АККАУНТ → ВОЙТИ</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, ...props }) {
  return (
    <View style={s.fieldWrap}>
      <Text style={s.label}>{label}</Text>
      <TextInput style={s.input} placeholderTextColor={PH.inkFaint} {...props} />
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PH.bg },
  scroll: { paddingHorizontal: 28, paddingBottom: 40, paddingTop: 12 },
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
  form: { gap: 14, marginBottom: 18 },
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
