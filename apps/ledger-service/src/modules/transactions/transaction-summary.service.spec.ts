import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { IdentityClientService } from '../identity/identity-client.service';
import { TransactionSummaryService } from './transaction-summary.service';

const mockPrismaService = {
  transaction: {
    findMany: jest.fn(),
  },
};

const mockIdentityClient = {
  getUserById: jest.fn(),
};

describe('TransactionSummaryService', () => {
  let service: TransactionSummaryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionSummaryService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: IdentityClientService, useValue: mockIdentityClient },
      ],
    }).compile();

    service = module.get<TransactionSummaryService>(TransactionSummaryService);

    jest.clearAllMocks();
  });

  it('should return an enriched summary with totals from the ledger', async () => {
    mockIdentityClient.getUserById.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
    });

    mockPrismaService.transaction.findMany.mockResolvedValue([
      { amount: '1000.00', type: 'income' },
      { amount: '400.00', type: 'expense' },
      { amount: '200.00', type: 'expense' },
    ]);

    const result = await service.getSummary('user-1');

    expect(result).toEqual({
      userEmail: 'user@example.com',
      totalIncome: 1000,
      totalExpenses: 600,
      balance: 400,
    });
    expect(mockIdentityClient.getUserById).toHaveBeenCalledWith('user-1');
  });

  it('should return zeros when the user has no transactions', async () => {
    mockIdentityClient.getUserById.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
    });
    mockPrismaService.transaction.findMany.mockResolvedValue([]);

    const result = await service.getSummary('user-1');

    expect(result).toEqual({
      userEmail: 'user@example.com',
      totalIncome: 0,
      totalExpenses: 0,
      balance: 0,
    });
  });

  it('should propagate NotFoundException when user is not found in identity service', async () => {
    mockIdentityClient.getUserById.mockRejectedValue(
      new NotFoundException('User not found in identity service'),
    );

    await expect(service.getSummary('unknown-user')).rejects.toThrow(
      NotFoundException,
    );
    expect(mockPrismaService.transaction.findMany).not.toHaveBeenCalled();
  });
});
