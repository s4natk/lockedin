import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard, type AuthenticatedRequest } from '../auth/auth.guard.js';
import { ProgressionService } from './progression.service.js';

@Controller('progression')
@UseGuards(AuthGuard)
export class ProgressionController {
  constructor(private readonly progressionService: ProgressionService) {}

  @Get()
  get(@Req() request: AuthenticatedRequest) {
    return this.progressionService.get(request.authUser);
  }
}
