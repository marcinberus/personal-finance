import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CorrelationIdService } from '@app/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionType } from '../../prisma/generated/enums';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ListTransactionsQueryDto } from './dto/list-transactions-query.dto';
import { TRANSACTION_CREATED, TRANSACTION_DELETED } from '@app/contracts';

const mockCategory = {
  id: 'category-id-1',
  userId: 'user-id-1',
  name: 'Salary',
  type: TransactionType.income,
  createdAt: new Date(),
};

const mockTransaction = {
  id: 'transaction-id-1',
  userId: 'user-id-1',
  categoryId: 'category-id-1',
  amount: '1000.00',
  type: TransactionType.income,
  description: 'Monthly salary',
  transactionDate: new Date('2026-01-15T00:00:00.000Z'),
  createdAt: new Date(),
  category: {
    id: 'category-id-1',
    name: 'Salary',
    type: TransactionType.income,
  },
};

const mockPrismaService = {
  $transaction: jest.fn(),
  category: {
    findFirst: jest.fn(),
  },
  transaction: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    delete: jest.fn(),
  },
  outboxMessage: {
    create: jest.fn(),
  },
};

const mockCorrelationIdService = {
  getCorrelationId: jest.fn(),
};

describe('TransactionsService', () => {
  let service: TransactionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: PrismaService, useValue: mockPrismaService },
        {
          provide: CorrelationIdService,
          useValue: mockCorrelationIdService,
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);

    jest.clearAllMocks();
    mockCorrelationIdService.getCorrelationId.mockReturnValue('corr-test-1');
    mockPrismaService.$transaction.mockImplementation(
      (callback: (tx: typeof mockPrismaService) => unknown) =>
        Promise.resolve(callback(mockPrismaService)),
    );
  });

  describe('create', () => {
    const userId = 'user-id-1';
    const dto: CreateTransactionDto = {
      categoryId: 'category-id-1',
      amount: 1000,
      type: TransactionType.income,
      description: 'Monthly salary',
      transactionDate: '2026-01-15',
    };

    it('should create a transaction and return it', async () => {
      mockPrismaService.category.findFirst.mockResolvedValue(mockCategory);
      mockPrismaService.transaction.create.mockResolvedValue(mockTransaction);

      const result = await service.create(userId, dto);

      expect(mockPrismaService.category.findFirst).toHaveBeenCalledWith({
        where: { id: dto.categoryId, userId },
      });
      expect(mockPrismaService.transaction.create).toHaveBeenCalledWith({
        data: {
          userId,
          categoryId: dto.categoryId,
          amount: dto.amount.toString(),
          type: dto.type,
          description: 'Monthly salary',
          transactionDate: new Date(dto.transactionDate),
        },
        include: {
          category: { select: { id: true, name: true, type: true } },
        },
      });
      /* eslint-disable @typescript-eslint/no-unsafe-member-access */
      const createOutboxCallArg = mockPrismaService.outboxMessage.create.mock
        .calls[0]?.[0] as unknown as {
        data: {
          eventType: string;
          payload: { correlationId?: string };
        };
      };
      /* eslint-enable @typescript-eslint/no-unsafe-member-access */
      expect(createOutboxCallArg.data.eventType).toBe(TRANSACTION_CREATED);
      expect(createOutboxCallArg.data.payload.correlationId).toBe(
        'corr-test-1',
      );
      expect(result).toEqual(mockTransaction);
    });

    it('should trim whitespace from description', async () => {
      const dtoWithSpaces: CreateTransactionDto = {
        ...dto,
        description: '  Monthly salary  ',
      };
      mockPrismaService.category.findFirst.mockResolvedValue(mockCategory);
      mockPrismaService.transaction.create.mockResolvedValue(mockTransaction);

      await service.create(userId, dtoWithSpaces);

      expect(mockPrismaService.transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({ description: 'Monthly salary' }),
        }),
      );
    });

    it('should set description to null when not provided', async () => {
      const dtoWithoutDescription: CreateTransactionDto = {
        categoryId: dto.categoryId,
        amount: dto.amount,
        type: dto.type,
        transactionDate: dto.transactionDate,
      };
      mockPrismaService.category.findFirst.mockResolvedValue(mockCategory);
      mockPrismaService.transaction.create.mockResolvedValue({
        ...mockTransaction,
        description: null,
      });

      await service.create(userId, dtoWithoutDescription);

      expect(mockPrismaService.transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({ description: null }),
        }),
      );
    });

    it('should throw NotFoundException when category is not found', async () => {
      mockPrismaService.category.findFirst.mockResolvedValue(null);

      await expect(service.create(userId, dto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(userId, dto)).rejects.toThrow(
        'Category not found',
      );
      expect(mockPrismaService.transaction.create).not.toHaveBeenCalled();
      expect(mockPrismaService.outboxMessage.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when category type does not match transaction type', async () => {
      const expenseCategory = {
        ...mockCategory,
        type: TransactionType.expense,
      };
      mockPrismaService.category.findFirst.mockResolvedValue(expenseCategory);

      const dtoWithMismatch: CreateTransactionDto = {
        ...dto,
        type: TransactionType.income,
      };

      await expect(service.create(userId, dtoWithMismatch)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(userId, dtoWithMismatch)).rejects.toThrow(
        'Transaction type must match category type',
      );
      expect(mockPrismaService.transaction.create).not.toHaveBeenCalled();
      expect(mockPrismaService.outboxMessage.create).not.toHaveBeenCalled();
    });
  });

  describe('list', () => {
    const userId = 'user-id-1';

    it('should return all transactions for the user when no filters are applied', async () => {
      const transactions = [mockTransaction];
      mockPrismaService.transaction.findMany.mockResolvedValue(transactions);

      const query: ListTransactionsQueryDto = {};
      const result = await service.list(userId, query);

      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { transactionDate: 'desc' },
        include: {
          category: { select: { id: true, name: true, type: true } },
        },
      });
      expect(result).toEqual(transactions);
    });

    it('should filter by type', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue([
        mockTransaction,
      ]);

      const query: ListTransactionsQueryDto = { type: TransactionType.income };
      await service.list(userId, query);

      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledWith({
        where: { userId, type: TransactionType.income },
        orderBy: { transactionDate: 'desc' },
        include: {
          category: { select: { id: true, name: true, type: true } },
        },
      });
    });

    it('should filter by categoryId', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue([
        mockTransaction,
      ]);

      const query: ListTransactionsQueryDto = { categoryId: 'category-id-1' };
      await service.list(userId, query);

      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledWith({
        where: { userId, categoryId: 'category-id-1' },
        orderBy: { transactionDate: 'desc' },
        include: {
          category: { select: { id: true, name: true, type: true } },
        },
      });
    });

    it('should filter by from date', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue([
        mockTransaction,
      ]);

      const from = '2026-01-01';
      const query: ListTransactionsQueryDto = { from };
      await service.list(userId, query);

      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          transactionDate: { gte: new Date(from) },
        },
        orderBy: { transactionDate: 'desc' },
        include: {
          category: { select: { id: true, name: true, type: true } },
        },
      });
    });

    it('should filter by to date', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue([
        mockTransaction,
      ]);

      const to = '2026-01-31';
      const query: ListTransactionsQueryDto = { to };
      await service.list(userId, query);

      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          transactionDate: { lte: new Date(to) },
        },
        orderBy: { transactionDate: 'desc' },
        include: {
          category: { select: { id: true, name: true, type: true } },
        },
      });
    });

    it('should apply combined type and date range filters', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue([
        mockTransaction,
      ]);

      const from = '2026-01-01';
      const to = '2026-01-31';
      const query: ListTransactionsQueryDto = {
        type: TransactionType.income,
        from,
        to,
      };
      await service.list(userId, query);

      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          type: TransactionType.income,
          transactionDate: {
            gte: new Date(from),
            lte: new Date(to),
          },
        },
        orderBy: { transactionDate: 'desc' },
        include: {
          category: { select: { id: true, name: true, type: true } },
        },
      });
    });

    it('should return an empty array when the user has no transactions', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue([]);

      const result = await service.list(userId, {});

      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    const userId = 'user-id-1';
    const id = 'transaction-id-1';

    it('should return the transaction when found', async () => {
      mockPrismaService.transaction.findFirst.mockResolvedValue(
        mockTransaction,
      );

      const result = await service.getById(userId, id);

      expect(mockPrismaService.transaction.findFirst).toHaveBeenCalledWith({
        where: { id, userId },
        include: {
          category: { select: { id: true, name: true, type: true } },
        },
      });
      expect(result).toEqual(mockTransaction);
    });

    it('should throw NotFoundException when transaction is not found', async () => {
      mockPrismaService.transaction.findFirst.mockResolvedValue(null);

      await expect(service.getById(userId, id)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getById(userId, id)).rejects.toThrow(
        'Transaction not found',
      );
    });
  });

  describe('remove', () => {
    const userId = 'user-id-1';
    const id = 'transaction-id-1';

    it('should delete the transaction and return success', async () => {
      mockPrismaService.transaction.findFirst.mockResolvedValue(
        mockTransaction,
      );
      mockPrismaService.transaction.delete.mockResolvedValue(undefined);

      const result = await service.remove(userId, id);

      expect(mockPrismaService.transaction.findFirst).toHaveBeenCalledWith({
        where: { id, userId },
        include: { category: { select: { id: true, name: true, type: true } } },
      });
      expect(mockPrismaService.transaction.delete).toHaveBeenCalledWith({
        where: { id },
      });
      /* eslint-disable @typescript-eslint/no-unsafe-member-access */
      const deleteOutboxCallArg = mockPrismaService.outboxMessage.create.mock
        .calls[0]?.[0] as unknown as {
        data: {
          eventType: string;
          payload: { correlationId?: string };
        };
      };
      /* eslint-enable @typescript-eslint/no-unsafe-member-access */
      expect(deleteOutboxCallArg.data.eventType).toBe(TRANSACTION_DELETED);
      expect(deleteOutboxCallArg.data.payload.correlationId).toBe(
        'corr-test-1',
      );
      expect(result).toEqual({ success: true });
    });

    it('should throw NotFoundException when transaction is not found', async () => {
      mockPrismaService.transaction.findFirst.mockResolvedValue(null);

      await expect(service.remove(userId, id)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.remove(userId, id)).rejects.toThrow(
        'Transaction not found',
      );
      expect(mockPrismaService.transaction.delete).not.toHaveBeenCalled();
      expect(mockPrismaService.outboxMessage.create).not.toHaveBeenCalled();
    });
  });
});
