import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { TicketTypesService } from './ticket-types.service';
import { CreateTicketTypeDto } from './dto/create-ticket-type.dto';
import { UpdateTicketTypeDto } from './dto/update-ticket-type.dto';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Mengarah ke modules/auth/guards
import { RolesGuard } from '../../common/guards/roles.guard';     // Mengarah ke common/guards
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../generated/prisma/client';
import { DestinationScopeGuard } from '../../common/guards/destination-scope.guard'; // Pastikan file ini nanti dibuat di common/guards

@ApiTags('Manager - Ticket Types')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, DestinationScopeGuard)
@Roles(UserRole.MANAGER, UserRole.STAFF)
@Controller('manager/ticket-types')
export class TicketTypesController {
  constructor(private readonly ticketTypesService: TicketTypesService) {}

  @Post()
  @Roles(UserRole.MANAGER) // Hanya pengelola yang boleh membuat jenis tiket baru
  @ApiOperation({ summary: 'Buat jenis tiket baru untuk destinasi' })
  create(@Req() req, @Body() createDto: CreateTicketTypeDto) {
    const destinationId = req.user.destinationId; // Didapat dari DestinationScopeGuard
    return this.ticketTypesService.create(destinationId, req.user.sub, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Dapatkan daftar jenis tiket destinasi' })
  findAll(@Req() req) {
    const destinationId = req.user.destinationId;
    return this.ticketTypesService.findAllByDestination(destinationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Dapatkan detail jenis tiket berdasarkan ID' })
  findOne(@Req() req, @Param('id') id: string) {
    const destinationId = req.user.destinationId;
    return this.ticketTypesService.findOne(id, destinationId);
  }

  @Patch(':id')
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Ubah data jenis tiket' })
  update(@Req() req, @Param('id') id: string, @Body() updateDto: UpdateTicketTypeDto) {
    const destinationId = req.user.destinationId;
    return this.ticketTypesService.update(id, destinationId, updateDto);
  }

  @Delete(':id')
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Soft delete / nonaktifkan jenis tiket' })
  remove(@Req() req, @Param('id') id: string) {
    const destinationId = req.user.destinationId;
    return this.ticketTypesService.remove(id, destinationId);
  }
}