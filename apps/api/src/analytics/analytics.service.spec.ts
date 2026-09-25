import { calendarDate } from '@lockedin/shared';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { UsersService } from '../users/users.service.js';
import { AnalyticsService } from './analytics.service.js';

const authUser = {
  clerkId: 'user_123',
  email: 'sanat@example.com',
  username: null,
};

const users = {
  getOrCreate: vi.fn().mockResolvedValue({ id: 'local-user' }),
} as unknown as UsersService;

describe('AnalyticsService', () => {
  it('returns seven days and puts today minutes on the last day', async () => {
    const findMany = vi.fn().mockResolvedValue([
      { completedAt: new Date(), actualDuration: 50 * 60 },
    ]);
    const service = new AnalyticsService(
      { focusSession: { findMany } } as unknown as PrismaService,
      users,
    );

    const result = await service.weekly(authUser);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 'local-user', status: 'completed' }),
      }),
    );
    expect(result.days).toHaveLength(7);
    expect(result.days[6]).toEqual({ date: calendarDate(new Date()), minutes: 50 });
    expect(result.days[0].minutes).toBe(0);
  });

  it('splits completed time by category', async () => {
    const service = new AnalyticsService(
      {
        focusSession: {
          findMany: vi.fn().mockResolvedValue([
            { actualDuration: 90 * 60, categoryId: 'school', category: { name: 'School' } },
            { actualDuration: 30 * 60, categoryId: 'projects', category: { name: 'Projects' } },
          ]),
        },
      } as unknown as PrismaService,
      users,
    );

    const result = await service.categories(authUser);

    expect(result.categories).toEqual([
      { id: 'school', name: 'School', minutes: 90, share: 75 },
      { id: 'projects', name: 'Projects', minutes: 30, share: 25 },
    ]);
  });
});
