import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ListTransactionsQueryDto } from './dto/list-transactions-query.dto';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateTransactionDto) {
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

    return this.prisma.transaction.create({
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
  }

  list(userId: string, query: ListTransactionsQueryDto) {
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

  async getById(userId: string, id: string) {
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

  async remove(userId: string, id: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        id,
        userId,
      },
      select: {
        id: true,
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

    return {
      success: true,
    };
  }
}
