export class MockPrismaService {
  user = {
    findUnique: jest.fn(),
    create: jest.fn(),
  };

  category = {
    findFirst: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
  };

  $connect = jest.fn();
  $disconnect = jest.fn();

  reset(): void {
    jest.clearAllMocks();
  }
}
