import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Pantai', description: 'Nama kategori destinasi wisata' })
  @IsString()
  @IsNotEmpty({ message: 'Nama kategori tidak boleh kosong' })
  @MaxLength(60, { message: 'Nama kategori maksimal 60 karakter' })
  name: string;
}