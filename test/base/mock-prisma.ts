export class MockPrismaService {
  user = {
    findUnique: jest.fn(),
    create: jest.fn(),
  };

  $connect = jest.fn();
  $disconnect = jest.fn();

  reset(): void {
    jest.clearAllMocks();
  }
}
