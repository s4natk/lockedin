import type { PrismaService } from '../prisma/prisma.service.js';
import type { UsersService } from '../users/users.service.js';
import { DashboardService } from './dashboard.service.js';

const authUser = {
  clerkId: 'user_123',
  email: 'sanat@example.com',
  username: null,
};

describe('DashboardService', () => {
  it('sums completed focus time for today and keeps the lists on this user', async () => {
    const aggregate = vi.fn().mockResolvedValue({
      _sum: { actualDuration: 150 * 60 },
      _count: 2,
    });
    const findTasks = vi.fn().mockResolvedValue([]);
    const findSessions = vi.fn().mockResolvedValue([]);
    const service = new DashboardService(
      {
        focusSession: { aggregate, findMany: findSessions },
        task: { findMany: findTasks },
      } as unknown as PrismaService,
      { getOrCreate: vi.fn().mockResolvedValue({ id: 'local-user' }) } as unknown as UsersService,
    );

    const result = await service.get(authUser);

    expect(aggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 'local-user', status: 'completed' }),
      }),
    );
    expect(findTasks).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ userId: 'local-user' }) }));
    expect(findSessions).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'local-user' }, take: 5 }),
    );
    expect(result.focusedMinutes).toBe(150);
    expect(result.sessionCount).toBe(2);
  });
});
