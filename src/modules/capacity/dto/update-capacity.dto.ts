import { IsInt, IsOptional, Min, Max, IsEnum, ValidateNested, IsBoolean, } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CrowdThresholdsDto {
  @ApiPropertyOptional({ enum: ['PERCENT', 'VISITORS'], example: 'VISITORS' })
  @IsEnum(['PERCENT', 'VISITORS'])
  unit: 'PERCENT' | 'VISITORS';

  @ApiPropertyOptional({ example: 20 })
  @IsInt()
  @Min(1)
  moderateFrom: number;

  @ApiPropertyOptional({ example: 50 })
  @IsInt()
  @Min(1)
  busyFrom: number;

  @ApiPropertyOptional({ example: 80 })
  @IsInt()
  @Min(1)
  veryBusyFrom: number;
}

export class UpdateCapacityDto {
  @ApiPropertyOptional({
    description: 'Batas pengunjung harian (null = tanpa batas)',
    example: 100,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(1000000)
  dailyVisitorLimit?: number | null;

  @ApiPropertyOptional({
    description: 'Kapasitas acuan bila tanpa batas (null = default 50)',
    example: 50,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(1000000)
  crowdReferenceCapacity?: number | null;

  @ApiPropertyOptional({
    description: 'Ambang batas manual (null = otomatis 20/50/80%)',
    type: CrowdThresholdsDto,
    nullable: true,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CrowdThresholdsDto)
  thresholds?: CrowdThresholdsDto | null;

  @ApiPropertyOptional({
    description: 'Reset ambang batas menjadi otomatis 20/50/80%',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  resetThresholds?: boolean;
}