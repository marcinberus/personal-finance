import { ApiProperty } from '@nestjs/swagger';

export class CategorySpendItemDto {
  @ApiProperty({
    format: 'uuid',
  })
  categoryId!: string;

  @ApiProperty({
    example: 'Groceries',
  })
  categoryName!: string;

  @ApiProperty({
    example: '325.50',
    description: 'Decimal value serialized as string by Prisma',
  })
  total!: string;
}
