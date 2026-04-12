import {
  Controller,
  Get,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InternalSecretGuard } from '../../guards/internal-secret.guard';
import { UserInfoDto } from './dto/user-info.dto';
import { UsersService } from './users.service';

@ApiTags('internal')
@UseGuards(InternalSecretGuard)
@Controller('internal/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  async getById(@Param('id') id: string): Promise<UserInfoDto> {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return { id: user.id, email: user.email };
  }
}
