/**
 * useNotifications.js
 * ───────────────────
 * Manages expo-notifications: permission request + daily streak reminder.
 *
 * Usage:
 *   const { granted, scheduleReminder, cancelReminder } = useNotifications();
 *   // call scheduleReminder(streakDays) after progress loads
 */

import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Show notifications even when the app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const REMINDER_ID_KEY = 'phantom_streak_notif_id';

function streakMessage(streak) {
  if (streak === 0) return 'Начни тренировку сегодня — даже 5 минут считаются! 💪';
  if (streak === 1) return 'Молодец! День один позади. Не останавливайся! 🔥';
  if (streak < 7)  return `Серия ${streak} дней! Продолжай тренироваться сегодня. ⚡`;
  if (streak < 14) return `${streak} дней подряд — это серьёзно! Не теряй ритм. 🏆`;
  return `${streak} дней! Ты профессионал. Продолжай! 🎖️`;
}

async function requestPermission() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('streak', {
      name: 'Streak Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export function useNotifications() {
  const [granted, setGranted] = useState(false);
  const idRef = useRef(null); // stored notification identifier

  // Request permission on mount
  useEffect(() => {
    requestPermission().then(setGranted);
  }, []);

  /**
   * Cancel any existing reminder and schedule a new daily one at 09:00.
   * Safe to call multiple times — always replaces the old notification.
   */
  async function scheduleReminder(streakDays = 0) {
    if (!granted) {
      const ok = await requestPermission();
      setGranted(ok);
      if (!ok) return false;
    }

    // Cancel old
    if (idRef.current) {
      await Notifications.cancelScheduledNotificationAsync(idRef.current).catch(() => {});
      idRef.current = null;
    }

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Phantom · Время тренировки',
        body: streakMessage(streakDays),
        sound: true,
      },
      trigger: {
        hour: 9,
        minute: 0,
        repeats: true,
      },
    });

    idRef.current = id;
    return id;
  }

  /** Cancel the currently scheduled streak reminder. */
  async function cancelReminder() {
    if (idRef.current) {
      await Notifications.cancelScheduledNotificationAsync(idRef.current).catch(() => {});
      idRef.current = null;
    }
  }

  return { granted, scheduleReminder, cancelReminder };
}
