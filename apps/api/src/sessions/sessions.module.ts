import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { UsersModule } from '../users/users.module.js';
import { SessionsController } from './sessions.controller.js';
import { SessionsService } from './sessions.service.js';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [SessionsController],
  providers: [SessionsService],
})
export class SessionsModule {}
