import { IsString, IsNotEmpty, IsDateString, IsOptional, ValidateNested, IsArray, Min, IsEmail } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// DTO khusus untuk detail tiket yang dibeli
export class OrderItemDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID Jenis Tiket' })
  @IsString()
  @IsNotEmpty()
  ticketTypeId: string;

  @ApiProperty({ example: 2, description: 'Jumlah tiket yang dibeli (minimal 1)' })
  @Min(1)
  quantity: number;
}

// DTO khusus untuk data pembeli (terutama jika yang beli adalah Tamu / tidak login)
export class BuyerDto {
  @ApiProperty({ example: 'Budi Santoso', description: 'Nama pembeli' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'budi@example.com', description: 'Email pembeli (wajib untuk pengiriman e-ticket)' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '081234567890', description: 'Nomor telepon pembeli (opsional)' })
  @IsString()
  @IsOptional()
  phone?: string;
}

// DTO utama untuk proses Checkout
export class CreateOrderDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID Destinasi' })
  @IsString()
  @IsNotEmpty()
  destinationId: string;

  @ApiProperty({ example: '2026-10-15', description: 'Tanggal Kunjungan (YYYY-MM-DD)' })
  @IsDateString()
  @IsNotEmpty()
  visitDate: string;

  @ApiProperty({ type: [OrderItemDto], description: 'Daftar tiket yang dibeli' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiPropertyOptional({ example: 'LIBURAN10', description: 'Kode diskon / voucher (jika ada)' })
  @IsString()
  @IsOptional()
  discountCode?: string;

  @ApiPropertyOptional({ type: BuyerDto, description: 'Data pembeli (wajib diisi jika pengunjung adalah Tamu/belum login)' })
  @ValidateNested()
  @Type(() => BuyerDto)
  @IsOptional()
  buyer?: BuyerDto;
}