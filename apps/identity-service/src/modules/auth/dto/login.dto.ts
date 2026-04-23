import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    minLength: 8,
    maxLength: 128,
    example: 'P@ssw0rd123',
  })
  @IsString()
  @MaxLength(128)
  @MinLength(8)
  password: string;
}
