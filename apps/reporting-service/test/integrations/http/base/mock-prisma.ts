export class MockPrismaService {
  monthlyReportProjection = {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  };

  categorySpendProjection = {
    findMany: jest.fn(),
  };

  $connect = jest.fn();
  $disconnect = jest.fn();

  reset(): void {
    jest.clearAllMocks();
  }
}
