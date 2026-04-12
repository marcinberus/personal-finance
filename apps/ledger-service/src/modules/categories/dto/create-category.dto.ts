import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { CategoryType } from '../../../prisma/generated/enums';

export class CreateCategoryDto {
  @ApiProperty({
    maxLength: 100,
    example: 'Groceries',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    enum: CategoryType
  })
  @IsEnum(CategoryType)
  type: CategoryType;
}
