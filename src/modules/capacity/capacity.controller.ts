import { Controller, Get, Put, Body, UseGuards, Req } from '@nestjs/common';
import { CapacityService } from './capacity.service';
import { UpdateCapacityDto } from './dto/update-capacity.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

// Import Guards & Decorators agar sesuai dengan struktur modul Auth & Common
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Capacity & Crowd Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard) // Memastikan token JWT diproses dan role diverifikasi
@Roles('MANAGER') // Menyoroti bahwa endpoint ini khusus untuk akun MANAGER
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
}