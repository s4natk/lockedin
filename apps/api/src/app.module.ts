import { Module } from '@nestjs/common';
import { CategoriesModule } from './categories/categories.module.js';
import { HealthModule } from './health/health.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ProgressionModule } from './progression/progression.module.js';
import { SessionsModule } from './sessions/sessions.module.js';
import { TasksModule } from './tasks/tasks.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    PrismaModule,
    HealthModule,
    UsersModule,
    CategoriesModule,
    TasksModule,
    SessionsModule,
    ProgressionModule,
  ],
})
export class AppModule {}
