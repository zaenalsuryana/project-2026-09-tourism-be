import { Controller, Get, Body, Param, Put, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { DestinationTransportsService } from './destination-transports.service';
import { UpsertDestinationTransportDto } from './dto/upsert-transport.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { DestinationScopeGuard } from '../../common/guards/destination-scope.guard';

@ApiTags('Destination Transports')
@Controller()
export class DestinationTransportsController {
  constructor(private readonly destinationTransportsService: DestinationTransportsService) {}

  @ApiOperation({ summary: 'Manager/Admin mengatur informasi transportasi umum suatu destinasi' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, DestinationScopeGuard)
  @Roles(UserRole.MANAGER, UserRole.SUPER_ADMIN)
  @Put('manager/destinations/:destinationId/transport')
  upsert(
    @Req() req: any,
    @Param('destinationId') destinationId: string,
    @Body() dto: UpsertDestinationTransportDto,
  ) {
    const user = req.user;
    return this.destinationTransportsService.upsertTransport(destinationId, dto, user.destinationId, user.role);
  }

  @ApiOperation({ summary: 'Melihat informasi transportasi umum suatu destinasi (Publik)' })
  @Get('destinations/:destinationId/transport')
  findAll(@Param('destinationId') destinationId: string) {
    return this.destinationTransportsService.getTransportByDestination(destinationId);
  }
}