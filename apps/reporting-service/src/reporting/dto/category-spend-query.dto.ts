import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class CategorySpendQueryDto {
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

  @ApiProperty({
    minimum: 1,
    maximum: 12,
    example: 4,
  })
  @IsInt()
  @Min(1)
  @Max(12)
  @Type(() => Number)
  month!: number;
}
