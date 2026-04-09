import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CategoryType } from 'src/generated/prisma/enums';

export class ListCategoriesQueryDto {
  @ApiPropertyOptional({
    type: String
  })
  @IsOptional()
  @IsEnum(CategoryType)
  type?: CategoryType;
}
