import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Category, Transaction } from '@app/prisma/generated/client';
import { PrismaService } from '@app/prisma';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ListTransactionsQueryDto } from './dto/list-transactions-query.dto';
import { LedgerEventPublisher } from '../messaging/ledger-event-publisher.service';

export type TransactionWithCategory = Transaction & {
  category: Pick<Category, 'id' | 'name' | 'type'>;
};

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly publisher: LedgerEventPublisher,
  ) {}

  async create(
    userId: string,
    dto: CreateTransactionDto,
  ): Promise<TransactionWithCategory> {
    const category = await this.prisma.category.findFirst({
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

    const transaction = await this.prisma.transaction.create({
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

    await this.publisher.publishTransactionCreated({
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
    });

    return transaction;
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
    const transaction = await this.prisma.transaction.findFirst({
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

    await this.prisma.transaction.delete({
      where: {
        id: transaction.id,
      },
    });

    await this.publisher.publishTransactionDeleted({
      transactionId: id,
      userId,
      categoryId: transaction.categoryId,
      categoryName: transaction.category.name,
      amount: transaction.amount.toString(),
      type: transaction.type as 'income' | 'expense',
      transactionDate: transaction.transactionDate.toISOString().substring(0, 10),
      deletedAt: new Date().toISOString(),
    });

    return {
      success: true,
    };
  }
}
