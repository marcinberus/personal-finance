import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ListTransactionsQueryDto } from './dto/list-transactions-query.dto';
import { TransactionsService } from './transactions.service';
import { JwtGuard } from '../auth/jwt.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@ApiTags('transactions')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  create(
    @CurrentUser() user: { id: string; email: string },
    @Body() dto: CreateTransactionDto,
  ) {
    return this.transactionsService.create(user.id, dto);
  }

  @Get()
  list(
    @CurrentUser() user: { id: string; email: string },
    @Query() query: ListTransactionsQueryDto,
  ) {
    return this.transactionsService.list(user.id, query);
  }

  @Get(':id')
  getById(
    @CurrentUser() user: { id: string; email: string },
    @Param('id') id: string,
  ) {
    return this.transactionsService.getById(user.id, id);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: { id: string; email: string },
    @Param('id') id: string,
  ) {
    return this.transactionsService.remove(user.id, id);
  }
}
