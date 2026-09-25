import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import {
  FOCUS_MODES,
  calendarDate,
  firstSessionBonus,
  thirdSessionBonus,
  levelFromTotalXp,
  nextStreak,
  xpForFocusedMinutes,
  type FocusModeId,
} from '@lockedin/shared';
import type { AuthUser } from '../auth/auth.types.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsersService } from '../users/users.service.js';
import type { StartSessionDto } from './dto/start-session.dto.js';

const sessionSelect = {
  id: true,
  mode: true,
  plannedDuration: true,
  actualDuration: true,
  startedAt: true,
  expectedEndAt: true,
  completedAt: true,
  status: true,
  xpEarned: true,
  taskId: true,
  categoryId: true,
  task: { select: { id: true, title: true } },
} as const;

@Injectable()
export class SessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async list(authUser: AuthUser) {
    const user = await this.usersService.getOrCreate(authUser);

    return this.prisma.focusSession.findMany({
      where: { userId: user.id },
      select: sessionSelect,
      orderBy: { startedAt: 'desc' },
    });
  }

  async active(authUser: AuthUser) {
    const user = await this.usersService.getOrCreate(authUser);

    return this.prisma.focusSession.findFirst({
      where: { userId: user.id, status: 'active' },
      select: sessionSelect,
      orderBy: { startedAt: 'desc' },
    });
  }

  async start(authUser: AuthUser, dto: StartSessionDto) {
    const user = await this.usersService.getOrCreate(authUser);
    const task = await this.prisma.task.findFirst({
      where: { id: dto.taskId, userId: user.id },
      select: { id: true, categoryId: true },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const existing = await this.prisma.focusSession.findFirst({
      where: { userId: user.id, status: 'active' },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('A focus session is already running');
    }

    const plannedDuration = plannedSeconds(dto.mode, dto.focusMinutes);
    const startedAt = new Date();
    const expectedEndAt = new Date(startedAt.getTime() + plannedDuration * 1000);

    return this.prisma.focusSession.create({
      data: {
        userId: user.id,
        taskId: task.id,
        categoryId: task.categoryId,
        mode: dto.mode,
        plannedDuration,
        startedAt,
        expectedEndAt,
      },
      select: sessionSelect,
    });
  }

  async complete(authUser: AuthUser, sessionId: string) {
    const user = await this.usersService.getOrCreate(authUser);
    const session = await this.requireOwnActive(user.id, sessionId);
    const completedAt = new Date();
    const elapsedSeconds = Math.max(
      0,
      Math.floor((completedAt.getTime() - session.startedAt.getTime()) / 1000),
    );
    const actualDuration = Math.min(elapsedSeconds, session.plannedDuration);
    const focusedMinutes = Math.floor(actualDuration / 60);
    const baseXp = xpForFocusedMinutes(focusedMinutes);

    const result = await this.prisma.$transaction(async (tx) => {
      const dayStart = new Date(`${calendarDate(completedAt)}T00:00:00.000Z`);
      const completedEarlierToday = await tx.focusSession.count({
        where: {
          userId: user.id,
          status: 'completed',
          completedAt: {
            gte: dayStart,
            lt: new Date(dayStart.getTime() + 86_400_000),
          },
        },
      });
      const firstBonus = firstSessionBonus(completedEarlierToday);
      const thirdBonus = thirdSessionBonus(completedEarlierToday);
      const bonusXp = firstBonus + thirdBonus;
      const bonusKind = thirdBonus > 0 ? 'third' : firstBonus > 0 ? 'first' : null;
      const xpEarned = baseXp + bonusXp;

      await tx.focusSession.update({
        where: { id: session.id },
        data: {
          status: 'completed',
          actualDuration,
          completedAt,
          xpEarned,
        },
      });

      const current = await tx.user.findUniqueOrThrow({
        where: { id: user.id },
        select: { currentStreak: true, longestStreak: true, lastActiveDate: true },
      });
      const streak = nextStreak(
        {
          currentStreak: current.currentStreak,
          longestStreak: current.longestStreak,
          lastActiveDate: current.lastActiveDate ? calendarDate(current.lastActiveDate) : null,
        },
        completedAt,
        focusedMinutes,
      );

      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          totalXp: { increment: xpEarned },
          currentStreak: streak.currentStreak,
          longestStreak: streak.longestStreak,
          ...(streak.lastActiveDate
            ? { lastActiveDate: new Date(`${streak.lastActiveDate}T00:00:00.000Z`) }
            : {}),
        },
        select: { totalXp: true, currentStreak: true, longestStreak: true },
      });

      return { updatedUser, xpEarned, bonusXp, bonusKind };
    });

    return {
      id: session.id,
      xpEarned: result.xpEarned,
      bonusXp: result.bonusXp,
      bonusKind: result.bonusKind,
      totalXp: result.updatedUser.totalXp,
      level: levelFromTotalXp(result.updatedUser.totalXp),
      currentStreak: result.updatedUser.currentStreak,
      longestStreak: result.updatedUser.longestStreak,
    };
  }

  async cancel(authUser: AuthUser, sessionId: string) {
    const user = await this.usersService.getOrCreate(authUser);
    const session = await this.requireOwnActive(user.id, sessionId);
    const endedAt = new Date();
    const elapsedSeconds = Math.max(
      0,
      Math.floor((endedAt.getTime() - session.startedAt.getTime()) / 1000),
    );

    return this.prisma.focusSession.update({
      where: { id: session.id },
      data: {
        status: 'cancelled',
        actualDuration: Math.min(elapsedSeconds, session.plannedDuration),
        xpEarned: 0,
      },
      select: sessionSelect,
    });
  }

  private async requireOwnActive(userId: string, sessionId: string) {
    const session = await this.prisma.focusSession.findFirst({
      where: { id: sessionId, userId, status: 'active' },
      select: { id: true, startedAt: true, plannedDuration: true },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return session;
  }
}

function plannedSeconds(mode: FocusModeId, focusMinutes: number | undefined) {
  if (mode === 'custom') {
    return (focusMinutes ?? 25) * 60;
  }

  return (FOCUS_MODES[mode].focusMinutes ?? 25) * 60;
}
