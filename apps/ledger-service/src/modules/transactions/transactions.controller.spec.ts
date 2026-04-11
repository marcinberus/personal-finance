import { Test, TestingModule } from '@nestjs/testing';
import { TransactionType } from '@app/prisma/generated/enums';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ListTransactionsQueryDto } from './dto/list-transactions-query.dto';

const mockCurrentUser = { id: 'user-id-1', email: 'test@example.com' };

const mockTransaction = {
  id: 'transaction-id-1',
  userId: mockCurrentUser.id,
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

const mockTransactionsService = {
  create: jest.fn(),
  list: jest.fn(),
  getById: jest.fn(),
  remove: jest.fn(),
};

describe('TransactionsController', () => {
  let controller: TransactionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [
        { provide: TransactionsService, useValue: mockTransactionsService },
      ],
    }).compile();

    controller = module.get<TransactionsController>(TransactionsController);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should call transactionsService.create with userId from JWT and return the transaction', async () => {
      const dto: CreateTransactionDto = {
        categoryId: 'category-id-1',
        amount: 1000,
        type: TransactionType.income,
        description: 'Monthly salary',
        transactionDate: '2026-01-15',
      };
      mockTransactionsService.create.mockResolvedValue(mockTransaction);

      const result = await controller.create(mockCurrentUser, dto);

      expect(mockTransactionsService.create).toHaveBeenCalledWith(
        mockCurrentUser.id,
        dto,
      );
      expect(result).toEqual(mockTransaction);
    });
  });

  describe('list', () => {
    it('should call transactionsService.list with userId and query and return results', async () => {
      const transactions = [mockTransaction];
      const query: ListTransactionsQueryDto = { type: TransactionType.income };
      mockTransactionsService.list.mockResolvedValue(transactions);

      const result = await controller.list(mockCurrentUser, query);

      expect(mockTransactionsService.list).toHaveBeenCalledWith(
        mockCurrentUser.id,
        query,
      );
      expect(result).toEqual(transactions);
    });

    it('should pass an empty query when no filters are provided', async () => {
      const transactions = [mockTransaction];
      const query: ListTransactionsQueryDto = {};
      mockTransactionsService.list.mockResolvedValue(transactions);

      const result = await controller.list(mockCurrentUser, query);

      expect(mockTransactionsService.list).toHaveBeenCalledWith(
        mockCurrentUser.id,
        query,
      );
      expect(result).toEqual(transactions);
    });
  });

  describe('getById', () => {
    it('should call transactionsService.getById with userId and id and return the transaction', async () => {
      mockTransactionsService.getById.mockResolvedValue(mockTransaction);

      const result = await controller.getById(
        mockCurrentUser,
        'transaction-id-1',
      );

      expect(mockTransactionsService.getById).toHaveBeenCalledWith(
        mockCurrentUser.id,
        'transaction-id-1',
      );
      expect(result).toEqual(mockTransaction);
    });
  });

  describe('remove', () => {
    it('should call transactionsService.remove with userId and id and return success', async () => {
      mockTransactionsService.remove.mockResolvedValue({ success: true });

      const result = await controller.remove(
        mockCurrentUser,
        'transaction-id-1',
      );

      expect(mockTransactionsService.remove).toHaveBeenCalledWith(
        mockCurrentUser.id,
        'transaction-id-1',
      );
      expect(result).toEqual({ success: true });
    });
  });
});
