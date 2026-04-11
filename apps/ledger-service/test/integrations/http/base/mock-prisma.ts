export class MockPrismaService {
  category = {
    findFirst: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
  };

  transaction = {
    findFirst: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn(),
  };

  outboxMessage = {
    create: jest.fn(),
    findMany: jest.fn().mockResolvedValue([]),
    updateMany: jest.fn(),
  };

  $transaction = jest.fn(async (callback: (tx: this) => unknown) =>
    callback(this),
  );

  $connect = jest.fn();
  $disconnect = jest.fn();

  reset(): void {
    jest.clearAllMocks();
  }
}
