import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { App } from 'supertest/types';
import { AppModule } from '../../../../src/app.module';
import { PrismaService } from '@app/prisma';
import { MockPrismaService } from './mock-prisma';

export class AppTestContext {
  app: INestApplication<App>;
  prisma: MockPrismaService;

  async init(): Promise<void> {
    this.prisma = new MockPrismaService();

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(this.prisma)
      .compile();

    this.app = moduleFixture.createNestApplication();

    this.app.setGlobalPrefix('api');
    this.app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await this.app.init();
  }

  async close(): Promise<void> {
    await this.app.close();
  }

  getHttpServer() {
    return this.app.getHttpServer();
  }
}
