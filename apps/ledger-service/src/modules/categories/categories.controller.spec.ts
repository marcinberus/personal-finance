import { Test, TestingModule } from '@nestjs/testing';
import { CategoryType } from '@app/prisma/generated/enums';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { ListCategoriesQueryDto } from './dto/list-categories-query.dto';

const mockCurrentUser = { id: 'user-id-1', email: 'test@example.com' };

const mockCategory = {
  id: 'category-id-1',
  userId: mockCurrentUser.id,
  name: 'Salary',
  type: CategoryType.income,
  createdAt: new Date(),
};

const mockCategoriesService = {
  create: jest.fn(),
  list: jest.fn(),
};

describe('CategoriesController', () => {
  let controller: CategoriesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        { provide: CategoriesService, useValue: mockCategoriesService },
      ],
    }).compile();

    controller = module.get<CategoriesController>(CategoriesController);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should call categoriesService.create with userId from JWT and return the category', async () => {
      const dto: CreateCategoryDto = {
        name: 'Salary',
        type: CategoryType.income,
      };
      mockCategoriesService.create.mockResolvedValue(mockCategory);

      const result = await controller.create(mockCurrentUser, dto);

      expect(mockCategoriesService.create).toHaveBeenCalledWith(
        mockCurrentUser.id,
        dto,
      );
      expect(result).toEqual(mockCategory);
    });
  });

  describe('list', () => {
    it('should call categoriesService.list with userId and query and return the results', async () => {
      const categories = [mockCategory];
      const query: ListCategoriesQueryDto = { type: CategoryType.income };
      mockCategoriesService.list.mockResolvedValue(categories);

      const result = await controller.list(mockCurrentUser, query);

      expect(mockCategoriesService.list).toHaveBeenCalledWith(
        mockCurrentUser.id,
        query,
      );
      expect(result).toEqual(categories);
    });

    it('should pass an empty query when no filters are provided', async () => {
      const categories = [mockCategory];
      const query: ListCategoriesQueryDto = {};
      mockCategoriesService.list.mockResolvedValue(categories);

      const result = await controller.list(mockCurrentUser, query);

      expect(mockCategoriesService.list).toHaveBeenCalledWith(
        mockCurrentUser.id,
        query,
      );
      expect(result).toEqual(categories);
    });
  });
});
