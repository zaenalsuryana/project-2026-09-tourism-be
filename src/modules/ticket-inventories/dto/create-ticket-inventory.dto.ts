import { IsDateString, IsInt, IsNotEmpty, IsUUID, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTicketInventoryDto {
  @ApiProperty({ 
    example: '123e4567-e89b-12d3-a456-426614174000', 
    description: 'ID dari jenis tiket' 
  })
  @IsUUID()
  @IsNotEmpty()
  ticketTypeId: string;

  @ApiProperty({ 
    example: '2026-12-31', 
    description: 'Tanggal berlakunya kuota tiket (Format: YYYY-MM-DD)' 
  })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ 
    example: 100, 
    description: 'Jumlah kuota tiket yang tersedia' 
  })
  @IsInt()
  @Min(0)
  @IsNotEmpty()
  quota: number;
}