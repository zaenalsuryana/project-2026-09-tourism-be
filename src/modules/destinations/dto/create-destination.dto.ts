import { IsString, IsInt, IsNotEmpty, MinLength, MaxLength, IsOptional, IsArray, IsNumber, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDestinationDto {
  @ApiProperty({ example: 1, description: 'ID Kategori' })
  @IsInt()
  @IsNotEmpty({ message: 'ID Kategori wajib diisi' })
  categoryId: number;

  @ApiProperty({ example: 'Curug Cimahi', description: 'Nama destinasi (3-150 karakter)' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Nama minimal 3 karakter' })
  @MaxLength(150, { message: 'Nama maksimal 150 karakter' })
  name: string;

  @ApiProperty({ example: 'Air terjun yang sangat indah dan sejuk...', description: 'Deskripsi (min 50 karakter)' })
  @IsString()
  @IsNotEmpty()
  @MinLength(50, { message: 'Deskripsi minimal 50 karakter' })
  description: string;

  @ApiProperty({ example: 'Jl. Kolonel Masturi No. 325' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: 'Jawa Barat' })
  @IsString()
  @IsNotEmpty()
  province: string;

  @ApiProperty({ example: 'Kabupaten Bandung Barat' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiPropertyOptional({ example: -6.7993 })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({ example: 107.5771 })
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional({ example: '08123456789' })
  @IsString()
  @IsOptional()
  contactPhone?: string;

  @ApiPropertyOptional({ example: 'info@curugcimahi.com' })
  @IsEmail({}, { message: 'Format email tidak valid' })
  @IsOptional()
  contactEmail?: string;

  @ApiPropertyOptional({ example: ['Parkir', 'Toilet', 'Musala'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  facilities?: string[];
}