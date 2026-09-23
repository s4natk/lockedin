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
