import { Injectable } from '@nestjs/common';
import { calendarDate } from '@lockedin/shared';
import type { AuthUser } from '../auth/auth.types.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsersService } from '../users/users.service.js';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async get(authUser: AuthUser) {
    const user = await this.usersService.getOrCreate(authUser);
    const dayStart = new Date(`${calendarDate(new Date())}T00:00:00.000Z`);
    const dayEnd = new Date(dayStart.getTime() + 86_400_000);
    const completedToday = {
      userId: user.id,
      status: 'completed' as const,
      completedAt: { gte: dayStart, lt: dayEnd },
    };

    const [totals, tasks, recentSessions] = await Promise.all([
      this.prisma.focusSession.aggregate({
        where: completedToday,
        _sum: { actualDuration: true },
        _count: true,
      }),
      this.prisma.task.findMany({
        where: {
          userId: user.id,
          OR: [{ completed: false }, { completedAt: { gte: dayStart, lt: dayEnd } }],
        },
        select: { id: true, title: true, completed: true },
        orderBy: [{ completed: 'asc' }, { createdAt: 'desc' }],
        take: 8,
      }),
      this.prisma.focusSession.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          status: true,
          actualDuration: true,
          xpEarned: true,
          startedAt: true,
          task: { select: { title: true } },
        },
        orderBy: { startedAt: 'desc' },
        take: 5,
      }),
    ]);

    return {
      focusedMinutes: Math.floor((totals._sum.actualDuration ?? 0) / 60),
      sessionCount: totals._count,
      tasks,
      recentSessions,
    };
  }
}
