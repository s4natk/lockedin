export {
  FOCUS_MODE_IDS,
  FOCUS_MODES,
  type FocusMode,
  type FocusModeId,
} from './focus-modes.js';

export {
  BONUS_XP,
  LEVEL_XP_BASE,
  LEVEL_XP_EXPONENT,
  STREAK_MINIMUM_MINUTES,
  XP_PER_FOCUSED_MINUTE,
  calendarDate,
  firstSessionBonus,
  levelFromTotalXp,
  nextStreak,
  requiredXpForLevel,
  xpForFocusedMinutes,
  type StreakState,
} from './progression.js';

export type SessionStatus = 'active' | 'completed' | 'cancelled';
