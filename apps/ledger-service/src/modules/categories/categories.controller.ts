import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, JwtGuard } from '@app/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { ListCategoriesQueryDto } from './dto/list-categories-query.dto';
import { CategoriesService } from './categories.service';
import { Category } from '../../prisma/generated/client';

@ApiTags('categories')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  create(
    @CurrentUser() user: { id: string; email: string },
    @Body() dto: CreateCategoryDto,
  ): Promise<Category> {
    return this.categoriesService.create(user.id, dto);
  }

  @Get()
  list(
    @CurrentUser() user: { id: string; email: string },
    @Query() query: ListCategoriesQueryDto,
  ): Promise<Category[]> {
    return this.categoriesService.list(user.id, query);
  }
}
