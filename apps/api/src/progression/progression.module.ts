import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { UsersModule } from '../users/users.module.js';
import { ProgressionController } from './progression.controller.js';
import { ProgressionService } from './progression.service.js';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [ProgressionController],
  providers: [ProgressionService],
})
export class ProgressionModule {}
