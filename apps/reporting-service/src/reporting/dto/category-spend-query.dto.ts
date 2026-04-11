import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class CategorySpendQueryDto {
  @IsInt()
  @Min(2000)
  @Max(2100)
  @Type(() => Number)
  year!: number;

  @IsInt()
  @Min(1)
  @Max(12)
  @Type(() => Number)
  month!: number;
}
