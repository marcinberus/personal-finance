import { ConflictException, Injectable } from '@nestjs/common';
import { Category } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { ListCategoriesQueryDto } from './dto/list-categories-query.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateCategoryDto): Promise<Category> {
    const normalizedName = dto.name.trim();

    const existingCategory = await this.prisma.category.findFirst({
      where: {
        userId,
        type: dto.type,
        name: normalizedName,
      },
    });

    if (existingCategory) {
      throw new ConflictException('Category with this name already exists');
    }

    return this.prisma.category.create({
      data: {
        userId,
        name: normalizedName,
        type: dto.type,
      },
    });
  }

  list(userId: string, query: ListCategoriesQueryDto): Promise<Category[]> {
    return this.prisma.category.findMany({
      where: {
        userId,
        ...(query.type ? { type: query.type } : {}),
      },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });
  }
}
