import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'turis@example.com', description: 'Alamat email valid' })
  @IsEmail({}, { message: 'Format email tidak valid' })
  @IsNotEmpty({ message: 'Email tidak boleh kosong' })
  email: string;

  @ApiProperty({ example: 'Rahasia123!', description: 'Password minimal 8 karakter' })
  @IsString()
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  password: string;

  @ApiProperty({ example: 'Budi Santoso', description: 'Nama lengkap pengguna' })
  @IsString()
  @IsNotEmpty({ message: 'Nama lengkap tidak boleh kosong' })
  fullName: string;

  @ApiProperty({ example: '081234567890', description: 'Nomor telepon aktif' })
  @IsNotEmpty({ message: 'Nomor telepon tidak boleh kosong' })
  @IsString()
  @Matches(/^(\+62|62|0)8[1-9][0-9]{6,11}$/, {
    message: 'Format nomor telepon tidak valid (contoh: 081234567890)',
  })
  phone: string;
}