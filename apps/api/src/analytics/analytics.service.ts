import { Injectable } from '@nestjs/common';
import { calendarDate } from '@lockedin/shared';
import type { AuthUser } from '../auth/auth.types.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsersService } from '../users/users.service.js';

const DAY_MS = 86_400_000;

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async weekly(authUser: AuthUser) {
    const user = await this.usersService.getOrCreate(authUser);
    const today = calendarDate(new Date());
    const startDate = shiftDate(today, -6);
    const sessions = await this.prisma.focusSession.findMany({
      where: {
        userId: user.id,
        status: 'completed',
        completedAt: { gte: dayStart(startDate), lt: dayStart(shiftDate(today, 1)) },
      },
      select: { completedAt: true, actualDuration: true },
    });

    const seconds = new Map<string, number>();
    for (const session of sessions) {
      if (!session.completedAt) continue;
      const key = calendarDate(session.completedAt);
      seconds.set(key, (seconds.get(key) ?? 0) + (session.actualDuration ?? 0));
    }

    const days = Array.from({ length: 7 }, (_, index) => {
      const date = shiftDate(startDate, index);
      return { date, minutes: Math.floor((seconds.get(date) ?? 0) / 60) };
    });

    return { days };
  }

  async categories(authUser: AuthUser) {
    const user = await this.usersService.getOrCreate(authUser);
    const sessions = await this.prisma.focusSession.findMany({
      where: { userId: user.id, status: 'completed' },
      select: {
        actualDuration: true,
        categoryId: true,
        category: { select: { name: true } },
      },
    });

    const grouped = new Map<string, { name: string; seconds: number }>();
    for (const session of sessions) {
      const id = session.categoryId ?? 'none';
      const current = grouped.get(id) ?? {
        name: session.category?.name ?? 'No category',
        seconds: 0,
      };
      current.seconds += session.actualDuration ?? 0;
      grouped.set(id, current);
    }

    const totalSeconds = [...grouped.values()].reduce((sum, item) => sum + item.seconds, 0);
    const categories = [...grouped.entries()]
      .map(([id, item]) => ({
        id,
        name: item.name,
        minutes: Math.floor(item.seconds / 60),
        share: totalSeconds === 0 ? 0 : Math.round((item.seconds / totalSeconds) * 100),
      }))
      .sort((a, b) => b.minutes - a.minutes);

    return { categories };
  }
}

function dayStart(date: string) {
  return new Date(`${date}T00:00:00.000Z`);
}

function shiftDate(date: string, days: number) {
  return calendarDate(new Date(dayStart(date).getTime() + days * DAY_MS));
}
