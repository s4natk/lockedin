import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../auth/auth.types.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsersService } from '../users/users.service.js';

@Injectable()
export class AchievementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async list(authUser: AuthUser) {
    const user = await this.usersService.getOrCreate(authUser);
    const [catalog, earned] = await Promise.all([
      this.prisma.achievement.findMany({ orderBy: { sortOrder: 'asc' } }),
      this.prisma.userAchievement.findMany({
        where: { userId: user.id },
        select: { achievementCode: true, earnedAt: true },
      }),
    ]);
    const earnedAt = new Map(earned.map((row) => [row.achievementCode, row.earnedAt]));

    return catalog.map((item) => ({
      code: item.code,
      name: item.name,
      description: item.description,
      earnedAt: earnedAt.get(item.code) ?? null,
    }));
  }
}
