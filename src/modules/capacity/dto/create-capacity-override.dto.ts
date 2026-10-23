import { IsDateString, IsInt, Min, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCapacityOverrideDto {
    @ApiProperty({
        example: '2026-12-25',
        description: 'Tanggal override kuota (format: YYYY-MM-DD',
    })
    @IsDateString()
    overrideDate: string;

    @ApiProperty({
        example: 1000,
        description: 'Batas kuota pengunjung khusus pada tanggal tersebut',
    })
    @IsInt()
    @Min(1)
    dailyVisitorLimit: number;

    @ApiPropertyOptional({
        example: 'Libur Natal & Tahun Baru',
        description: 'Catatan/alasan perubahan kuota',
    })
    @IsOptional()
    @IsString()
    reason?: string;
}