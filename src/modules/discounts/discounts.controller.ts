import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { DiscountsService } from './discounts.service';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Discounts')
@ApiBearerAuth() // 👈 Tambahkan ini agar token dikirim otomatis oleh Swagger
@Controller()
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}

  @ApiOperation({ summary: 'Manager/Admin membuat voucher diskon baru' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER, UserRole.SUPER_ADMIN)
  @Post('manager/destinations/:destinationId/discounts')
  create(
    @Param('destinationId') destinationId: string,
    @Body() createDiscountDto: CreateDiscountDto,
  ) {
    return this.discountsService.createDiscount(destinationId, createDiscountDto);
  }

  @ApiOperation({ summary: 'Melihat daftar diskon aktif suatu destinasi (Publik)' })
  @Get('destinations/:destinationId/discounts')
  findAll(@Param('destinationId') destinationId: string) {
    return this.discountsService.getDiscountsByDestination(destinationId);
  }
}