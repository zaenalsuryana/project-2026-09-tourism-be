import { Controller, Post, Body, UseGuards, Request, Get, Param, ParseUUIDPipe } from '@nestjs/common'; 
import { DestinationsService } from './destinations.service';
import { CreateDestinationDto } from './dto/create-destination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client'; // <-- 1. Wajib import UserRole dari Prisma

@ApiTags('Manager - Destinations')
@Controller('manager/destination') 
export class DestinationsController {
  constructor(private readonly destinationsService: DestinationsService) {}

  // 🔒 ENDPOINT TERKUNCI: Hanya untuk SUPER_ADMIN dan MANAGER
  @Post()
  @ApiBearerAuth() // <-- Pindahkan indikator gembok Swagger ke sini
  @UseGuards(JwtAuthGuard, RolesGuard) // <-- Panggil satpam di fungsi ini saja
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER) // <-- Gunakan Enum Prisma, BUKAN string 'MANAGER'
  @ApiOperation({ summary: 'Mendaftarkan destinasi wisata baru (Khusus Pengelola)' })
  create(@Request() req, @Body() createDestinationDto: CreateDestinationDto) {
    // Tampilkan isi req.user di terminal untuk memastikan nama propertinya
    console.log('=== ISI REQ.USER ===', req.user);

    // Ambil ID dengan jaring pengaman ekstra (cek id, sub, atau userId)
    const managerId = req.user.id || req.user.sub || req.user.userId; 

    return this.destinationsService.create(managerId, createDestinationDto);
  }

  // 🌍 ENDPOINT PUBLIK: Bebas diakses Tourist tanpa token
  @Get()
  @ApiOperation({ summary: 'Mendapatkan daftar destinasi' })
  findAll() {
    return this.destinationsService.findAll();
  }

  // 🌍 ENDPOINT PUBLIK: Bebas diakses Tourist tanpa token
  @Get(':id')
  @ApiOperation({ summary: 'Mendapatkan detail destinasi' })
  findOne(@Param('id', ParseUUIDPipe) id: string) { 
    return this.destinationsService.findOne(id);
  }
}