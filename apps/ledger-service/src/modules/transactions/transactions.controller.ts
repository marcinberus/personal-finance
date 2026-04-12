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
import { CurrentUser, JwtGuard } from '@app/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionSummaryDto } from './dto/transaction-summary.dto';
import { TransactionSummaryService } from './transaction-summary.service';
import {
  TransactionWithCategory,
  TransactionsService,
} from './transactions.service';
import { ListTransactionsQueryDto } from './dto/list-transactions-query.dto';

@ApiTags('transactions')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly transactionSummaryService: TransactionSummaryService,
  ) {}

  @Post()
  create(
    @CurrentUser() user: { id: string; email: string },
    @Body() dto: CreateTransactionDto,
  ): Promise<TransactionWithCategory> {
    return this.transactionsService.create(user.id, dto);
  }

  @Get('summary')
  getSummary(
    @CurrentUser() user: { id: string; email: string },
  ): Promise<TransactionSummaryDto> {
    return this.transactionSummaryService.getSummary(user.id);
  }

  @Get()
  list(
    @CurrentUser() user: { id: string; email: string },
    @Query() query: ListTransactionsQueryDto,
  ): Promise<TransactionWithCategory[]> {
    return this.transactionsService.list(user.id, query);
  }

  @Get(':id')
  getById(
    @CurrentUser() user: { id: string; email: string },
    @Param('id') id: string,
  ): Promise<TransactionWithCategory> {
    return this.transactionsService.getById(user.id, id);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: { id: string; email: string },
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    return this.transactionsService.remove(user.id, id);
  }
}
