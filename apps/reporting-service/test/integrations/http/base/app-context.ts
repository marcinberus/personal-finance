import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { App } from 'supertest/types';
import { AppModule } from '../../../../src/app.module';
import { PrismaService } from '../../../../src/prisma/prisma.service';
import { MockPrismaService } from './mock-prisma';

export class AppTestContext {
  app: INestApplication<App>;
  mockPrismaService: MockPrismaService;
  private testingModule: TestingModule;

  async setupTestingModule(): Promise<void> {
    this.mockPrismaService = new MockPrismaService();

    this.testingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(this.mockPrismaService)
      .compile();

    this.app = this.testingModule.createNestApplication();

    this.app.setGlobalPrefix('api');
    this.app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
  }

  async cleanup(): Promise<void> {
    if (this.app) {
      await this.app.close();
    }
  }

  getHttpServer() {
    return this.app.getHttpServer();
  }
}
