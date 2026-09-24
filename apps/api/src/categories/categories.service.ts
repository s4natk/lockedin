import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import type { AuthUser } from '../auth/auth.types.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsersService } from '../users/users.service.js';
import type { CreateCategoryDto } from './dto/create-category.dto.js';

const categorySelect = {
  id: true,
  name: true,
  createdAt: true,
} as const;

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async list(authUser: AuthUser) {
    const user = await this.usersService.getOrCreate(authUser);

    return this.prisma.category.findMany({
      where: { userId: user.id },
      select: categorySelect,
      orderBy: { name: 'asc' },
    });
  }

  async create(authUser: AuthUser, dto: CreateCategoryDto) {
    const user = await this.usersService.getOrCreate(authUser);
    const name = dto.name.trim();

    try {
      return await this.prisma.category.create({
        data: { userId: user.id, name },
        select: categorySelect,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('You already have a category with that name');
      }

      throw error;
    }
  }
}
