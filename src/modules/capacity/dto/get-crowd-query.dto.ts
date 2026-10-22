import { IsOptional, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetCrowdQueryDto {
  @ApiPropertyOptional({
    example: '2026-10-22',
    description: 'Tanggal mulai (default: hari ini)',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    example: '2026-10-28',
    description: 'Tanggal akhir (default: 7 hari ke depan)',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}