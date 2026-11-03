import { Controller, Get, Patch, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { MeService } from './me.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AddWishlistDto } from './dto/wishlist.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetCurrentUser } from '../../common/decorators/get-current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('me')
export class MeController {
  constructor(private readonly meService: MeService) {}

  @Get()
  getProfile(@GetCurrentUser('sub') userId: string) {
    return this.meService.getProfile(userId);
  }

  @Patch()
  updateProfile(@GetCurrentUser('sub') userId: string, @Body() dto: UpdateProfileDto) {
    return this.meService.updateProfile(userId, dto);
  }

  @Get('identities')
  getIdentities(@GetCurrentUser('sub') userId: string) {
    return this.meService.getIdentities(userId);
  }

  @Delete('identities/:provider')
  removeIdentity(@GetCurrentUser('sub') userId: string, @Param('provider') provider: string) {
    return this.meService.removeIdentity(userId, provider.toUpperCase());
  }

  @Get('wishlist')
  getWishlists(@GetCurrentUser('sub') userId: string) {
    return this.meService.getWishlists(userId);
  }

  @Post('wishlist')
  addWishlist(@GetCurrentUser('sub') userId: string, @Body() dto: AddWishlistDto) {
    return this.meService.addWishlist(userId, dto.destinationId);
  }

  @Delete('wishlist/:destinationId')
  removeWishlist(@GetCurrentUser('sub') userId: string, @Param('destinationId') destinationId: string) {
    return this.meService.removeWishlist(userId, destinationId);
  }

  @Get('orders')
  getMyOrders(@GetCurrentUser('sub') userId: string) {
    return this.meService.getMyOrders(userId);
  }
}