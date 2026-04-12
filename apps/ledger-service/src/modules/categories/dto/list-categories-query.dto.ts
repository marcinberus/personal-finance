import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CategoryType } from '../../../prisma/generated/enums';

export class ListCategoriesQueryDto {
  @ApiPropertyOptional({
    type: String,
    enum: CategoryType,
  })
  @IsOptional()
  @IsEnum(CategoryType)
  type?: CategoryType;
}
