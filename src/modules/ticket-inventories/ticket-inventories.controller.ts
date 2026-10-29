import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Req } from '@nestjs/common';
import { TicketInventoriesService } from './ticket-inventories.service';
import { CreateTicketInventoryDto } from './dto/create-ticket-inventory.dto';
import { UpdateTicketInventoryDto } from './dto/update-ticket-inventory.dto';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; 
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { DestinationScopeGuard } from '../../common/guards/destination-scope.guard'; // 1. Import DestinationScopeGuard

@ApiTags('Manager - Ticket Inventories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, DestinationScopeGuard) // 2. Pasang DestinationScopeGuard di sini
@Roles('MANAGER', 'SUPER_ADMIN') 
@Controller('manager/ticket-inventories')
export class TicketInventoriesController {
  constructor(private readonly ticketInventoriesService: TicketInventoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Membuat kuota inventori tiket harian baru' })
  create(@Req() req: any, @Body() createTicketInventoryDto: CreateTicketInventoryDto) {
    const destinationId = req.user.destinationId; // 3. Ambil destinationId yang sudah difilter guard
    // Jika service butuh destinationId, kamu bisa oper di sini (tergantung implementasi servicemu)
    return this.ticketInventoriesService.create(createTicketInventoryDto, destinationId);
  }

  @Get()
  @ApiOperation({ summary: 'Mengambil semua data inventori tiket' })
  @ApiQuery({ name: 'ticketTypeId', required: false, description: 'Filter berdasarkan ID Jenis Tiket' })
  findAll(@Req() req: any, @Query('ticketTypeId') ticketTypeId?: string) {
    const destinationId = req.user.destinationId;
    return this.ticketInventoriesService.findAll(destinationId, ticketTypeId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Mengambil detail inventori tiket berdasarkan ID' })
  findOne(@Req() req: any, @Param('id') id: string) {
    const destinationId = req.user.destinationId;
    return this.ticketInventoriesService.findOne(id, destinationId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mengupdate data inventori tiket (kuota / tanggal)' })
  update(@Req() req: any, @Param('id') id: string, @Body() updateTicketInventoryDto: UpdateTicketInventoryDto) {
    const destinationId = req.user.destinationId;
    return this.ticketInventoriesService.update(id, destinationId, updateTicketInventoryDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Menghapus data inventori tiket' })
  remove(@Req() req: any, @Param('id') id: string) {
    const destinationId = req.user.destinationId;
    return this.ticketInventoriesService.remove(id, destinationId);
  }
}