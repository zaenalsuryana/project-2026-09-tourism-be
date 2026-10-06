import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max, IsDateString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateTicketTypeDto {
  @ApiProperty({ description: 'Nama jenis tiket (misal: Dewasa, Anak, Mancanegara)', example: 'Dewasa' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: 'Deskripsi jenis tiket', example: 'Tiket masuk khusus pengunjung dewasa' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Harga tiket dalam rupiah (>= 0)', example: 25000 })
  @IsInt()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ description: 'Kuota harian tiket, kosongkan jika tanpa batas', example: 100 })
  @IsInt()
  @Min(1)
  @IsOptional()
  dailyQuota?: number;

  @ApiPropertyOptional({ description: 'Minimal pembelian per pesanan (default 1)', example: 1, default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  minPerOrder?: number = 1;

  @ApiPropertyOptional({ description: 'Maksimal pembelian per pesanan (default 10)', example: 10, default: 10 })
  @IsInt()
  @Min(1)
  @IsOptional()
  maxPerOrder?: number = 10;

  @ApiPropertyOptional({ description: 'Mulai periode penjualan tiket (ISO 8601)', example: '2026-10-01T00:00:00Z' })
  @IsDateString()
  @IsOptional()
  salesStartAt?: string;

  @ApiPropertyOptional({ description: 'Akhir periode penjualan tiket (ISO 8601)', example: '2026-12-31T23:59:59Z' })
  @IsDateString()
  @IsOptional()
  salesEndAt?: string;
}