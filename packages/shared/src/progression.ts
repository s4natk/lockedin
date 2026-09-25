export const XP_PER_FOCUSED_MINUTE = 2;

export const STREAK_MINIMUM_MINUTES = 25;

export const BONUS_XP = {
  firstSessionToday: 10,
  threeSessionsToday: 25,
  sevenDayStreak: 50,
} as const;

export const LEVEL_XP_BASE = 250;
export const LEVEL_XP_EXPONENT = 1.4;

export function xpForFocusedMinutes(minutes: number): number {
  if (minutes <= 0) return 0;
  return Math.floor(minutes) * XP_PER_FOCUSED_MINUTE;
}

export function firstSessionBonus(completedEarlierToday: number): number {
  return completedEarlierToday === 0 ? BONUS_XP.firstSessionToday : 0;
}

export function thirdSessionBonus(completedEarlierToday: number): number {
  return completedEarlierToday === 2 ? BONUS_XP.threeSessionsToday : 0;
}

export function sevenDayStreakBonus(previousStreak: number, nextCurrentStreak: number): number {
  return previousStreak < 7 && nextCurrentStreak === 7 ? BONUS_XP.sevenDayStreak : 0;
}

/** Total XP required to reach a level. Level 1 starts at 0. */
export function requiredXpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.round(LEVEL_XP_BASE * level ** LEVEL_XP_EXPONENT);
}

export function levelFromTotalXp(totalXp: number): number {
  const xp = Math.max(0, totalXp);
  let level = 1;

  while (requiredXpForLevel(level + 1) <= xp) {
    level += 1;
  }

  return level;
}

export type StreakState = {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
};

export function calendarDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function nextStreak(
  state: StreakState,
  completedAt: Date,
  focusedMinutes: number,
): StreakState {
  if (focusedMinutes < STREAK_MINIMUM_MINUTES) {
    return state;
  }

  const completedOn = calendarDate(completedAt);
  let currentStreak = 1;

  if (state.lastActiveDate) {
    const gap = daysBetween(state.lastActiveDate, completedOn);
    if (gap <= 0) {
      currentStreak = state.currentStreak;
    } else if (gap === 1) {
      currentStreak = state.currentStreak + 1;
    }
  }

  return {
    currentStreak,
    longestStreak: Math.max(state.longestStreak, currentStreak),
    lastActiveDate: completedOn,
  };
}

function daysBetween(earlier: string, later: string): number {
  const start = Date.parse(`${earlier}T00:00:00.000Z`);
  const end = Date.parse(`${later}T00:00:00.000Z`);
  return Math.round((end - start) / 86_400_000);
}
