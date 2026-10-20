import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested, } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderItemDto } from './create-order.dto';

export enum OnsitePaymentMethod {
  CASH = 'CASH',
  EDC = 'EDC',
  QRIS_STATIC = 'QRIS_STATIC',
}

export class CreateOnsiteOrderDto {
  @ApiProperty({
    description: 'Daftar item tiket yang dibeli',
    type: [OrderItemDto],
    example: [
      {
        ticketTypeId: '123e4567-e89b-12d3-a456-426614174000',
        quantity: 2,
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({
    description: 'Metode pembayaran di loket',
    enum: OnsitePaymentMethod,
    example: OnsitePaymentMethod.CASH,
  })
  @IsEnum(OnsitePaymentMethod)
  @IsNotEmpty()
  paymentMethod: OnsitePaymentMethod;

  @ApiPropertyOptional({
    description: 'Nama pembeli / pengunjung loket',
    example: 'Budi Santoso',
  })
  @IsOptional()
  @IsString()
  buyerName?: string;

  @ApiPropertyOptional({
    description: 'Email pembeli / pengunjung loket',
    example: 'budi.loket@example.com',
  })
  @IsOptional()
  @IsString()
  buyerEmail?: string;

  @ApiPropertyOptional({
    description: 'Nomor HP pembeli / pengunjung loket',
    example: '081234567890',
  })
  @IsOptional()
  @IsString()
  buyerPhone?: string;
}