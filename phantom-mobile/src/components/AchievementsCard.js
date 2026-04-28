/**
 * AchievementsCard.js
 * ────────────────────
 * Shows a grid of achievement badges with progress bars.
 * Locked achievements are dimmed.
 *
 * Props:
 *   achievements — output of computeAchievements()
 */

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PH, FONTS } from '../constants/theme';

function AchievBadge({ item, onPress }) {
  return (
    <TouchableOpacity
      style={[s.badge, item.unlocked && s.badgeUnlocked]}
      onPress={() => onPress(item)}
      activeOpacity={0.75}
    >
      <Text style={[s.badgeIcon, !item.unlocked && s.locked]}>{item.icon}</Text>
      <View style={s.badgeBar}>
        <View
          style={[
            s.badgeBarFill,
            { width: `${Math.round(item.progressPct * 100)}%`, backgroundColor: item.color },
          ]}
        />
      </View>
      <Text style={[s.badgeTitle, !item.unlocked && s.lockedTxt]} numberOfLines={1}>
        {item.unlocked ? item.title : '???'}
      </Text>
    </TouchableOpacity>
  );
}

export default function AchievementsCard({ achievements = [] }) {
  const [detail, setDetail] = useState(null);
  const unlocked = achievements.filter(a => a.unlocked).length;

  return (
    <View style={s.card}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.label}>ДОСТИЖЕНИЯ</Text>
        <Text style={s.count}>{unlocked}/{achievements.length}</Text>
      </View>

      {/* Grid */}
      <View style={s.grid}>
        {achievements.map((item) => (
          <AchievBadge key={item.id} item={item} onPress={setDetail} />
        ))}
      </View>

      {/* Detail modal */}
      <Modal
        visible={!!detail}
        transparent
        animationType="fade"
        onRequestClose={() => setDetail(null)}
      >
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setDetail(null)}>
          {detail && (
            <View style={[s.detailCard, { borderColor: detail.unlocked ? detail.color : PH.hair }]}>
              <Text style={[s.detailIcon, !detail.unlocked && s.locked]}>{detail.icon}</Text>
              <Text style={[s.detailTitle, { color: detail.unlocked ? detail.color : PH.inkDim }]}>
                {detail.unlocked ? detail.title : '🔒 Заблокировано'}
              </Text>
              <Text style={s.detailDesc}>{detail.desc}</Text>
              <View style={s.detailBarWrap}>
                <View
                  style={[
                    s.detailBarFill,
                    { width: `${Math.round(detail.progressPct * 100)}%`, backgroundColor: detail.color },
                  ]}
                />
              </View>
              <Text style={s.detailProgress}>
                {detail.progressVal} / {detail.total}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: PH.bgAlt, borderRadius: 16,
    borderWidth: 1, borderColor: PH.hair,
    padding: 16, marginBottom: 10,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  label: { fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1, color: PH.inkFaint },
  count: { fontFamily: FONTS.sansBold, fontSize: 13, color: PH.lime },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badge: {
    width: '22%', flexGrow: 1,
    backgroundColor: PH.bgSoft, borderRadius: 12,
    borderWidth: 1, borderColor: PH.hair,
    padding: 10, alignItems: 'center', gap: 6,
  },
  badgeUnlocked: { borderColor: PH.lime + '44', backgroundColor: PH.limeSoft },
  badgeIcon: { fontSize: 22 },
  locked: { opacity: 0.3 },
  lockedTxt: { color: PH.inkFaint },
  badgeBar: {
    width: '100%', height: 3,
    backgroundColor: PH.bgSoft, borderRadius: 2, overflow: 'hidden',
  },
  badgeBarFill: { height: '100%', borderRadius: 2 },
  badgeTitle: {
    fontFamily: FONTS.mono, fontSize: 8, color: PH.ink,
    letterSpacing: 0.3, textAlign: 'center',
  },

  // Detail modal
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
    padding: 40,
  },
  detailCard: {
    backgroundColor: PH.bg, borderRadius: 20,
    borderWidth: 2, padding: 24,
    alignItems: 'center', gap: 8, width: '100%',
  },
  detailIcon: { fontSize: 44 },
  detailTitle: { fontFamily: FONTS.sansBold, fontSize: 20, textAlign: 'center' },
  detailDesc: {
    fontFamily: FONTS.sans, fontSize: 13, color: PH.inkDim,
    textAlign: 'center', lineHeight: 20,
  },
  detailBarWrap: {
    width: '100%', height: 6,
    backgroundColor: PH.bgSoft, borderRadius: 3,
    overflow: 'hidden', marginTop: 8,
  },
  detailBarFill: { height: '100%', borderRadius: 3 },
  detailProgress: {
    fontFamily: FONTS.mono, fontSize: 11, color: PH.inkFaint,
  },
});
