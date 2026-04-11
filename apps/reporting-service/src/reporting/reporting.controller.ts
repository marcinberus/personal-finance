import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, JwtGuard } from '@app/common';
import type { AuthenticatedUser } from '@app/common';
import { ReportingService } from './reporting.service';
import { MonthlyReportQueryDto } from './dto/monthly-report-query.dto';
import { MonthlyReportDto } from './dto/monthly-report.dto';
import { CategorySpendQueryDto } from './dto/category-spend-query.dto';
import { CategorySpendItemDto } from './dto/category-spend-item.dto';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('reports')
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  @Get('monthly')
  getMonthlyReport(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: MonthlyReportQueryDto,
  ): Promise<MonthlyReportDto> {
    return this.reportingService.getMonthlyReport(user.id, query);
  }

  @Get('category-spend')
  getCategorySpend(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: CategorySpendQueryDto,
  ): Promise<CategorySpendItemDto[]> {
    return this.reportingService.getCategorySpend(user.id, query);
  }
}
