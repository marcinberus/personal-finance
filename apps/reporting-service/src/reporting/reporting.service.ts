import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MonthlyReportQueryDto } from './dto/monthly-report-query.dto';
import { MonthlyReportDto } from './dto/monthly-report.dto';
import { CategorySpendQueryDto } from './dto/category-spend-query.dto';
import { CategorySpendItemDto } from './dto/category-spend-item.dto';

function toFixed2(value: unknown): string {
  return parseFloat(String(value)).toFixed(2);
}

@Injectable()
export class ReportingService {
  constructor(private readonly prisma: PrismaService) {}

  async getMonthlyReport(
    userId: string,
    query: MonthlyReportQueryDto,
  ): Promise<MonthlyReportDto> {
    if (query.month !== undefined) {
      const row = await this.prisma.monthlyReportProjection.findUnique({
        where: {
          userId_year_month: { userId, year: query.year, month: query.month },
        },
      });

      const income = parseFloat(String(row?.incomeTotal ?? 0));
      const expense = parseFloat(String(row?.expenseTotal ?? 0));

      return {
        year: query.year,
        month: query.month,
        incomeTotal: income.toFixed(2),
        expenseTotal: expense.toFixed(2),
        balance: (income - expense).toFixed(2),
      };
    }

    // Year-to-date: aggregate all months for the year
    const rows = await this.prisma.monthlyReportProjection.findMany({
      where: { userId, year: query.year },
    });

    const income = rows.reduce(
      (acc, r) => acc + parseFloat(String(r.incomeTotal)),
      0,
    );
    const expense = rows.reduce(
      (acc, r) => acc + parseFloat(String(r.expenseTotal)),
      0,
    );

    return {
      year: query.year,
      month: null,
      incomeTotal: income.toFixed(2),
      expenseTotal: expense.toFixed(2),
      balance: (income - expense).toFixed(2),
    };
  }

  async getCategorySpend(
    userId: string,
    query: CategorySpendQueryDto,
  ): Promise<CategorySpendItemDto[]> {
    const rows = await this.prisma.categorySpendProjection.findMany({
      where: { userId, year: query.year, month: query.month },
      orderBy: { total: 'desc' },
    });

    return rows.map((r) => ({
      categoryId: r.categoryId,
      categoryName: r.categoryName,
      total: toFixed2(r.total),
    }));
  }
}
