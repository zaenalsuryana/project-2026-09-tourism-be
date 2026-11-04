import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger'; // <--- Tambahkan ApiOperation
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DestinationStatus } from '@prisma/client';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @ApiOperation({ summary: 'Melihat daftar seluruh pengguna terdaftar (Admin)' })
  getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Get('destinations/pending')
  @ApiOperation({ summary: 'Melihat daftar destinasi wisata yang menunggu peninjauan/persetujuan' })
  getPendingDestinations() {
    return this.adminService.getPendingDestinations();
  }

  @Patch('destinations/:id/status')
  @ApiOperation({ summary: 'Memperbarui status verifikasi destinasi wisata' })
  updateDestinationStatus(
    @Param('id') id: string,
    @Body('status') status: DestinationStatus, 
  ) {
    return this.adminService.updateDestinationStatus(id, status);
  }

  @Patch('destinations/:id/suspend')
  @ApiOperation({ summary: 'Menangguhkan (suspend) operasional suatu destinasi wisata' })
  suspendDestination(@Param('id') id: string) {
    return this.adminService.suspendDestination(id);
  }
}