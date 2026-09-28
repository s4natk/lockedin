import { Injectable } from '@nestjs/common';
import { levelFromTotalXp } from '@lockedin/shared';
import type { AuthUser } from '../auth/auth.types.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsersService } from '../users/users.service.js';

@Injectable()
export class EnvironmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async list(authUser: AuthUser) {
    const user = await this.usersService.getOrCreate(authUser);
    const level = levelFromTotalXp(user.totalXp);
    const environments = await this.prisma.environment.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    return {
      level,
      environments: environments.map((item) => ({
        code: item.code,
        name: item.name,
        description: item.description,
        requiredLevel: item.requiredLevel,
        unlocked: level >= item.requiredLevel,
      })),
    };
  }
}
