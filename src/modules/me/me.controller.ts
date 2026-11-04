import { Controller, Get, Patch, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger'; // <--- Tambahkan ApiOperation
import { MeService } from './me.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AddWishlistDto } from './dto/wishlist.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetCurrentUser } from '../../common/decorators/get-current-user.decorator';

@ApiTags('Me')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('me')
export class MeController {
  constructor(private readonly meService: MeService) {}

  @Get()
  @ApiOperation({ summary: 'Melihat profil akun pengguna yang sedang login' })
  getProfile(@GetCurrentUser() user: any) {
    const userId = user?.id || user?.sub || user?.userId;
    return this.meService.getProfile(userId);
  }

  @Patch()
  @ApiOperation({ summary: 'Memperbarui data profil pengguna' })
  updateProfile(@GetCurrentUser() user: any, @Body() dto: UpdateProfileDto) {
    const userId = user?.id || user?.sub || user?.userId;
    return this.meService.updateProfile(userId, dto);
  }

  @Get('identities')
  @ApiOperation({ summary: 'Melihat daftar identitas login OAuth yang terhubung' })
  getIdentities(@GetCurrentUser() user: any) {
    const userId = user?.id || user?.sub || user?.userId;
    return this.meService.getIdentities(userId);
  }

  @Delete('identities/:provider')
  @ApiOperation({ summary: 'Menghapus/melepas tautan identitas login OAuth tertentu' })
  removeIdentity(@GetCurrentUser() user: any, @Param('provider') provider: string) {
    const userId = user?.id || user?.sub || user?.userId;
    return this.meService.removeIdentity(userId, provider.toUpperCase());
  }

  @Get('wishlist')
  @ApiOperation({ summary: 'Melihat daftar destinasi wisata favorit (wishlist)' })
  getWishlists(@GetCurrentUser() user: any) {
    const userId = user?.id || user?.sub || user?.userId;
    return this.meService.getWishlists(userId);
  }

  @Post('wishlist')
  @ApiOperation({ summary: 'Menambahkan destinasi wisata ke daftar wishlist' })
  addWishlist(@GetCurrentUser() user: any, @Body() dto: AddWishlistDto) {
    const userId = user?.id || user?.sub || user?.userId;
    return this.meService.addWishlist(userId, dto.destinationId);
  }

  @Delete('wishlist/:destinationId')
  @ApiOperation({ summary: 'Menghapus destinasi dari daftar wishlist' })
  removeWishlist(@GetCurrentUser() user: any, @Param('destinationId') destinationId: string) {
    const userId = user?.id || user?.sub || user?.userId;
    return this.meService.removeWishlist(userId, destinationId);
  }

  @Get('orders')
  @ApiOperation({ summary: 'Melihat riwayat pemesanan tiket wisata pengguna' })
  getMyOrders(@GetCurrentUser() user: any) {
    const userId = user?.id || user?.sub || user?.userId;
    return this.meService.getMyOrders(userId);
  }
}