import { Controller, Get, Post, Body, Param, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { DiscountsService } from './discounts.service';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DestinationScopeGuard } from '../../common/guards/destination-scope.guard'; // 1. Import DestinationScopeGuard

@ApiTags('Discounts')
@Controller()
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}

  @ApiOperation({ summary: 'Manager/Admin membuat voucher diskon baru' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, DestinationScopeGuard) // 2. Tambahkan DestinationScopeGuard
  @Roles(UserRole.MANAGER, UserRole.SUPER_ADMIN)
  @Post('manager/destinations/:destinationId/discounts')
  create(
    @Req() req: any, // 3. Tangkap request untuk cek user
    @Param('destinationId') destinationId: string,
    @Body() createDiscountDto: CreateDiscountDto,
  ) {
    const user = req.user;

    // 4. Jika role adalah MANAGER, pastikan destinationId di URL sesuai dengan destinasi miliknya
    if (user.role === UserRole.MANAGER && user.destinationId && user.destinationId !== destinationId) {
      throw new ForbiddenException('Anda tidak diizinkan membuat diskon untuk destinasi lain.');
    }

    return this.discountsService.createDiscount(destinationId, createDiscountDto);
  }

  @ApiOperation({ summary: 'Melihat daftar diskon aktif suatu destinasi (Publik)' })
  @Get('destinations/:destinationId/discounts')
  findAll(@Param('destinationId') destinationId: string) {
    return this.discountsService.getDiscountsByDestination(destinationId);
  }
}