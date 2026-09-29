import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token reset password yang didapat dari email' })
  @IsNotEmpty()
  @IsString()
  token: string;

  @ApiProperty({ example: 'PasswordBaru456' })
  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  newPassword: string;
}