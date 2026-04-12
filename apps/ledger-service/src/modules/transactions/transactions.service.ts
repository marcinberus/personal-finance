import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Category, Prisma, Transaction } from '../../prisma/generated/client';
import {
  TRANSACTION_CREATED,
  TRANSACTION_DELETED,
  type EventEnvelope,
  type TransactionCreatedPayload,
  type TransactionDeletedPayload,
} from '@app/contracts';
import { CorrelationIdService } from '@app/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ListTransactionsQueryDto } from './dto/list-transactions-query.dto';

export type TransactionWithCategory = Transaction & {
  category: Pick<Category, 'id' | 'name' | 'type'>;
};

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly correlationIdService: CorrelationIdService,
  ) {}

  private createOutboxEnvelope(
    payload: TransactionCreatedPayload | TransactionDeletedPayload,
    correlationId?: string,
  ): Prisma.InputJsonObject {
    const envelope: EventEnvelope & {
      payload: TransactionCreatedPayload | TransactionDeletedPayload;
    } = {
      eventId: randomUUID(),
      occurredAt: new Date().toISOString(),
      correlationId,
      payload,
    };

    return envelope as unknown as Prisma.InputJsonObject;
  }

  async create(
    userId: string,
    dto: CreateTransactionDto,
  ): Promise<TransactionWithCategory> {
    const correlationId = this.correlationIdService.getCorrelationId();

    return this.prisma.$transaction(async (tx) => {
      const category = await tx.category.findFirst({
        where: {
          id: dto.categoryId,
          userId,
        },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      if (category.type !== dto.type) {
        throw new BadRequestException(
          'Transaction type must match category type',
        );
      }

      const transaction = await tx.transaction.create({
        data: {
          userId,
          categoryId: dto.categoryId,
          amount: dto.amount.toString(),
          type: dto.type,
          description: dto.description?.trim() || null,
          transactionDate: new Date(dto.transactionDate),
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      });

      const payload: TransactionCreatedPayload = {
        transactionId: transaction.id,
        userId: transaction.userId,
        categoryId: transaction.categoryId,
        categoryName: transaction.category.name,
        amount: transaction.amount.toString(),
        type: transaction.type as 'income' | 'expense',
        description: transaction.description,
        transactionDate: transaction.transactionDate
          .toISOString()
          .substring(0, 10),
        createdAt: transaction.createdAt.toISOString(),
      };

      await tx.outboxMessage.create({
        data: {
          eventType: TRANSACTION_CREATED,
          payload: this.createOutboxEnvelope(payload, correlationId),
        },
      });

      return transaction;
    });
  }

  list(
    userId: string,
    query: ListTransactionsQueryDto,
  ): Promise<TransactionWithCategory[]> {
    const where = {
      userId,
      ...(query.type ? { type: query.type } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.from || query.to
        ? {
            transactionDate: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
    };

    return this.prisma.transaction.findMany({
      where,
      orderBy: {
        transactionDate: 'desc',
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });
  }

  async getById(userId: string, id: string): Promise<TransactionWithCategory> {
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  async remove(userId: string, id: string): Promise<{ success: boolean }> {
    const correlationId = this.correlationIdService.getCorrelationId();

    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findFirst({
        where: {
          id,
          userId,
        },
        include: {
          category: {
            select: { id: true, name: true, type: true },
          },
        },
      });

      if (!transaction) {
        throw new NotFoundException('Transaction not found');
      }

      await tx.transaction.delete({
        where: {
          id: transaction.id,
        },
      });

      const payload: TransactionDeletedPayload = {
        transactionId: id,
        userId,
        categoryId: transaction.categoryId,
        categoryName: transaction.category.name,
        amount: transaction.amount.toString(),
        type: transaction.type as 'income' | 'expense',
        transactionDate: transaction.transactionDate
          .toISOString()
          .substring(0, 10),
        deletedAt: new Date().toISOString(),
      };

      await tx.outboxMessage.create({
        data: {
          eventType: TRANSACTION_DELETED,
          payload: this.createOutboxEnvelope(payload, correlationId),
        },
      });

      return {
        success: true,
      };
    });
  }
}
