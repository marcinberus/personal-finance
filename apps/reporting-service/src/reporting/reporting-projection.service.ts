import { Injectable } from '@nestjs/common';
import { TransactionCreatedPayload, TransactionDeletedPayload } from '@app/contracts';
import { PrismaService } from '../prisma/prisma.service';

function extractYearMonth(dateStr: string): { year: number; month: number } {
  const [year, month] = dateStr.substring(0, 7).split('-').map(Number);
  return { year, month };
}

@Injectable()
export class ReportingProjectionService {
  constructor(private readonly prisma: PrismaService) {}

  async applyTransactionCreated(payload: TransactionCreatedPayload): Promise<void> {
    const { year, month } = extractYearMonth(payload.transactionDate);
    const amount = payload.amount;
    const isIncome = payload.type === 'income';

    await this.prisma.monthlyReportProjection.upsert({
      where: { userId_year_month: { userId: payload.userId, year, month } },
      create: {
        userId: payload.userId,
        year,
        month,
        incomeTotal: isIncome ? amount : 0,
        expenseTotal: isIncome ? 0 : amount,
      },
      update: isIncome
        ? { incomeTotal: { increment: amount } }
        : { expenseTotal: { increment: amount } },
    });

    if (!isIncome) {
      await this.prisma.categorySpendProjection.upsert({
        where: {
          userId_categoryId_year_month: {
            userId: payload.userId,
            categoryId: payload.categoryId,
            year,
            month,
          },
        },
        create: {
          userId: payload.userId,
          categoryId: payload.categoryId,
          categoryName: payload.categoryName,
          year,
          month,
          total: amount,
        },
        update: {
          total: { increment: amount },
          categoryName: payload.categoryName,
        },
      });
    }
  }

  async applyTransactionDeleted(payload: TransactionDeletedPayload): Promise<void> {
    const { year, month } = extractYearMonth(payload.transactionDate);
    const amount = payload.amount;
    const isIncome = payload.type === 'income';

    await this.prisma.monthlyReportProjection.updateMany({
      where: { userId: payload.userId, year, month },
      data: isIncome
        ? { incomeTotal: { decrement: amount } }
        : { expenseTotal: { decrement: amount } },
    });

    if (!isIncome) {
      await this.prisma.categorySpendProjection.updateMany({
        where: {
          userId: payload.userId,
          categoryId: payload.categoryId,
          year,
          month,
        },
        data: { total: { decrement: amount } },
      });
    }
  }
}
