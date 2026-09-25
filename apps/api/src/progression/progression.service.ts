import { Injectable } from '@nestjs/common';
import { calendarDate, levelFromTotalXp, requiredXpForLevel } from '@lockedin/shared';
import type { AuthUser } from '../auth/auth.types.js';
import { UsersService } from '../users/users.service.js';

@Injectable()
export class ProgressionService {
  constructor(private readonly usersService: UsersService) {}

  async get(authUser: AuthUser) {
    const user = await this.usersService.getOrCreate(authUser);
    const level = levelFromTotalXp(user.totalXp);

    return {
      totalXp: user.totalXp,
      level,
      currentLevelXp: requiredXpForLevel(level),
      nextLevelXp: requiredXpForLevel(level + 1),
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      lastActiveDate: user.lastActiveDate ? calendarDate(user.lastActiveDate) : null,
    };
  }
}
