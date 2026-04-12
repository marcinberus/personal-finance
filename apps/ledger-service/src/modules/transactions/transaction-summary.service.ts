import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IdentityClientService } from '../identity/identity-client.service';
import { TransactionSummaryDto } from './dto/transaction-summary.dto';

@Injectable()
export class TransactionSummaryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly identityClient: IdentityClientService,
  ) {}

  async getSummary(userId: string): Promise<TransactionSummaryDto> {
    const user = await this.identityClient.getUserById(userId);

    const transactions = await this.prisma.transaction.findMany({
      where: { userId },
      select: { amount: true, type: true },
    });

    let totalIncome = 0;
    let totalExpenses = 0;

    for (const tx of transactions) {
      const amount = parseFloat(tx.amount.toString());
      if (tx.type === 'income') {
        totalIncome += amount;
      } else {
        totalExpenses += amount;
      }
    }

    return {
      userEmail: user.email,
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
    };
  }
}
