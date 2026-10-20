import { IsString, IsNotEmpty, IsDateString, IsOptional, ValidateNested, IsArray, Min, IsEmail, IsInt, IsUUID, } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// DTO khusus untuk detail tiket yang dibeli
export class OrderItemDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID Jenis Tiket (Format UUID)',
  })
  @IsUUID()
  @IsNotEmpty()
  ticketTypeId: string;

  @ApiProperty({
    example: 2,
    description: 'Jumlah tiket yang dibeli (minimal 1)',
  })
  @IsInt()
  @Min(1)
  quantity: number;
}

// DTO khusus untuk data pembeli (terutama jika pembeli adalah Tamu / belum login)
export class BuyerDto {
  @ApiProperty({ example: 'Budi Santoso', description: 'Nama pembeli' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'budi@example.com',
    description: 'Email pembeli (wajib untuk pengiriman e-ticket)',
  })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    example: '081234567890',
    description: 'Nomor telepon pembeli (opsional)',
  })
  @IsString()
  @IsOptional()
  phone?: string;
}

// DTO utama untuk proses Checkout Pembelian Online
export class CreateOrderDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID Destinasi Wisata (Format UUID)',
  })
  @IsUUID()
  @IsNotEmpty()
  destinationId: string;

  @ApiProperty({
    example: '2026-10-20',
    description: 'Tanggal Kunjungan (Format: YYYY-MM-DD)',
  })
  @IsDateString()
  @IsNotEmpty()
  visitDate: string;

  @ApiProperty({
    type: [OrderItemDto],
    description: 'Daftar tiket yang dibeli',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiPropertyOptional({
    example: 'LIBURAN10',
    description: 'Kode diskon / voucher (jika ada)',
  })
  @IsString()
  @IsOptional()
  discountCode?: string;

  @ApiPropertyOptional({
    type: BuyerDto,
    description:
      'Data pembeli (wajib diisi jika pengunjung adalah Tamu / belum login)',
  })
  @ValidateNested()
  @Type(() => BuyerDto)
  @IsOptional()
  buyer?: BuyerDto;
}