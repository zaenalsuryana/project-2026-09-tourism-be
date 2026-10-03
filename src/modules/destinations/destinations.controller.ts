import { Controller, Post, Body, UseGuards, Request, Get, Param } from '@nestjs/common';
import { DestinationsService } from './destinations.service';
import { CreateDestinationDto } from './dto/create-destination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Manager - Destinations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard) // Proteksi JWT dan Roles
@Roles('MANAGER') // Eksklusif untuk peran Pengelola
@Controller('manager/destination') // Path sesuai SRS
export class DestinationsController {
  constructor(private readonly destinationsService: DestinationsService) {}

  @Post()
  @ApiOperation({ summary: 'Mendaftarkan destinasi wisata baru (Khusus Pengelola)' })
  create(@Request() req, @Body() createDestinationDto: CreateDestinationDto) {
    // 1. Tampilkan isi req.user di terminal untuk memastikan nama propertinya
    console.log('=== ISI REQ.USER ===', req.user);

    // 2. Ambil ID dengan jaring pengaman ekstra (cek id, sub, atau userId)
    const managerId = req.user.id || req.user.sub || req.user.userId; 

    return this.destinationsService.create(managerId, createDestinationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Mendapatkan daftar destinasi' })
  findAll() {
    return this.destinationsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Mendapatkan detail destinasi' })
  findOne(@Param('id') id: string) {
    return this.destinationsService.findOne(id);
  }
}