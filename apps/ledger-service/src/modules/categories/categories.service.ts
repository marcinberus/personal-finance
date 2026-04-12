import { ConflictException, Injectable } from '@nestjs/common';
import { CorrelationIdService } from '@app/common';
import {
  CATEGORY_CREATED,
  type CategoryCreatedPayload,
  type EventEnvelope,
} from '@app/contracts';
import { Category, Prisma } from '../../prisma/generated/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { ListCategoriesQueryDto } from './dto/list-categories-query.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly correlationIdService: CorrelationIdService,
  ) {}

  private createOutboxEnvelope(
    payload: CategoryCreatedPayload,
    correlationId?: string,
  ): Prisma.InputJsonObject {
    const envelope: EventEnvelope & { payload: CategoryCreatedPayload } = {
      eventId: randomUUID(),
      occurredAt: new Date().toISOString(),
      correlationId,
      payload,
    };

    return envelope as unknown as Prisma.InputJsonObject;
  }

  async create(userId: string, dto: CreateCategoryDto): Promise<Category> {
    const normalizedName = dto.name.trim();
    const correlationId = this.correlationIdService.getCorrelationId();

    return this.prisma.$transaction(async (tx) => {
      const existingCategory = await tx.category.findFirst({
        where: {
          userId,
          type: dto.type,
          name: normalizedName,
        },
      });

      if (existingCategory) {
        throw new ConflictException('Category with this name already exists');
      }

      const category = await tx.category.create({
        data: {
          userId,
          name: normalizedName,
          type: dto.type,
        },
      });

      await tx.outboxMessage.create({
        data: {
          eventType: CATEGORY_CREATED,
          payload: this.createOutboxEnvelope(
            {
              categoryId: category.id,
              userId: category.userId,
              name: category.name,
              type: category.type as 'income' | 'expense',
              createdAt: category.createdAt.toISOString(),
            },
            correlationId,
          ),
        },
      });

      return category;
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
