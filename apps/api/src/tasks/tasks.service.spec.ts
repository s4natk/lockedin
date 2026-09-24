import { NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { UsersService } from '../users/users.service.js';
import { TasksService } from './tasks.service.js';

const authUser = {
  clerkId: 'user_123',
  email: 'sanat@example.com',
  username: null,
};

const users = {
  getOrCreate: vi.fn().mockResolvedValue({ id: 'local-user' }),
} as unknown as UsersService;

describe('TasksService', () => {
  it('lists only the signed-in user tasks', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const service = new TasksService(
      { task: { findMany } } as unknown as PrismaService,
      users,
    );

    await service.list(authUser);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'local-user' } }),
    );
  });

  it('rejects a category the user does not own', async () => {
    const service = new TasksService(
      {
        category: { findFirst: vi.fn().mockResolvedValue(null) },
        task: { create: vi.fn() },
      } as unknown as PrismaService,
      users,
    );

    await expect(
      service.create(authUser, {
        title: 'Finish assignment',
        categoryId: 'someone-elses-category',
        estimatedSessions: 3,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('hides another user task on update', async () => {
    const service = new TasksService(
      { task: { findFirst: vi.fn().mockResolvedValue(null) } } as unknown as PrismaService,
      users,
    );

    await expect(
      service.update(authUser, 'their-task', { completed: true }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
