import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard, type AuthenticatedRequest } from '../auth/auth.guard.js';
import { EnvironmentsService } from './environments.service.js';

@Controller('environments')
@UseGuards(AuthGuard)
export class EnvironmentsController {
  constructor(private readonly environmentsService: EnvironmentsService) {}

  @Get()
  list(@Req() request: AuthenticatedRequest) {
    return this.environmentsService.list(request.authUser);
  }
}
