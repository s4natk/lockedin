import { ConflictException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { UsersService } from '../users/users.service.js';
import { CategoriesService } from './categories.service.js';

const authUser = {
  clerkId: 'user_123',
  email: 'sanat@example.com',
  username: null,
};

describe('CategoriesService', () => {
  const user = { id: 'local-user' };

  it('lists only the signed-in user categories', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const service = new CategoriesService(
      { category: { findMany } } as unknown as PrismaService,
      { getOrCreate: vi.fn().mockResolvedValue(user) } as unknown as UsersService,
    );

    await service.list(authUser);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'local-user' },
      }),
    );
  });

  it('creates a category for the signed-in user', async () => {
    const create = vi.fn().mockResolvedValue({ id: 'cat_1', name: 'School' });
    const service = new CategoriesService(
      { category: { create } } as unknown as PrismaService,
      { getOrCreate: vi.fn().mockResolvedValue(user) } as unknown as UsersService,
    );

    await service.create(authUser, { name: '  School  ' });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { userId: 'local-user', name: 'School' },
      }),
    );
  });

  it('rejects a duplicate category name', async () => {
    const error = new Prisma.PrismaClientKnownRequestError('duplicate', {
      code: 'P2002',
      clientVersion: 'test',
    });
    const service = new CategoriesService(
      { category: { create: vi.fn().mockRejectedValue(error) } } as unknown as PrismaService,
      { getOrCreate: vi.fn().mockResolvedValue(user) } as unknown as UsersService,
    );

    await expect(service.create(authUser, { name: 'School' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
