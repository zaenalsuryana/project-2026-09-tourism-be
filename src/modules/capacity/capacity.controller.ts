import { Controller, Get, Put, Post, Delete, Body, Param, UseGuards, Req, ParseUUIDPipe, } from '@nestjs/common';
import { CapacityService } from './capacity.service';
import { UpdateCapacityDto } from './dto/update-capacity.dto';
import { CreateCapacityOverrideDto } from './dto/create-capacity-override.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { DestinationScopeGuard } from '../../common/guards/destination-scope.guard'; // 1. Import DestinationScopeGuard (sesuaikan path foldernya)

@ApiTags('Capacity & Crowd Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, DestinationScopeGuard) // 2. Tambahkan DestinationScopeGuard di sini
@Roles('MANAGER', 'SUPER_ADMIN') // 3. (Opsional) Sesuaikan role jika Super Admin juga boleh akses
@Controller('manager')
export class CapacityController {
  constructor(private readonly capacityService: CapacityService) {}

  @Get('destination/capacity')
  @ApiOperation({
    summary: 'Melihat pengaturan kapasitas & ambang keramaian destinasi',
  })
  async getCapacity(@Req() req: any) {
    const destinationId = req.user?.destinationId || req.user?.did;
    const userId = req.user?.id || req.user?.sub || req.user?.userId;

    return this.capacityService.getCapacity(destinationId, userId);
  }

  @Put('destination/capacity')
  @ApiOperation({
    summary: 'Mengubah pengaturan kapasitas & ambang keramaian destinasi',
  })
  async updateCapacity(@Req() req: any, @Body() dto: UpdateCapacityDto) {
    const destinationId = req.user?.destinationId || req.user?.did;
    const userId = req.user?.id || req.user?.sub || req.user?.userId;

    return this.capacityService.updateCapacity(dto, destinationId, userId);
  }

  @Get('dashboard/today')
  @ApiOperation({ summary: 'Melihat ringkasan okupansi & keramaian hari ini' })
  async getTodayDashboard(@Req() req: any) {
    const destinationId = req.user?.destinationId || req.user?.did;
    const userId = req.user?.id || req.user?.sub || req.user?.userId;

    return this.capacityService.getTodayDashboard(destinationId, userId);
  }

  @Get('destination/capacity-overrides')
  @ApiOperation({
    summary: 'Melihat daftar batas kuota khusus tanggal (Overrides)',
  })
  async getCapacityOverrides(@Req() req: any) {
    const destinationId = req.user?.destinationId || req.user?.did;
    const userId = req.user?.id || req.user?.sub || req.user?.userId;

    return this.capacityService.getCapacityOverrides(destinationId, userId);
  }

  @Post('destination/capacity-overrides')
  @ApiOperation({
    summary: 'Menambah atau memperbarui batas kuota khusus tanggal tertentu',
  })
  async upsertCapacityOverride(
    @Req() req: any,
    @Body() dto: CreateCapacityOverrideDto,
  ) {
    const destinationId = req.user?.destinationId || req.user?.did;
    const userId = req.user?.id || req.user?.sub || req.user?.userId;

    return this.capacityService.upsertCapacityOverride(
      dto,
      destinationId,
      userId,
    );
  }

  @Delete('destination/capacity-overrides/:id')
  @ApiOperation({
    summary: 'Menghapus batas kuota khusus tanggal',
  })
  async deleteCapacityOverride(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const destinationId = req.user?.destinationId || req.user?.did;
    const userId = req.user?.id || req.user?.sub || req.user?.userId;

    return this.capacityService.deleteCapacityOverride(
      id,
      destinationId,
      userId,
    );
  }
}