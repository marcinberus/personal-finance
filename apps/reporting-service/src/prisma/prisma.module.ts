import { Module } from '@nestjs/common';
import { PrismaModule as SharedPrismaModule } from '@app/prisma';

@Module({
  imports: [SharedPrismaModule],
  exports: [SharedPrismaModule],
})
export class PrismaModule {}
