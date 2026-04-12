import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CorrelationIdModule } from '@app/common';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CorrelationIdModule,
    PrismaModule,
    UsersModule,
    AuthModule,
  ],
})
export class AppModule {}
