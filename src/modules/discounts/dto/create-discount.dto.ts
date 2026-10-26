import { IsEnum, IsInt, IsOptional, IsString, IsBoolean, Min, MaxLength } from 'class-validator';
import { DiscountType } from '@prisma/client';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDiscountDto {
  @ApiProperty({ example: 'DISCRAYA50', description: 'Kode voucher diskon' })
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiProperty({ example: 'Diskon Spesial Lebaran', description: 'Nama diskon' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'Potongan harga khusus liburan', description: 'Deskripsi diskon' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: DiscountType, example: DiscountType.PERCENT, description: 'Tipe diskon (PERCENT / FIXED)' })
  @IsEnum(DiscountType)
  type: DiscountType;

  @ApiProperty({ example: 20, description: 'Nilai diskon (persen atau nominal)' })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  value: number;

  @ApiPropertyOptional({ example: 50000, description: 'Minimum order untuk menggunakan diskon' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  minOrderAmount?: number;

  @ApiPropertyOptional({ example: 100000, description: 'Maksimal potongan diskon (jika persen)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  maxDiscountAmount?: number;

  @ApiPropertyOptional({ example: 100, description: 'Kuota total pemakaian voucher' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  quota?: number;

  @ApiPropertyOptional({ example: '2026-11-01T00:00:00.000Z', description: 'Mulai berlaku' })
  @IsOptional()
  @Type(() => Date)
  startAt?: Date;

  @ApiPropertyOptional({ example: '2026-11-30T23:59:59.000Z', description: 'Berakhir' })
  @IsOptional()
  @Type(() => Date)
  endAt?: Date;

  @ApiPropertyOptional({ example: true, description: 'Status aktif diskon' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}