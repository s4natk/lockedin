import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../auth/auth.types.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsersService } from '../users/users.service.js';
import type { CreateTaskDto } from './dto/create-task.dto.js';
import type { UpdateTaskDto } from './dto/update-task.dto.js';

const taskSelect = {
  id: true,
  title: true,
  completed: true,
  estimatedSessions: true,
  categoryId: true,
  createdAt: true,
  completedAt: true,
  category: { select: { id: true, name: true } },
} as const;

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async list(authUser: AuthUser) {
    const user = await this.usersService.getOrCreate(authUser);

    return this.prisma.task.findMany({
      where: { userId: user.id },
      select: taskSelect,
      orderBy: [{ completed: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async create(authUser: AuthUser, dto: CreateTaskDto) {
    const user = await this.usersService.getOrCreate(authUser);
    await this.requireOwnCategory(user.id, dto.categoryId);

    return this.prisma.task.create({
      data: {
        userId: user.id,
        categoryId: dto.categoryId,
        title: dto.title.trim(),
        estimatedSessions: dto.estimatedSessions,
      },
      select: taskSelect,
    });
  }

  async update(authUser: AuthUser, taskId: string, dto: UpdateTaskDto) {
    const user = await this.usersService.getOrCreate(authUser);
    await this.requireOwnTask(user.id, taskId);

    if (dto.categoryId) {
      await this.requireOwnCategory(user.id, dto.categoryId);
    }

    return this.prisma.task.update({
      where: { id: taskId },
      data: {
        title: dto.title?.trim(),
        categoryId: dto.categoryId,
        estimatedSessions: dto.estimatedSessions,
        completed: dto.completed,
        completedAt:
          dto.completed === undefined ? undefined : dto.completed ? new Date() : null,
      },
      select: taskSelect,
    });
  }

  async remove(authUser: AuthUser, taskId: string) {
    const user = await this.usersService.getOrCreate(authUser);
    await this.requireOwnTask(user.id, taskId);
    await this.prisma.task.delete({ where: { id: taskId } });
  }

  private async requireOwnCategory(userId: string, categoryId: string) {
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, userId },
      select: { id: true },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }
  }

  private async requireOwnTask(userId: string, taskId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, userId },
      select: { id: true },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }
  }
}
