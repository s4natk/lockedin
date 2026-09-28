import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard, type AuthenticatedRequest } from '../auth/auth.guard.js';
import { AchievementsService } from './achievements.service.js';

@Controller('achievements')
@UseGuards(AuthGuard)
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Get()
  list(@Req() request: AuthenticatedRequest) {
    return this.achievementsService.list(request.authUser);
  }
}
