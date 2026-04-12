import { ApiProperty } from '@nestjs/swagger';

export class TransactionSummaryDto {
  @ApiProperty({
    example: 'user@example.com',
  })
  userEmail: string;

  @ApiProperty({
    example: 3200.5,
  })
  totalIncome: number;

  @ApiProperty({
    example: 1450.25,
  })
  totalExpenses: number;

  @ApiProperty({
    example: 1750.25,
  })
  balance: number;
}
