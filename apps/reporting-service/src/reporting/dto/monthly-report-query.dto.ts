import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class MonthlyReportQueryDto {
  @ApiProperty({
    minimum: 2000,
    maximum: 2100,
    example: 2026,
  })
  @IsInt()
  @Min(2000)
  @Max(2100)
  @Type(() => Number)
  year!: number;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 12,
    example: 4,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  @Type(() => Number)
  month?: number;
}
