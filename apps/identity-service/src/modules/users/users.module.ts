import { Module } from '@nestjs/common';
import { InternalSecretGuard } from '../../guards/internal-secret.guard';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, InternalSecretGuard],
  exports: [UsersService],
})
export class UsersModule {}
