import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MonthlyReportDto {
  @ApiProperty({
    example: 2026,
  })
  year!: number;

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    example: 4,
  })
  month!: number | null;

  @ApiProperty({
    example: '4250.00',
    description: 'Decimal value serialized as string by Prisma',
  })
  incomeTotal!: string;

  @ApiProperty({
    example: '1790.00',
    description: 'Decimal value serialized as string by Prisma',
  })
  expenseTotal!: string;

  @ApiProperty({
    example: '2460.00',
    description: 'Decimal value serialized as string by Prisma',
  })
  balance!: string;
}
