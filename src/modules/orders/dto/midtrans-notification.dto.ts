import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class MidtransNotificationDto {
  @ApiProperty({ example: '3c9b1f7e-8c3d-4b5a-9e2f-1a2b3c4d5e6f' })
  @IsNotEmpty()
  @IsString()
  order_id: string;

  @ApiProperty({ example: '200' })
  @IsNotEmpty()
  @IsString()
  status_code: string;

  @ApiProperty({ example: '150000.00' })
  @IsNotEmpty()
  @IsString()
  gross_amount: string;

  @ApiProperty({ example: 'settlement', description: 'settlement, capture, pending, deny, expire, cancel' })
  @IsNotEmpty()
  @IsString()
  transaction_status: string;

  @ApiProperty({ example: 'accept', required: false })
  @IsOptional()
  @IsString()
  fraud_status?: string;

  @ApiProperty({ example: 'bank_transfer' })
  @IsNotEmpty()
  @IsString()
  payment_type: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  signature_key: string;
}