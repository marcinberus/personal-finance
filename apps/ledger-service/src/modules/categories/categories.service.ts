import { ConflictException, Injectable } from '@nestjs/common';
import { CorrelationIdService } from '@app/common';
import { Category } from '../../prisma/generated/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { ListCategoriesQueryDto } from './dto/list-categories-query.dto';
import { LedgerEventPublisher } from '../messaging/ledger-event-publisher.service';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly publisher: LedgerEventPublisher,
    private readonly correlationIdService: CorrelationIdService,
  ) {}

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

    const category = await this.prisma.category.create({
      data: {
        userId,
        name: normalizedName,
        type: dto.type,
      },
    });

    await this.publisher.publishCategoryCreated(
      {
        categoryId: category.id,
        userId: category.userId,
        name: category.name,
        type: category.type as 'income' | 'expense',
        createdAt: category.createdAt.toISOString(),
      },
      this.correlationIdService.getCorrelationId(),
    );

    return category;
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
