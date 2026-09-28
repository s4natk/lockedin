import { requiredXpForLevel } from '@lockedin/shared';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { UsersService } from '../users/users.service.js';
import { EnvironmentsService } from './environments.service.js';

const authUser = {
  clerkId: 'user_123',
  email: 'sanat@example.com',
  username: null,
};

const catalog = [
  {
    code: 'library',
    name: 'Library',
    description: 'A quiet room.',
    requiredLevel: 1,
    sortOrder: 1,
  },
  {
    code: 'cabin',
    name: 'Cabin',
    description: 'A mountain cabin.',
    requiredLevel: 5,
    sortOrder: 2,
  },
  {
    code: 'space_station',
    name: 'Space Station',
    description: 'In orbit.',
    requiredLevel: 10,
    sortOrder: 3,
  },
];

function serviceFor(totalXp: number) {
  return new EnvironmentsService(
    {
      environment: { findMany: vi.fn().mockResolvedValue(catalog) },
    } as unknown as PrismaService,
    {
      getOrCreate: vi.fn().mockResolvedValue({ id: 'local-user', totalXp }),
    } as unknown as UsersService,
  );
}

describe('EnvironmentsService', () => {
  it('keeps the library open at level 1 and locks the others', async () => {
    const result = await serviceFor(0).list(authUser);

    expect(result.level).toBe(1);
    expect(result.environments.map((item) => item.unlocked)).toEqual([true, false, false]);
  });

  it('unlocks the cabin at level 5 and the station at level 10', async () => {
    const atCabin = await serviceFor(requiredXpForLevel(5)).list(authUser);
    const atStation = await serviceFor(requiredXpForLevel(10)).list(authUser);

    expect(atCabin.environments.map((item) => item.unlocked)).toEqual([true, true, false]);
    expect(atStation.environments.map((item) => item.unlocked)).toEqual([true, true, true]);
  });
});
