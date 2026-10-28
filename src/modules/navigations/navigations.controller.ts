import { Controller, Get, Param, Query } from '@nestjs/common';
import { NavigationsService } from './navigations.service';

@Controller('navigations')
export class NavigationsController {
  constructor(private readonly navigationsService: NavigationsService) {}

  @Get('route/:destinationId')
  async getRoute(
    @Param('destinationId') destinationId: string,
    @Query('lat') lat: string,
    @Query('lng') lng: string,
  ) {
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);

    return this.navigationsService.calculateRoute(destinationId, userLat, userLng);
  }
}