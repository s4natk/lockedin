import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../auth/auth.types.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  getOrCreate(authUser: AuthUser) {
    return this.prisma.user.upsert({
      where: { clerkId: authUser.clerkId },
      create: {
        clerkId: authUser.clerkId,
        email: authUser.email,
        username: authUser.username,
      },
      update: {
        email: authUser.email,
        username: authUser.username,
      },
      select: {
        id: true,
        clerkId: true,
        username: true,
        email: true,
        totalXp: true,
        currentStreak: true,
        longestStreak: true,
        lastActiveDate: true,
        createdAt: true,
      },
    });
  }
}
