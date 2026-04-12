import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CorrelationIdModule, JwtAuthModule } from '@app/common';
import { PrismaModule } from './prisma/prisma.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { TransactionsModule } from './modules/transactions/transactions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CorrelationIdModule,
    PrismaModule,
    JwtAuthModule.register({ enableTokenSigning: true }),
    CategoriesModule,
    TransactionsModule,
  ],
})
export class AppModule {}
