/**
 * achievements.js
 * ───────────────
 * Client-side achievement definitions + compute function.
 *
 * Usage:
 *   import { computeAchievements } from '../utils/achievements';
 *   const list = computeAchievements(progress, sessions);
 *   // list: [{ ...achievement, unlocked: bool, progress: 0-1 }]
 */

export const ALL_ACHIEVEMENTS = [
  {
    id: 'first_game',
    icon: '🎮',
    title: 'Первый шаг',
    desc: 'Завершить первую тренировку',
    color: '#A8CC5C',
    check: ({ totalSessions }) => totalSessions >= 1,
    progressFn: ({ totalSessions }) => Math.min(totalSessions, 1),
    total: 1,
  },
  {
    id: 'streak_3',
    icon: '🔥',
    title: '3 дня подряд',
    desc: 'Тренироваться 3 дня без перерыва',
    color: '#F4B850',
    check: ({ streak }) => streak >= 3,
    progressFn: ({ streak }) => Math.min(streak, 3),
    total: 3,
  },
  {
    id: 'streak_7',
    icon: '⚡',
    title: 'Неделя',
    desc: 'Серия 7 дней подряд',
    color: '#8B7FE8',
    check: ({ streak }) => streak >= 7,
    progressFn: ({ streak }) => Math.min(streak, 7),
    total: 7,
  },
  {
    id: 'streak_14',
    icon: '🏆',
    title: 'Две недели',
    desc: 'Серия 14 дней подряд',
    color: '#F4B850',
    check: ({ streak }) => streak >= 14,
    progressFn: ({ streak }) => Math.min(streak, 14),
    total: 14,
  },
  {
    id: 'sessions_10',
    icon: '📊',
    title: '10 сессий',
    desc: 'Провести 10 тренировок',
    color: '#A8CC5C',
    check: ({ totalSessions }) => totalSessions >= 10,
    progressFn: ({ totalSessions }) => Math.min(totalSessions, 10),
    total: 10,
  },
  {
    id: 'sessions_50',
    icon: '💎',
    title: '50 сессий',
    desc: 'Провести 50 тренировок',
    color: '#8B7FE8',
    check: ({ totalSessions }) => totalSessions >= 50,
    progressFn: ({ totalSessions }) => Math.min(totalSessions, 50),
    total: 50,
  },
  {
    id: 'minutes_60',
    icon: '⏱️',
    title: 'Час тренировок',
    desc: '60 минут суммарно',
    color: '#A8CC5C',
    check: ({ totalMinutes }) => totalMinutes >= 60,
    progressFn: ({ totalMinutes }) => Math.min(totalMinutes, 60),
    total: 60,
  },
  {
    id: 'minutes_300',
    icon: '🎖️',
    title: '5 часов',
    desc: '300 минут суммарно',
    color: '#F4B850',
    check: ({ totalMinutes }) => totalMinutes >= 300,
    progressFn: ({ totalMinutes }) => Math.min(totalMinutes, 300),
    total: 300,
  },
  {
    id: 'skill_80',
    icon: '🎯',
    title: 'Мастер',
    desc: 'Любой навык ≥ 80 очков',
    color: '#8B7FE8',
    check: ({ skills }) => Object.values(skills).some(v => v >= 80),
    progressFn: ({ skills }) => Math.min(Math.max(...Object.values(skills), 0), 80),
    total: 80,
  },
  {
    id: 'all_games',
    icon: '🌟',
    title: 'Коллекционер',
    desc: 'Сыграть в все 3 игры',
    color: '#A8CC5C',
    check: ({ gamesPlayed }) => gamesPlayed >= 3,
    progressFn: ({ gamesPlayed }) => Math.min(gamesPlayed, 3),
    total: 3,
  },
];

/**
 * Compute achievements from progress API response + sessions list.
 *
 * @param {object} progress - from api.getProgress()
 * @param {Array}  sessions - from api.getSessions()
 * @returns {Array} ALL_ACHIEVEMENTS with unlocked: bool and progressVal / progressPct
 */
export function computeAchievements(progress, sessions = []) {
  const streak       = progress?.streak_days  ?? 0;
  const totalMinutes = progress?.total_minutes ?? 0;   // from /sessions/progress
  const totalSessions = sessions.length;

  // unique games played
  const uniqueGames = new Set(sessions.map(s => s.game));
  const gamesPlayed = uniqueGames.size;

  // API returns 0–100 scores (averaged from stored session scores)
  const skills = {
    activation: progress?.activation_avg ?? 0,
    precision:  progress?.precision_avg  ?? 0,
    control:    progress?.dosing_avg     ?? 0,
  };

  const ctx = { streak, totalMinutes, totalSessions, gamesPlayed, skills };

  return ALL_ACHIEVEMENTS.map((a) => {
    const unlocked = a.check(ctx);
    const progressVal = a.progressFn(ctx);
    const progressPct = progressVal / a.total;
    return { ...a, unlocked, progressVal, progressPct };
  });
}
