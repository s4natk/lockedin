import type { PrismaService } from '../prisma/prisma.service.js';
import type { UsersService } from '../users/users.service.js';
import { AchievementsService } from './achievements.service.js';

const authUser = {
  clerkId: 'user_123',
  email: 'sanat@example.com',
  username: null,
};

describe('AchievementsService', () => {
  it('lists the catalog and marks the ones this user has earned', async () => {
    const earnedAt = new Date('2026-09-28T18:00:00.000Z');
    const service = new AchievementsService(
      {
        achievement: {
          findMany: vi.fn().mockResolvedValue([
            {
              code: 'locked_in',
              name: 'Locked In',
              description: 'Complete your first focus session.',
              sortOrder: 1,
            },
            {
              code: 'deep_work',
              name: 'Deep Work',
              description: 'Complete a 90-minute session.',
              sortOrder: 3,
            },
          ]),
        },
        userAchievement: {
          findMany: vi.fn().mockResolvedValue([{ achievementCode: 'locked_in', earnedAt }]),
        },
      } as unknown as PrismaService,
      { getOrCreate: vi.fn().mockResolvedValue({ id: 'local-user' }) } as unknown as UsersService,
    );

    const result = await service.list(authUser);

    expect(result).toEqual([
      {
        code: 'locked_in',
        name: 'Locked In',
        description: 'Complete your first focus session.',
        earnedAt,
      },
      {
        code: 'deep_work',
        name: 'Deep Work',
        description: 'Complete a 90-minute session.',
        earnedAt: null,
      },
    ]);
  });
});
