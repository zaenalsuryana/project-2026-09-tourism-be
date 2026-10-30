import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpsertDestinationTransportDto {
  @ApiPropertyOptional({ description: 'Panduan lengkap rute angkutan umum' })
  @IsOptional()
  @IsString()
  publicTransitGuide?: string; // Pastikan tidak ada typo 'PublicTraansitGuide'

  @ApiPropertyOptional({ description: 'Nama halte, stasiun, atau terminal terdekat' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  nearestStation?: string;

  @ApiPropertyOptional({ description: 'Estimasi waktu perjalanan dari pusat kota' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  estimatedTime?: string;

  @ApiPropertyOptional({ description: 'Tips tambahan bagi wisatawan' })
  @IsOptional()
  @IsString()
  tips?: string;
}