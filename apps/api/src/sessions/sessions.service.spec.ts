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
            focusSession: { update: updateSession },
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
      totalXp: 50,
      level: 1,
      currentStreak: 1,
      longestStreak: 1,
    });
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
});
