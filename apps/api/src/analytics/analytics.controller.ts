import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard, type AuthenticatedRequest } from '../auth/auth.guard.js';
import { AnalyticsService } from './analytics.service.js';

@Controller('analytics')
@UseGuards(AuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('weekly')
  weekly(@Req() request: AuthenticatedRequest) {
    return this.analyticsService.weekly(request.authUser);
  }

  @Get('categories')
  categories(@Req() request: AuthenticatedRequest) {
    return this.analyticsService.categories(request.authUser);
  }
}
