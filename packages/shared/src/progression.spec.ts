import { describe, expect, it } from 'vitest';
import {
  levelFromTotalXp,
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
