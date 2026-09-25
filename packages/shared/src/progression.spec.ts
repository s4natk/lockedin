import { describe, expect, it } from 'vitest';
import {
  firstSessionBonus,
  sevenDayStreakBonus,
  thirdSessionBonus,
  levelFromTotalXp,
  nextStreak,
  requiredXpForLevel,
  xpForFocusedMinutes,
} from './progression.js';

describe('xpForFocusedMinutes', () => {
  it('awards 2 XP per completed minute', () => {
    expect(xpForFocusedMinutes(25)).toBe(50);
    expect(xpForFocusedMinutes(50)).toBe(100);
    expect(xpForFocusedMinutes(90)).toBe(180);
  });

  it('ignores partial minutes and non-positive time', () => {
    expect(xpForFocusedMinutes(1.9)).toBe(2);
    expect(xpForFocusedMinutes(0)).toBe(0);
    expect(xpForFocusedMinutes(-10)).toBe(0);
  });
});

describe('levels', () => {
  it('starts level 1 at 0 XP', () => {
    expect(requiredXpForLevel(1)).toBe(0);
    expect(levelFromTotalXp(0)).toBe(1);
  });

  it('uses 250 × level^1.4 as the threshold for later levels', () => {
    expect(requiredXpForLevel(2)).toBe(660);
    expect(requiredXpForLevel(3)).toBe(1164);
    expect(levelFromTotalXp(659)).toBe(1);
    expect(levelFromTotalXp(660)).toBe(2);
    expect(levelFromTotalXp(1163)).toBe(2);
    expect(levelFromTotalXp(1164)).toBe(3);
  });
});

describe('firstSessionBonus', () => {
  it('awards 10 XP only when no session was completed earlier today', () => {
    expect(firstSessionBonus(0)).toBe(10);
    expect(firstSessionBonus(1)).toBe(0);
  });
});

describe('thirdSessionBonus', () => {
  it('awards 25 XP only for the third completed session today', () => {
    expect(thirdSessionBonus(2)).toBe(25);
    expect(thirdSessionBonus(0)).toBe(0);
    expect(thirdSessionBonus(3)).toBe(0);
  });
});

describe('sevenDayStreakBonus', () => {
  it('awards 50 XP only when the streak reaches 7', () => {
    expect(sevenDayStreakBonus(6, 7)).toBe(50);
    expect(sevenDayStreakBonus(7, 7)).toBe(0);
    expect(sevenDayStreakBonus(7, 8)).toBe(0);
  });
});

describe('nextStreak', () => {
  const empty = { currentStreak: 0, longestStreak: 0, lastActiveDate: null };

  it('starts a streak after 25 focused minutes', () => {
    expect(nextStreak(empty, new Date('2026-09-24T18:00:00.000Z'), 25)).toEqual({
      currentStreak: 1,
      longestStreak: 1,
      lastActiveDate: '2026-09-24',
    });
  });

  it('keeps the streak when another long session lands the same day', () => {
    expect(
      nextStreak(
        { currentStreak: 4, longestStreak: 4, lastActiveDate: '2026-09-24' },
        new Date('2026-09-24T23:00:00.000Z'),
        50,
      ),
    ).toEqual({
      currentStreak: 4,
      longestStreak: 4,
      lastActiveDate: '2026-09-24',
    });
  });

  it('increments the streak on the next calendar day', () => {
    expect(
      nextStreak(
        { currentStreak: 4, longestStreak: 6, lastActiveDate: '2026-09-23' },
        new Date('2026-09-24T12:00:00.000Z'),
        25,
      ),
    ).toEqual({
      currentStreak: 5,
      longestStreak: 6,
      lastActiveDate: '2026-09-24',
    });
  });

  it('resets the streak after a missed day and keeps the longest', () => {
    expect(
      nextStreak(
        { currentStreak: 4, longestStreak: 9, lastActiveDate: '2026-09-20' },
        new Date('2026-09-24T12:00:00.000Z'),
        25,
      ),
    ).toEqual({
      currentStreak: 1,
      longestStreak: 9,
      lastActiveDate: '2026-09-24',
    });
  });

  it('leaves the streak unchanged below 25 minutes', () => {
    const state = { currentStreak: 3, longestStreak: 3, lastActiveDate: '2026-09-23' };
    expect(nextStreak(state, new Date('2026-09-24T12:00:00.000Z'), 24)).toEqual(state);
  });
});
