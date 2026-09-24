import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard, type AuthenticatedRequest } from '../auth/auth.guard.js';
import { CategoriesService } from './categories.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';

@Controller('categories')
@UseGuards(AuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  list(@Req() request: AuthenticatedRequest) {
    return this.categoriesService.list(request.authUser);
  }

  @Post()
  create(@Req() request: AuthenticatedRequest, @Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(request.authUser, dto);
  }
}
