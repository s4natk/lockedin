import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import {
  FOCUS_MODES,
  calendarDate,
  firstSessionBonus,
  thirdSessionBonus,
  levelFromTotalXp,
  nextStreak,
  sevenDayStreakBonus,
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
  pausedAt: true,
  pausedSeconds: true,
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
    const actualDuration = Math.min(focusedSeconds(session, completedAt), session.plannedDuration);
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
      const streakBonus = sevenDayStreakBonus(current.currentStreak, streak.currentStreak);
      const bonusXp = firstBonus + thirdBonus;
      const bonusKind = thirdBonus > 0 ? 'third' : firstBonus > 0 ? 'first' : null;
      const xpEarned = baseXp + bonusXp + streakBonus;

      await tx.focusSession.update({
        where: { id: session.id },
        data: {
          status: 'completed',
          actualDuration,
          completedAt,
          xpEarned,
        },
      });

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

      return { updatedUser, xpEarned, bonusXp, bonusKind, streakBonus };
    });

    return {
      id: session.id,
      xpEarned: result.xpEarned,
      bonusXp: result.bonusXp,
      bonusKind: result.bonusKind,
      streakBonus: result.streakBonus,
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

    return this.prisma.focusSession.update({
      where: { id: session.id },
      data: {
        status: 'cancelled',
        actualDuration: Math.min(focusedSeconds(session, endedAt), session.plannedDuration),
        xpEarned: 0,
      },
      select: sessionSelect,
    });
  }

  async pause(authUser: AuthUser, sessionId: string) {
    const user = await this.usersService.getOrCreate(authUser);
    const session = await this.requireOwnActive(user.id, sessionId);

    if (session.pausedAt) {
      return this.prisma.focusSession.findFirstOrThrow({
        where: { id: session.id },
        select: sessionSelect,
      });
    }

    return this.prisma.focusSession.update({
      where: { id: session.id },
      data: { pausedAt: new Date() },
      select: sessionSelect,
    });
  }

  async resume(authUser: AuthUser, sessionId: string) {
    const user = await this.usersService.getOrCreate(authUser);
    const session = await this.requireOwnActive(user.id, sessionId);

    if (!session.pausedAt) {
      throw new ConflictException('Session is not paused');
    }

    const now = new Date();
    const pausedMs = Math.max(0, now.getTime() - session.pausedAt.getTime());

    return this.prisma.focusSession.update({
      where: { id: session.id },
      data: {
        pausedAt: null,
        pausedSeconds: session.pausedSeconds + Math.floor(pausedMs / 1000),
        expectedEndAt: new Date(session.expectedEndAt.getTime() + pausedMs),
      },
      select: sessionSelect,
    });
  }

  private async requireOwnActive(userId: string, sessionId: string) {
    const session = await this.prisma.focusSession.findFirst({
      where: { id: sessionId, userId, status: 'active' },
      select: {
        id: true,
        startedAt: true,
        plannedDuration: true,
        pausedAt: true,
        pausedSeconds: true,
        expectedEndAt: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return session;
  }
}

function focusedSeconds(
  session: { startedAt: Date; pausedAt?: Date | null; pausedSeconds?: number },
  endedAt: Date,
) {
  const openPause = session.pausedAt
    ? Math.max(0, Math.floor((endedAt.getTime() - session.pausedAt.getTime()) / 1000))
    : 0;
  const elapsed = Math.max(0, Math.floor((endedAt.getTime() - session.startedAt.getTime()) / 1000));
  return Math.max(0, elapsed - (session.pausedSeconds ?? 0) - openPause);
}

function plannedSeconds(mode: FocusModeId, focusMinutes: number | undefined) {
  if (mode === 'custom') {
    return (focusMinutes ?? 25) * 60;
  }

  return (FOCUS_MODES[mode].focusMinutes ?? 25) * 60;
}
