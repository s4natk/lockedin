import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard, type AuthenticatedRequest } from '../auth/auth.guard.js';
import { StartSessionDto } from './dto/start-session.dto.js';
import { SessionsService } from './sessions.service.js';

@Controller('sessions')
@UseGuards(AuthGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  list(@Req() request: AuthenticatedRequest) {
    return this.sessionsService.list(request.authUser);
  }

  @Get('active')
  active(@Req() request: AuthenticatedRequest) {
    return this.sessionsService.active(request.authUser);
  }

  @Post('start')
  start(@Req() request: AuthenticatedRequest, @Body() dto: StartSessionDto) {
    return this.sessionsService.start(request.authUser, dto);
  }

  @Post(':id/pause')
  pause(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.sessionsService.pause(request.authUser, id);
  }

  @Post(':id/resume')
  resume(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.sessionsService.resume(request.authUser, id);
  }

  @Post(':id/complete')
  complete(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.sessionsService.complete(request.authUser, id);
  }

  @Post(':id/cancel')
  cancel(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.sessionsService.cancel(request.authUser, id);
  }
}
