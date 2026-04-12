import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { LEDGER_EVENTS_QUEUE } from '@app/contracts';
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
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('Reporting Service API')
    .setDescription('Reporting and analytics')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [
        process.env.RABBITMQ_URL ??
          'amqp://rabbit:rabbit@localhost:5672/personal_finance',
      ],
      queue: LEDGER_EVENTS_QUEUE,
      queueOptions: { durable: true },
      noAck: false,
    },
  });

  await app.startAllMicroservices();
  await app.listen(process.env.REPORTING_PORT ?? 3002);
}

void bootstrap();
