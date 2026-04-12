import { ApiProperty } from '@nestjs/swagger';

export class UserInfoDto {
  @ApiProperty({
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    example: 'user@example.com',
  })
  email: string;
}
