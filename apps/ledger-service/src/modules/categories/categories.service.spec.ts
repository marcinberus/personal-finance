import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CorrelationIdService } from '@app/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CategoryType } from '../../prisma/generated/enums';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { ListCategoriesQueryDto } from './dto/list-categories-query.dto';
import { CATEGORY_CREATED } from '@app/contracts';

const mockCategory = {
  id: 'category-id-1',
  userId: 'user-id-1',
  name: 'Salary',
  type: CategoryType.income,
  createdAt: new Date(),
};

const mockPrismaService = {
  $transaction: jest.fn(),
  category: {
    findFirst: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
  },
  outboxMessage: {
    create: jest.fn(),
  },
};

const mockCorrelationIdService = {
  getCorrelationId: jest.fn(),
};

describe('CategoriesService', () => {
  let service: CategoriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: PrismaService, useValue: mockPrismaService },
        {
          provide: CorrelationIdService,
          useValue: mockCorrelationIdService,
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);

    jest.clearAllMocks();
    mockCorrelationIdService.getCorrelationId.mockReturnValue('corr-test-1');
    mockPrismaService.$transaction.mockImplementation(
      (callback: (tx: typeof mockPrismaService) => unknown) =>
        Promise.resolve(callback(mockPrismaService)),
    );
  });

  describe('create', () => {
    const userId = 'user-id-1';
    const dto: CreateCategoryDto = {
      name: 'Salary',
      type: CategoryType.income,
    };

    it('should create a category and return it', async () => {
      mockPrismaService.category.findFirst.mockResolvedValue(null);
      mockPrismaService.category.create.mockResolvedValue(mockCategory);

      const result = await service.create(userId, dto);

      expect(mockPrismaService.category.findFirst).toHaveBeenCalledWith({
        where: { userId, type: dto.type, name: dto.name.trim() },
      });
      expect(mockPrismaService.category.create).toHaveBeenCalledWith({
        data: { userId, name: dto.name.trim(), type: dto.type },
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
      expect(createOutboxCallArg.data.eventType).toBe(CATEGORY_CREATED);
      expect(createOutboxCallArg.data.payload.correlationId).toBe(
        'corr-test-1',
      );
      expect(result).toEqual(mockCategory);
    });

    it('should trim whitespace from the name before creating', async () => {
      const dtoWithSpaces: CreateCategoryDto = {
        name: '  Salary  ',
        type: CategoryType.income,
      };
      mockPrismaService.category.findFirst.mockResolvedValue(null);
      mockPrismaService.category.create.mockResolvedValue(mockCategory);

      await service.create(userId, dtoWithSpaces);

      expect(mockPrismaService.category.findFirst).toHaveBeenCalledWith({
        where: { userId, type: dtoWithSpaces.type, name: 'Salary' },
      });
      expect(mockPrismaService.category.create).toHaveBeenCalledWith({
        data: { userId, name: 'Salary', type: dtoWithSpaces.type },
      });
    });

    it('should throw ConflictException when a category with the same name and type exists', async () => {
      mockPrismaService.category.findFirst.mockResolvedValue(mockCategory);

      await expect(service.create(userId, dto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(userId, dto)).rejects.toThrow(
        'Category with this name already exists',
      );
      expect(mockPrismaService.category.create).not.toHaveBeenCalled();
      expect(mockPrismaService.outboxMessage.create).not.toHaveBeenCalled();
    });

    it('should allow duplicate names for different types', async () => {
      const expenseDto: CreateCategoryDto = {
        name: 'Salary',
        type: CategoryType.expense,
      };
      const expenseCategory = { ...mockCategory, type: CategoryType.expense };
      mockPrismaService.category.findFirst.mockResolvedValue(null);
      mockPrismaService.category.create.mockResolvedValue(expenseCategory);

      const result = await service.create(userId, expenseDto);

      expect(mockPrismaService.category.create).toHaveBeenCalled();
      expect(result.type).toBe(CategoryType.expense);
    });
  });

  describe('list', () => {
    const userId = 'user-id-1';

    it('should return all categories for the user when no filter applied', async () => {
      const categories = [
        mockCategory,
        { ...mockCategory, id: 'category-id-2', type: CategoryType.expense },
      ];
      mockPrismaService.category.findMany.mockResolvedValue(categories);

      const query: ListCategoriesQueryDto = {};
      const result = await service.list(userId, query);

      expect(mockPrismaService.category.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: [{ type: 'asc' }, { name: 'asc' }],
      });
      expect(result).toEqual(categories);
    });

    it('should filter by type when provided', async () => {
      const incomeCategories = [mockCategory];
      mockPrismaService.category.findMany.mockResolvedValue(incomeCategories);

      const query: ListCategoriesQueryDto = { type: CategoryType.income };
      const result = await service.list(userId, query);

      expect(mockPrismaService.category.findMany).toHaveBeenCalledWith({
        where: { userId, type: CategoryType.income },
        orderBy: [{ type: 'asc' }, { name: 'asc' }],
      });
      expect(result).toEqual(incomeCategories);
    });

    it('should return an empty array when the user has no categories', async () => {
      mockPrismaService.category.findMany.mockResolvedValue([]);

      const result = await service.list(userId, {});

      expect(result).toEqual([]);
    });
  });
});
