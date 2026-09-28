import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { UsersModule } from '../users/users.module.js';
import { EnvironmentsController } from './environments.controller.js';
import { EnvironmentsService } from './environments.service.js';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [EnvironmentsController],
  providers: [EnvironmentsService],
})
export class EnvironmentsModule {}
