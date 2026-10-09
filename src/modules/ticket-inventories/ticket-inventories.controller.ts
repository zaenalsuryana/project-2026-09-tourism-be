import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TicketInventoriesService } from './ticket-inventories.service';
import { CreateTicketInventoryDto } from './dto/create-ticket-inventory.dto';
import { UpdateTicketInventoryDto } from './dto/update-ticket-inventory.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Manager - Ticket Inventories')
@Controller('manager/ticket-inventories')
export class TicketInventoriesController {
  constructor(private readonly ticketInventoriesService: TicketInventoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Membuat kuota inventori tiket harian baru' })
  create(@Body() createTicketInventoryDto: CreateTicketInventoryDto) {
    return this.ticketInventoriesService.create(createTicketInventoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Mengambil semua data inventori tiket' })
  findAll() {
    return this.ticketInventoriesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Mengambil detail inventori tiket berdasarkan ID' })
  findOne(@Param('id') id: string) {
    return this.ticketInventoriesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mengupdate data inventori tiket (kuota / tanggal)' })
  update(@Param('id') id: string, @Body() updateTicketInventoryDto: UpdateTicketInventoryDto) {
    return this.ticketInventoriesService.update(id, updateTicketInventoryDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Menghapus data inventori tiket' })
  remove(@Param('id') id: string) {
    return this.ticketInventoriesService.remove(id);
  }
}