import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaModule, PrismaService } from '@app/prisma';
import { TransactionsModule } from '../../../../src/modules/transactions/transactions.module';
import { TransactionsService } from '../../../../src/modules/transactions/transactions.service';
import { CategoryType, TransactionType } from '@app/prisma/generated/enums';
import { cleanDatabase } from '../database';

describe('TransactionsService (integration)', () => {
  let moduleRef: TestingModule;
  let transactionsService: TransactionsService;
  let prisma: PrismaService;
  let userId: string;
  let categoryId: string;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        PrismaModule,
        TransactionsModule,
      ],
    }).compile();

    transactionsService = moduleRef.get(TransactionsService);
    prisma = moduleRef.get(PrismaService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);

    const user = await prisma.user.create({
      data: {
        email: 'transactions-test@example.com',
        passwordHash: 'hash',
      },
    });
    userId = user.id;

    const category = await prisma.category.create({
      data: {
        userId,
        name: 'Salary',
        type: CategoryType.income,
      },
    });
    categoryId = category.id;
  });

  describe('create', () => {
    it('persists a new transaction and returns it with category included', async () => {
      const transaction = await transactionsService.create(userId, {
        categoryId,
        amount: 1000,
        type: TransactionType.income,
        description: 'Monthly salary',
        transactionDate: '2026-01-15',
      });

      expect(transaction.id).toBeDefined();
      expect(transaction.userId).toBe(userId);
      expect(transaction.categoryId).toBe(categoryId);
      expect(Number(transaction.amount)).toBe(1000);
      expect(transaction.type).toBe(TransactionType.income);
      expect(transaction.description).toBe('Monthly salary');
      expect(transaction.transactionDate).toBeInstanceOf(Date);
      expect(transaction.createdAt).toBeInstanceOf(Date);
      expect(transaction.category).toMatchObject({
        id: categoryId,
        name: 'Salary',
        type: CategoryType.income,
      });
    });

    it('trims whitespace from the description before persisting', async () => {
      const transaction = await transactionsService.create(userId, {
        categoryId,
        amount: 500,
        type: TransactionType.income,
        description: '  Freelance work  ',
        transactionDate: '2026-01-20',
      });

      expect(transaction.description).toBe('Freelance work');
    });

    it('stores null description when not provided', async () => {
      const transaction = await transactionsService.create(userId, {
        categoryId,
        amount: 200,
        type: TransactionType.income,
        transactionDate: '2026-01-10',
      });

      expect(transaction.description).toBeNull();
    });

    it('assigns distinct UUIDs to different transactions', async () => {
      const first = await transactionsService.create(userId, {
        categoryId,
        amount: 100,
        type: TransactionType.income,
        transactionDate: '2026-01-01',
      });

      const second = await transactionsService.create(userId, {
        categoryId,
        amount: 200,
        type: TransactionType.income,
        transactionDate: '2026-01-02',
      });

      expect(first.id).not.toBe(second.id);
    });

    it('throws NotFoundException when the category does not exist', async () => {
      await expect(
        transactionsService.create(userId, {
          categoryId: '00000000-0000-0000-0000-000000000000',
          amount: 100,
          type: TransactionType.income,
          transactionDate: '2026-01-01',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when the category belongs to another user', async () => {
      const otherUser = await prisma.user.create({
        data: { email: 'other@example.com', passwordHash: 'hash' },
      });
      const otherCategory = await prisma.category.create({
        data: {
          userId: otherUser.id,
          name: 'Other Salary',
          type: CategoryType.income,
        },
      });

      await expect(
        transactionsService.create(userId, {
          categoryId: otherCategory.id,
          amount: 100,
          type: TransactionType.income,
          transactionDate: '2026-01-01',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when category type does not match transaction type', async () => {
      const expenseCategory = await prisma.category.create({
        data: {
          userId,
          name: 'Rent',
          type: CategoryType.expense,
        },
      });

      await expect(
        transactionsService.create(userId, {
          categoryId: expenseCategory.id,
          amount: 100,
          type: TransactionType.income,
          transactionDate: '2026-01-01',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('list', () => {
    beforeEach(async () => {
      // Seed three transactions for the primary user
      await transactionsService.create(userId, {
        categoryId,
        amount: 3000,
        type: TransactionType.income,
        description: 'Salary Jan',
        transactionDate: '2026-01-15',
      });
      await transactionsService.create(userId, {
        categoryId,
        amount: 500,
        type: TransactionType.income,
        description: 'Freelance Jan',
        transactionDate: '2026-01-20',
      });

      const expenseCategory = await prisma.category.create({
        data: {
          userId,
          name: 'Rent',
          type: CategoryType.expense,
        },
      });
      await transactionsService.create(userId, {
        categoryId: expenseCategory.id,
        amount: 1200,
        type: TransactionType.expense,
        description: 'Rent Jan',
        transactionDate: '2026-01-05',
      });
    });

    it('returns all transactions for the user ordered by transactionDate desc', async () => {
      const result = await transactionsService.list(userId, {});

      expect(result).toHaveLength(3);
      // Ordered by transactionDate DESC: Jan 20 → Jan 15 → Jan 05
      expect(result[0].description).toBe('Freelance Jan');
      expect(result[1].description).toBe('Salary Jan');
      expect(result[2].description).toBe('Rent Jan');
    });

    it('filters by type', async () => {
      const result = await transactionsService.list(userId, {
        type: TransactionType.income,
      });

      expect(result).toHaveLength(2);
      result.forEach((t) => expect(t.type).toBe(TransactionType.income));
    });

    it('filters by categoryId', async () => {
      const result = await transactionsService.list(userId, {
        categoryId,
      });

      expect(result).toHaveLength(2);
      result.forEach((t) => expect(t.categoryId).toBe(categoryId));
    });

    it('filters by from date (inclusive)', async () => {
      const result = await transactionsService.list(userId, {
        from: '2026-01-15',
      });

      expect(result).toHaveLength(2);
      result.forEach((t) =>
        expect(t.transactionDate.getTime()).toBeGreaterThanOrEqual(
          new Date('2026-01-15').getTime(),
        ),
      );
    });

    it('filters by to date (inclusive)', async () => {
      const result = await transactionsService.list(userId, {
        to: '2026-01-15',
      });

      expect(result).toHaveLength(2);
      result.forEach((t) =>
        expect(t.transactionDate.getTime()).toBeLessThanOrEqual(
          new Date('2026-01-15').getTime(),
        ),
      );
    });

    it('does not return transactions belonging to another user', async () => {
      const otherUser = await prisma.user.create({
        data: { email: 'other-list@example.com', passwordHash: 'hash' },
      });
      const otherCategory = await prisma.category.create({
        data: {
          userId: otherUser.id,
          name: 'Other Income',
          type: CategoryType.income,
        },
      });
      await transactionsService.create(otherUser.id, {
        categoryId: otherCategory.id,
        amount: 9999,
        type: TransactionType.income,
        transactionDate: '2026-01-10',
      });

      const result = await transactionsService.list(userId, {});

      expect(result).toHaveLength(3);
      result.forEach((t) => expect(t.userId).toBe(userId));
    });
  });

  describe('getById', () => {
    it('returns the transaction when found', async () => {
      const created = await transactionsService.create(userId, {
        categoryId,
        amount: 800,
        type: TransactionType.income,
        transactionDate: '2026-01-12',
      });

      const result = await transactionsService.getById(userId, created.id);

      expect(result.id).toBe(created.id);
      expect(result.userId).toBe(userId);
      expect(result.category).toBeDefined();
    });

    it('throws NotFoundException when the transaction does not exist', async () => {
      await expect(
        transactionsService.getById(
          userId,
          '00000000-0000-0000-0000-000000000000',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when the transaction belongs to another user', async () => {
      const otherUser = await prisma.user.create({
        data: { email: 'other-get@example.com', passwordHash: 'hash' },
      });
      const otherCategory = await prisma.category.create({
        data: {
          userId: otherUser.id,
          name: 'Other Income',
          type: CategoryType.income,
        },
      });
      const otherTransaction = await transactionsService.create(otherUser.id, {
        categoryId: otherCategory.id,
        amount: 100,
        type: TransactionType.income,
        transactionDate: '2026-01-01',
      });

      await expect(
        transactionsService.getById(userId, otherTransaction.id),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deletes the transaction and returns { success: true }', async () => {
      const created = await transactionsService.create(userId, {
        categoryId,
        amount: 300,
        type: TransactionType.income,
        transactionDate: '2026-01-08',
      });

      const result = await transactionsService.remove(userId, created.id);

      expect(result).toEqual({ success: true });

      const remaining = await transactionsService.list(userId, {});
      expect(remaining.find((t) => t.id === created.id)).toBeUndefined();
    });

    it('throws NotFoundException when the transaction does not exist', async () => {
      await expect(
        transactionsService.remove(
          userId,
          '00000000-0000-0000-0000-000000000000',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when the transaction belongs to another user', async () => {
      const otherUser = await prisma.user.create({
        data: { email: 'other-remove@example.com', passwordHash: 'hash' },
      });
      const otherCategory = await prisma.category.create({
        data: {
          userId: otherUser.id,
          name: 'Other Income',
          type: CategoryType.income,
        },
      });
      const otherTransaction = await transactionsService.create(otherUser.id, {
        categoryId: otherCategory.id,
        amount: 100,
        type: TransactionType.income,
        transactionDate: '2026-01-01',
      });

      await expect(
        transactionsService.remove(userId, otherTransaction.id),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
