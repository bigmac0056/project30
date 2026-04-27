import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Line, Path, Rect } from 'react-native-svg';
import { PH, FONTS } from '../constants/theme';
import Card from '../components/Card';
import Pill from '../components/Pill';
import EMGWave from '../components/EMGWave';
import ArmIllustration from '../components/ArmIllustration';
import { PrimaryBtn, GhostBtn } from '../components/Buttons';
import { api } from '../services/api';

function StepDots({ current = 2, total = 3 }) {
  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{
            width: 24, height: 3, borderRadius: 2,
            backgroundColor: i < current ? PH.lime : PH.hair,
          }}
        />
      ))}
    </View>
  );
}

export default function CalibrationScreen({ navigation }) {
  const [connected] = useState(true);
  const [pressing, setPressing] = useState(false);
  const [emgLevel, setEmgLevel] = useState(0);
  const [threshold, setThreshold] = useState(0.42);
  const [saving, setSaving] = useState(false);
  const [calibrated, setCalibrated] = useState(false);

  const emgRef = useRef(0);
  const pressingRef = useRef(false);
  const peakRef = useRef(0);

  // Simulate EMG on press
  useEffect(() => {
    let timer;
    const rise = () => {
      if (!pressingRef.current) return;
      emgRef.current = Math.min(emgRef.current + 0.06, 1);
      setEmgLevel(emgRef.current);
      if (emgRef.current > peakRef.current) peakRef.current = emgRef.current;
      timer = setTimeout(rise, 30);
    };
    const fall = () => {
      if (pressingRef.current) return;
      emgRef.current = Math.max(emgRef.current - 0.05, 0);
      setEmgLevel(emgRef.current);
      if (emgRef.current > 0) timer = setTimeout(fall, 30);
    };
    if (pressing) { pressingRef.current = true; rise(); }
    else { pressingRef.current = false; fall(); }
    return () => clearTimeout(timer);
  }, [pressing]);

  // Set threshold at 60% of peak
  const handleMaxPress = () => {
    if (peakRef.current > 0.1) {
      const computed = Math.round(peakRef.current * 0.6 * 100) / 100;
      setThreshold(computed);
      setCalibrated(true);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.createSession({
        game: '_calibration',
        score: 0,
        duration_sec: 0,
        emg_peak: peakRef.current || threshold,
        emg_avg: threshold,
        activation_score: 0,
        precision_score: 0,
        dosing_score: 0,
      });
    } catch {/* ok if fails, just navigate */}
    setSaving(false);
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  };

  const emgPct = Math.round(emgLevel * 100);
  const thresholdPct = Math.round(threshold * 100);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.stepRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <Path d="M14 6l-6 6 6 6" stroke={PH.ink} strokeWidth="2.4" strokeLinecap="round" />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.stepLabel}>ШАГ 02 / 03</Text>
          <StepDots current={2} total={3} />
        </View>

        <Text style={styles.title}>Калибровка{'\n'}сигнала</Text>
        <Text style={styles.subtitle}>
          Зажми экран — симулируй сигнал мышцы. Подержи максимальное напряжение, затем отпусти.
        </Text>

        {/* Sensor card */}
        <Card raised style={styles.sensorCard}>
          <View style={styles.sensorHeader}>
            <View style={styles.sensorLeft}>
              <View style={[styles.dot, { backgroundColor: PH.limeBright }]} />
              <Text style={styles.sensorName}>Phantom Sensor</Text>
            </View>
            <Pill color={PH.lime}>{connected ? 'Подключён' : 'Поиск...'}</Pill>
          </View>
          <View style={styles.armWrap}>
            <ArmIllustration width={260} active={emgLevel > 0.1} />
          </View>
        </Card>

        {/* Live EMG meter */}
        <Card raised style={styles.signalCard}>
          <View style={styles.signalHeader}>
            <Text style={styles.signalLabel}>СИГНАЛ EMG</Text>
            <Text style={styles.signalValue}>{(emgLevel * 0.74 + 0.1).toFixed(2)} mV</Text>
          </View>

          {/* Bar meter */}
          <View style={styles.meterWrap}>
            <View style={styles.meterTrack}>
              <View style={[styles.meterFill, { width: `${emgPct}%`, backgroundColor: emgLevel > 0.7 ? PH.lime : emgLevel > 0.3 ? PH.limeBright : PH.bgSoft }]} />
              {/* Threshold line */}
              <View style={[styles.threshLine, { left: `${thresholdPct}%` }]} />
            </View>
            <View style={styles.meterLabels}>
              <Text style={styles.meterLbl}>0</Text>
              <View style={{ flex: 1 }} />
              <Text style={[styles.meterLbl, { color: PH.violet }]}>ПОРОГ {thresholdPct}%</Text>
              <View style={{ flex: 1 }} />
              <Text style={styles.meterLbl}>MAX</Text>
            </View>
          </View>

          <EMGWave width={280} height={48} intensity={emgLevel} density={1.1} />

          {calibrated && (
            <View style={styles.calibOk}>
              <Text style={styles.calibOkTxt}>✓ Порог установлен: {thresholdPct}%  пик: {Math.round(peakRef.current * 100)}%</Text>
            </View>
          )}
        </Card>

        {/* Instructions */}
        <Card padded={false} style={styles.instrCard}>
          <TouchableOpacity
            style={styles.instrBtn}
            onPressIn={() => setPressing(true)}
            onPressOut={() => { setPressing(false); handleMaxPress(); }}
            activeOpacity={1}
          >
            <View style={[styles.instrDot, { backgroundColor: pressing ? PH.lime : PH.bgSoft, borderColor: pressing ? PH.lime : PH.hairStrong }]}>
              <Text style={[styles.instrDotTxt, { color: pressing ? PH.bg : PH.inkFaint }]}>
                {pressing ? `${emgPct}%` : '▼'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.instrTitle}>
                {pressing ? 'Держи максимальное усилие...' : 'Зажми и держи'}
              </Text>
              <Text style={styles.instrSub}>
                {calibrated ? `Порог: ${thresholdPct}% · Нажми ещё раз для новой калибровки` : 'Система рассчитает порог автоматически'}
              </Text>
            </View>
          </TouchableOpacity>
        </Card>

        <View style={styles.btnWrap}>
          <PrimaryBtn
            full
            onPress={handleSave}
            loading={saving}
            disabled={saving}
          >
            {calibrated ? `Сохранить порог ${thresholdPct}% →` : 'Пропустить →'}
          </PrimaryBtn>
          {calibrated && (
            <GhostBtn full style={{ marginTop: 10 }} onPress={() => {
              peakRef.current = 0; setCalibrated(false); setEmgLevel(0); emgRef.current = 0;
            }}>
              Калибровать заново
            </GhostBtn>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PH.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 32 },
  stepRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 14, marginTop: 8, gap: 12,
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: PH.bgSoft, borderWidth: 1, borderColor: PH.hair,
    alignItems: 'center', justifyContent: 'center',
  },
  stepLabel: { fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 0.8, color: PH.inkDim },
  title: {
    fontFamily: FONTS.sansBold, fontSize: 30,
    letterSpacing: -1, lineHeight: 32, color: PH.ink, marginBottom: 8,
  },
  subtitle: { fontFamily: FONTS.sans, fontSize: 14, lineHeight: 21, color: PH.inkDim, marginBottom: 16 },

  sensorCard: { padding: 0, marginBottom: 14 },
  sensorHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14, borderBottomWidth: 1, borderBottomColor: PH.hair,
  },
  sensorLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  sensorName: { fontFamily: FONTS.sansSemiBold, fontSize: 14, color: PH.ink },
  armWrap: { padding: 14, alignItems: 'center', backgroundColor: PH.bgSoft },

  signalCard: { padding: 14, marginBottom: 12 },
  signalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 },
  signalLabel: { fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1, color: PH.inkDim },
  signalValue: { fontFamily: FONTS.mono, fontSize: 11, color: PH.lime, fontVariant: ['tabular-nums'] },

  meterWrap: { marginBottom: 12 },
  meterTrack: {
    height: 12, backgroundColor: PH.bgSoft, borderRadius: 6,
    overflow: 'hidden', position: 'relative', marginBottom: 6,
  },
  meterFill: { height: '100%', borderRadius: 6, position: 'absolute', left: 0, top: 0 },
  threshLine: {
    position: 'absolute', top: -3, bottom: -3, width: 2,
    backgroundColor: PH.violet, borderRadius: 1,
  },
  meterLabels: { flexDirection: 'row', alignItems: 'center' },
  meterLbl: { fontFamily: FONTS.mono, fontSize: 9, color: PH.inkFaint, letterSpacing: 0.8 },

  calibOk: {
    marginTop: 10, padding: 8, borderRadius: 8,
    backgroundColor: PH.limeSoft,
  },
  calibOkTxt: { fontFamily: FONTS.mono, fontSize: 10, color: PH.lime, letterSpacing: 0.5 },

  instrCard: { marginBottom: 16, overflow: 'hidden' },
  instrBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16,
  },
  instrDot: {
    width: 56, height: 56, borderRadius: 28,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
  },
  instrDotTxt: { fontFamily: FONTS.sansBold, fontSize: 14 },
  instrTitle: { fontFamily: FONTS.sansSemiBold, fontSize: 15, color: PH.ink, marginBottom: 4 },
  instrSub: { fontFamily: FONTS.sans, fontSize: 12, color: PH.inkDim, lineHeight: 17 },

  btnWrap: { marginTop: 4 },
});
