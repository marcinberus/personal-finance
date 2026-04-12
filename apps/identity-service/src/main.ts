import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  CorrelationIdService,
  CorrelationLoggingInterceptor,
  createCorrelationIdMiddleware,
} from '@app/common';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const correlationIdService = app.get(CorrelationIdService);

  app.use(createCorrelationIdMiddleware(correlationIdService));
  app.useGlobalInterceptors(
    new CorrelationLoggingInterceptor(correlationIdService),
  );

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Identity Service API')
    .setDescription('Authentication and user management')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  await app.listen(process.env.IDENTITY_PORT ?? 3000);
}
void bootstrap();
