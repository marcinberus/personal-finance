import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { ConflictException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CorrelationIdModule } from '@app/common';
import { PrismaModule } from '../../../../src/prisma/prisma.module';
import { PrismaService } from '../../../../src/prisma/prisma.service';
import { CategoriesService } from '../../../../src/modules/categories/categories.service';
import { CategoryType } from '../../../../src/prisma/generated/enums';
import { cleanDatabase } from '../database';

describe('CategoriesService (integration)', () => {
  let moduleRef: TestingModule;
  let categoriesService: CategoriesService;
  let prisma: PrismaService;
  let userId: string;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        PrismaModule,
        CorrelationIdModule,
      ],
      providers: [CategoriesService],
    }).compile();

    categoriesService = moduleRef.get(CategoriesService);
    prisma = moduleRef.get(PrismaService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);

    userId = randomUUID();
  });

  describe('create', () => {
    it('persists a new category and returns it', async () => {
      const category = await categoriesService.create(userId, {
        name: 'Salary',
        type: CategoryType.income,
      });

      expect(category.id).toBeDefined();
      expect(category.userId).toBe(userId);
      expect(category.name).toBe('Salary');
      expect(category.type).toBe(CategoryType.income);
      expect(category.createdAt).toBeInstanceOf(Date);
    });

    it('trims whitespace from the name before persisting', async () => {
      const category = await categoriesService.create(userId, {
        name: '  Rent  ',
        type: CategoryType.expense,
      });

      expect(category.name).toBe('Rent');
    });

    it('assigns distinct UUIDs to different categories', async () => {
      const a = await categoriesService.create(userId, {
        name: 'Salary',
        type: CategoryType.income,
      });
      const b = await categoriesService.create(userId, {
        name: 'Freelance',
        type: CategoryType.income,
      });

      expect(a.id).not.toBe(b.id);
    });

    it('throws ConflictException when name + type already exists for the user', async () => {
      await categoriesService.create(userId, {
        name: 'Salary',
        type: CategoryType.income,
      });

      await expect(
        categoriesService.create(userId, {
          name: 'Salary',
          type: CategoryType.income,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('allows the same name with a different type', async () => {
      await categoriesService.create(userId, {
        name: 'Other',
        type: CategoryType.income,
      });

      const category = await categoriesService.create(userId, {
        name: 'Other',
        type: CategoryType.expense,
      });

      expect(category.type).toBe(CategoryType.expense);
    });

    it('allows two different users to have categories with the same name and type', async () => {
      const secondUserId = randomUUID();

      await categoriesService.create(userId, {
        name: 'Salary',
        type: CategoryType.income,
      });

      const category = await categoriesService.create(secondUserId, {
        name: 'Salary',
        type: CategoryType.income,
      });

      expect(category.userId).toBe(secondUserId);
    });
  });

  describe('list', () => {
    it('returns all categories for the user ordered by type then name', async () => {
      await categoriesService.create(userId, {
        name: 'Rent',
        type: CategoryType.expense,
      });
      await categoriesService.create(userId, {
        name: 'Salary',
        type: CategoryType.income,
      });
      await categoriesService.create(userId, {
        name: 'Groceries',
        type: CategoryType.expense,
      });

      const result = await categoriesService.list(userId, {});

      expect(result).toHaveLength(3);
      // PostgreSQL orders enum values by their definition position, not alphabetically.
      // In the schema: income is defined before expense, so income ASC comes first.
      // Within expense: Groceries < Rent alphabetically.
      expect(result[0].name).toBe('Salary');
      expect(result[1].name).toBe('Groceries');
      expect(result[2].name).toBe('Rent');
    });

    it('returns an empty array when the user has no categories', async () => {
      const result = await categoriesService.list(userId, {});

      expect(result).toEqual([]);
    });

    it('filters by type when provided', async () => {
      await categoriesService.create(userId, {
        name: 'Salary',
        type: CategoryType.income,
      });
      await categoriesService.create(userId, {
        name: 'Rent',
        type: CategoryType.expense,
      });

      const result = await categoriesService.list(userId, {
        type: CategoryType.income,
      });

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe(CategoryType.income);
    });

    it('does not return categories belonging to another user', async () => {
      const secondUserId = randomUUID();
      await categoriesService.create(secondUserId, {
        name: 'Salary',
        type: CategoryType.income,
      });

      const result = await categoriesService.list(userId, {});

      expect(result).toEqual([]);
    });
  });
});
