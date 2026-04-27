import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Switch,
  TouchableOpacity, Alert, TextInput, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PH, FONTS } from '../constants/theme';
import Card from '../components/Card';
import { GhostBtn, PrimaryBtn } from '../components/Buttons';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

function SettingRow({ label, value, children, onPress }) {
  const Wrap = onPress ? TouchableOpacity : View;
  return (
    <Wrap onPress={onPress} activeOpacity={0.7} style={s.row}>
      <View style={s.rowTop}>
        <Text style={s.rowLabel}>{label}</Text>
        {value !== undefined && !React.isValidElement(value) && (
          <Text style={s.rowValue}>{value}</Text>
        )}
        {React.isValidElement(value) && value}
      </View>
      {children}
    </Wrap>
  );
}

function DifficultyToggle({ value, onChange }) {
  return (
    <View style={s.diffWrap}>
      {[
        { key: 'beginner', label: 'Новичок' },
        { key: 'advanced', label: 'Продвинутый' },
      ].map(({ key, label }) => (
        <TouchableOpacity
          key={key}
          style={[s.diffBtn, value === key && s.diffBtnActive]}
          onPress={() => onChange(key)}
        >
          <Text style={[s.diffTxt, value === key && s.diffTxtActive]}>{label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function SettingsScreen({ navigation }) {
  const { user, logout, updateUser } = useAuth();
  const [sound, setSound] = useState(true);
  const [reminders, setReminders] = useState(true);
  const [difficulty, setDifficulty] = useState('beginner');
  const [editVisible, setEditVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAmp, setEditAmp] = useState('');
  const [editWeeks, setEditWeeks] = useState('');
  const [saving, setSaving] = useState(false);

  // Load saved preferences
  useEffect(() => {
    AsyncStorage.getItem('difficulty').then(v => { if (v) setDifficulty(v); });
    AsyncStorage.getItem('sound').then(v => { if (v !== null) setSound(v === 'true'); });
    AsyncStorage.getItem('reminders').then(v => { if (v !== null) setReminders(v === 'true'); });
  }, []);

  const handleDifficulty = async (val) => {
    setDifficulty(val);
    await AsyncStorage.setItem('difficulty', val);
  };

  const handleSound = async (val) => {
    setSound(val);
    await AsyncStorage.setItem('sound', String(val));
  };

  const handleReminders = async (val) => {
    setReminders(val);
    await AsyncStorage.setItem('reminders', String(val));
  };

  const openEdit = () => {
    setEditName(user?.name ?? '');
    setEditAmp(user?.amputation_level ?? '');
    setEditWeeks(String(user?.weeks_to_fitting ?? 16));
    setEditVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) { Alert.alert('Ошибка', 'Введите имя'); return; }
    setSaving(true);
    try {
      const updated = await api.updateMe({
        name: editName.trim(),
        amputation_level: editAmp.trim(),
        weeks_to_fitting: parseInt(editWeeks) || 16,
      });
      updateUser(updated);
      setEditVisible(false);
    } catch (e) {
      Alert.alert('Ошибка', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Выйти из аккаунта?',
      'Прогресс сохранён на сервере — можно войти снова.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Выйти', style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>Настройки</Text>

        {/* Profile card */}
        <Card raised style={s.profileCard}>
          <View style={s.profileRow}>
            <View style={s.avatar}>
              <Text style={s.avatarTxt}>{(user?.name?.[0] ?? '?').toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.profileName}>{user?.name ?? '—'}</Text>
              <Text style={s.profileEmail}>{user?.email ?? '—'}</Text>
              {user?.amputation_level ? (
                <Text style={s.profileNote}>{user.amputation_level}</Text>
              ) : (
                <Text style={[s.profileNote, { color: PH.inkFaint }]}>Уровень ампутации не указан</Text>
              )}
            </View>
            <TouchableOpacity style={s.editBtn} onPress={openEdit}>
              <Text style={s.editBtnTxt}>Изменить</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Sensor */}
        <Card raised style={s.sensorCard}>
          <View style={s.sensorRow}>
            <View style={s.sensorDot} />
            <View style={{ flex: 1 }}>
              <Text style={s.sensorName}>Phantom Sensor</Text>
              <Text style={s.sensorMeta}>Симуляция · нажми на экран в игре</Text>
            </View>
            <GhostBtn
              style={s.calibBtn}
              onPress={() => navigation.navigate('Calibration')}
            >
              Откалибровать
            </GhostBtn>
          </View>
        </Card>

        {/* Difficulty */}
        <SettingRow label="Сложность игр">
          <DifficultyToggle value={difficulty} onChange={handleDifficulty} />
        </SettingRow>

        {/* Sound */}
        <SettingRow
          label="Звук и вибрация"
          value={
            <Switch
              value={sound}
              onValueChange={handleSound}
              trackColor={{ true: PH.lime, false: PH.bgSoft }}
              thumbColor="#FFF"
            />
          }
        />

        {/* Reminders */}
        <SettingRow
          label="Ежедневные напоминания"
          value={
            <Switch
              value={reminders}
              onValueChange={handleReminders}
              trackColor={{ true: PH.lime, false: PH.bgSoft }}
              thumbColor="#FFF"
            />
          }
        />

        {/* App info */}
        <View style={s.infoSection}>
          <Text style={s.infoLbl}>ПРИЛОЖЕНИЕ</Text>
          <SettingRow label="Версия" value="1.0.0" />
          <SettingRow label="Протокол EMG" value="v0.4" />
          <SettingRow label="Недель до примерки" value={`${user?.weeks_to_fitting ?? '—'}`} />
        </View>

        {/* Actions */}
        <SettingRow label="Отчёт для врача" onPress={() => navigation.navigate('DoctorPDF')}>
        </SettingRow>

        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <Text style={s.logoutTxt}>Выйти из аккаунта</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={editVisible} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <SafeAreaView style={s.modal}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Редактировать профиль</Text>
              <TouchableOpacity onPress={() => setEditVisible(false)} style={s.modalClose}>
                <Text style={s.modalCloseTxt}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={s.modalContent} keyboardShouldPersistTaps="handled">
              <ModalField label="Имя" value={editName} onChangeText={setEditName} placeholder="Ваше имя" />
              <ModalField
                label="Уровень ампутации"
                value={editAmp}
                onChangeText={setEditAmp}
                placeholder="напр. правое предплечье, ⅓ верхняя"
              />
              <ModalField
                label="Недель до примерки протеза"
                value={editWeeks}
                onChangeText={setEditWeeks}
                placeholder="16"
                keyboardType="number-pad"
              />
              <PrimaryBtn full onPress={handleSaveProfile} loading={saving} disabled={saving}>
                Сохранить
              </PrimaryBtn>
              <GhostBtn full style={{ marginTop: 10 }} onPress={() => setEditVisible(false)}>
                Отмена
              </GhostBtn>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function ModalField({ label, ...props }) {
  return (
    <View style={s.fieldWrap}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput style={s.fieldInput} placeholderTextColor={PH.inkFaint} {...props} />
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PH.bg },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  title: { fontFamily: FONTS.sansBold, fontSize: 30, letterSpacing: -1, color: PH.ink, marginTop: 4, marginBottom: 14 },

  profileCard: { padding: 16, marginBottom: 10 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: PH.lime, alignItems: 'center', justifyContent: 'center',
  },
  avatarTxt: { fontFamily: FONTS.sansBold, fontSize: 20, color: PH.bg },
  profileName: { fontFamily: FONTS.sansSemiBold, fontSize: 15, color: PH.ink },
  profileEmail: { fontFamily: FONTS.mono, fontSize: 11, color: PH.inkDim, marginTop: 1 },
  profileNote: { fontFamily: FONTS.sans, fontSize: 11, color: PH.inkDim, marginTop: 2 },
  editBtn: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 8, borderWidth: 1, borderColor: PH.hairStrong,
    backgroundColor: PH.bgSoft,
  },
  editBtnTxt: { fontFamily: FONTS.sansMedium, fontSize: 12, color: PH.ink },

  sensorCard: { padding: 16, marginBottom: 10 },
  sensorRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sensorDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: PH.limeBright,
    shadowColor: PH.limeBright, shadowOpacity: 0.8, shadowRadius: 5, elevation: 3,
  },
  sensorName: { fontFamily: FONTS.sansSemiBold, fontSize: 14, color: PH.ink },
  sensorMeta: { fontFamily: FONTS.mono, fontSize: 10, color: PH.inkDim, marginTop: 2 },
  calibBtn: { paddingHorizontal: 10, paddingVertical: 7 },

  row: {
    padding: 14, borderRadius: 14,
    backgroundColor: PH.bgAlt, borderWidth: 1, borderColor: PH.hair,
    marginBottom: 10,
  },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { fontFamily: FONTS.sansMedium, fontSize: 14, color: PH.ink },
  rowValue: { fontFamily: FONTS.mono, fontSize: 12, color: PH.lime, fontWeight: '600' },

  diffWrap: {
    flexDirection: 'row', backgroundColor: PH.bgSoft,
    borderRadius: 10, padding: 4, marginTop: 10,
  },
  diffBtn: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 8 },
  diffBtnActive: { backgroundColor: PH.ink },
  diffTxt: { fontFamily: FONTS.sansSemiBold, fontSize: 13, color: PH.inkDim },
  diffTxtActive: { color: '#FFF' },

  infoSection: { marginTop: 4 },
  infoLbl: { fontFamily: FONTS.mono, fontSize: 10, color: PH.inkFaint, letterSpacing: 1, marginBottom: 8 },

  logoutBtn: {
    marginTop: 14, padding: 16, borderRadius: 14,
    backgroundColor: '#FFF0EE', borderWidth: 1, borderColor: `${PH.coral}44`,
    alignItems: 'center',
  },
  logoutTxt: { fontFamily: FONTS.sansSemiBold, fontSize: 15, color: PH.coral },

  // Modal
  modal: { flex: 1, backgroundColor: PH.bg },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: PH.hair,
  },
  modalTitle: { fontFamily: FONTS.sansSemiBold, fontSize: 17, color: PH.ink },
  modalClose: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  modalCloseTxt: { fontFamily: FONTS.sans, fontSize: 18, color: PH.inkDim },
  modalContent: { padding: 20, gap: 0 },
  fieldWrap: { marginBottom: 16 },
  fieldLabel: { fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1, color: PH.inkFaint, marginBottom: 6, textTransform: 'uppercase' },
  fieldInput: {
    backgroundColor: PH.bgAlt, borderWidth: 1, borderColor: PH.hair,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13,
    fontFamily: FONTS.sans, fontSize: 15, color: PH.ink,
  },
});
