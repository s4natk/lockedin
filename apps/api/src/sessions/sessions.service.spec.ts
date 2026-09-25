import { ConflictException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { UsersService } from '../users/users.service.js';
import { SessionsService } from './sessions.service.js';

const authUser = {
  clerkId: 'user_123',
  email: 'sanat@example.com',
  username: null,
};

const users = {
  getOrCreate: vi.fn().mockResolvedValue({ id: 'local-user', totalXp: 0 }),
} as unknown as UsersService;

describe('SessionsService', () => {
  it('rejects a task the user does not own', async () => {
    const service = new SessionsService(
      {
        task: { findFirst: vi.fn().mockResolvedValue(null) },
        focusSession: { create: vi.fn() },
      } as unknown as PrismaService,
      users,
    );

    await expect(
      service.start(authUser, { mode: 'pomodoro', taskId: 'someone-elses-task' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('refuses to start a second active session', async () => {
    const service = new SessionsService(
      {
        task: { findFirst: vi.fn().mockResolvedValue({ id: 'task-1', categoryId: 'cat-1' }) },
        focusSession: { findFirst: vi.fn().mockResolvedValue({ id: 'already-running' }) },
      } as unknown as PrismaService,
      users,
    );

    await expect(
      service.start(authUser, { mode: 'pomodoro', taskId: 'task-1' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('awards XP from elapsed minutes and ignores any client amount', async () => {
    const startedAt = new Date(Date.now() - 25 * 60 * 1000);
    const updateSession = vi.fn().mockResolvedValue({});
    const updateUser = vi.fn().mockResolvedValue({
      totalXp: 50,
      currentStreak: 1,
      longestStreak: 1,
    });
    const service = new SessionsService(
      {
        focusSession: {
          findFirst: vi.fn().mockResolvedValue({
            id: 'session-1',
            startedAt,
            plannedDuration: 25 * 60,
          }),
        },
        $transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) =>
          callback({
            focusSession: { update: updateSession, count: vi.fn().mockResolvedValue(1) },
            user: {
              findUniqueOrThrow: vi.fn().mockResolvedValue({
                currentStreak: 0,
                longestStreak: 0,
                lastActiveDate: null,
              }),
              update: updateUser,
            },
          }),
        ),
      } as unknown as PrismaService,
      users,
    );

    const result = await service.complete(authUser, 'session-1');

    expect(updateSession).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'completed', xpEarned: 50 }),
      }),
    );
    expect(updateUser).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          totalXp: { increment: 50 },
          currentStreak: 1,
          longestStreak: 1,
        }),
      }),
    );
    expect(result).toEqual({
      id: 'session-1',
      xpEarned: 50,
      bonusXp: 0,
      bonusKind: null,
      streakBonus: 0,
      totalXp: 50,
      level: 1,
      currentStreak: 1,
      longestStreak: 1,
    });
  });

  it('adds 10 XP when this is the first completed session today', async () => {
    const startedAt = new Date(Date.now() - 2 * 60 * 1000);
    const updateSession = vi.fn().mockResolvedValue({});
    const updateUser = vi.fn().mockResolvedValue({
      totalXp: 14,
      currentStreak: 0,
      longestStreak: 0,
    });
    const service = new SessionsService(
      {
        focusSession: {
          findFirst: vi.fn().mockResolvedValue({
            id: 'session-1',
            startedAt,
            plannedDuration: 25 * 60,
          }),
        },
        $transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) =>
          callback({
            focusSession: { update: updateSession, count: vi.fn().mockResolvedValue(0) },
            user: {
              findUniqueOrThrow: vi.fn().mockResolvedValue({
                currentStreak: 0,
                longestStreak: 0,
                lastActiveDate: null,
              }),
              update: updateUser,
            },
          }),
        ),
      } as unknown as PrismaService,
      users,
    );

    const result = await service.complete(authUser, 'session-1');

    expect(updateSession).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ xpEarned: 14 }),
      }),
    );
    expect(result.bonusXp).toBe(10);
    expect(result.bonusKind).toBe('first');
    expect(result.xpEarned).toBe(14);
  });

  it('adds 25 XP when this is the third completed session today', async () => {
    const startedAt = new Date(Date.now() - 2 * 60 * 1000);
    const updateSession = vi.fn().mockResolvedValue({});
    const service = new SessionsService(
      {
        focusSession: {
          findFirst: vi.fn().mockResolvedValue({
            id: 'session-3',
            startedAt,
            plannedDuration: 25 * 60,
          }),
        },
        $transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) =>
          callback({
            focusSession: { update: updateSession, count: vi.fn().mockResolvedValue(2) },
            user: {
              findUniqueOrThrow: vi.fn().mockResolvedValue({
                currentStreak: 0,
                longestStreak: 0,
                lastActiveDate: null,
              }),
              update: vi.fn().mockResolvedValue({
                totalXp: 29,
                currentStreak: 0,
                longestStreak: 0,
              }),
            },
          }),
        ),
      } as unknown as PrismaService,
      users,
    );

    const result = await service.complete(authUser, 'session-3');

    expect(updateSession).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ xpEarned: 29 }),
      }),
    );
    expect(result.bonusXp).toBe(25);
    expect(result.bonusKind).toBe('third');
  });

  it('adds 50 XP when the streak reaches 7 days', async () => {
    const startedAt = new Date(Date.now() - 25 * 60 * 1000);
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const updateSession = vi.fn().mockResolvedValue({});
    const service = new SessionsService(
      {
        focusSession: {
          findFirst: vi.fn().mockResolvedValue({
            id: 'session-7',
            startedAt,
            plannedDuration: 25 * 60,
          }),
        },
        $transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) =>
          callback({
            focusSession: { update: updateSession, count: vi.fn().mockResolvedValue(1) },
            user: {
              findUniqueOrThrow: vi.fn().mockResolvedValue({
                currentStreak: 6,
                longestStreak: 6,
                lastActiveDate: yesterday,
              }),
              update: vi.fn().mockResolvedValue({
                totalXp: 100,
                currentStreak: 7,
                longestStreak: 7,
              }),
            },
          }),
        ),
      } as unknown as PrismaService,
      users,
    );

    const result = await service.complete(authUser, 'session-7');

    expect(updateSession).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ xpEarned: 100 }),
      }),
    );
    expect(result.streakBonus).toBe(50);
    expect(result.currentStreak).toBe(7);
  });

  it('hides another user session on complete', async () => {
    const service = new SessionsService(
      { focusSession: { findFirst: vi.fn().mockResolvedValue(null) } } as unknown as PrismaService,
      users,
    );

    await expect(service.complete(authUser, 'their-session')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('cancels without awarding XP', async () => {
    const update = vi.fn().mockResolvedValue({ id: 'session-1', status: 'cancelled', xpEarned: 0 });
    const service = new SessionsService(
      {
        focusSession: {
          findFirst: vi.fn().mockResolvedValue({
            id: 'session-1',
            startedAt: new Date(),
            plannedDuration: 25 * 60,
          }),
          update,
        },
      } as unknown as PrismaService,
      users,
    );

    await service.cancel(authUser, 'session-1');

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'cancelled', xpEarned: 0 }),
      }),
    );
  });

  it('leaves paused time out of the XP', async () => {
    const startedAt = new Date(Date.now() - 25 * 60 * 1000);
    const updateSession = vi.fn().mockResolvedValue({});
    const service = new SessionsService(
      {
        focusSession: {
          findFirst: vi.fn().mockResolvedValue({
            id: 'session-1',
            startedAt,
            plannedDuration: 25 * 60,
            pausedSeconds: 10 * 60,
            pausedAt: null,
          }),
        },
        $transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) =>
          callback({
            focusSession: { update: updateSession, count: vi.fn().mockResolvedValue(1) },
            user: {
              findUniqueOrThrow: vi.fn().mockResolvedValue({
                currentStreak: 0,
                longestStreak: 0,
                lastActiveDate: null,
              }),
              update: vi.fn().mockResolvedValue({
                totalXp: 30,
                currentStreak: 0,
                longestStreak: 0,
              }),
            },
          }),
        ),
      } as unknown as PrismaService,
      users,
    );

    const result = await service.complete(authUser, 'session-1');

    expect(updateSession).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ xpEarned: 30 }),
      }),
    );
    expect(result.xpEarned).toBe(30);
  });

  it('pushes the end time forward when a pause ends', async () => {
    const expectedEndAt = new Date(Date.now() + 10 * 60 * 1000);
    const pausedAt = new Date(Date.now() - 30_000);
    const update = vi.fn().mockResolvedValue({ id: 'session-1' });
    const findFirst = vi
      .fn()
      .mockResolvedValueOnce({
        id: 'session-1',
        startedAt: new Date(),
        plannedDuration: 25 * 60,
        pausedAt: null,
        pausedSeconds: 0,
        expectedEndAt,
      })
      .mockResolvedValueOnce({
        id: 'session-1',
        startedAt: new Date(),
        plannedDuration: 25 * 60,
        pausedAt,
        pausedSeconds: 0,
        expectedEndAt,
      });
    const service = new SessionsService(
      { focusSession: { findFirst, update } } as unknown as PrismaService,
      users,
    );

    await service.pause(authUser, 'session-1');
    await service.resume(authUser, 'session-1');

    expect(update).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        data: expect.objectContaining({ pausedAt: null, pausedSeconds: 30 }),
      }),
    );
    const resumeData = update.mock.calls[1][0].data as { expectedEndAt: Date };
    expect(resumeData.expectedEndAt.getTime() - expectedEndAt.getTime()).toBeGreaterThanOrEqual(30_000);
  });
});
