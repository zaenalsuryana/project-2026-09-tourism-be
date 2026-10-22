import { Controller, Get, Param, Query } from '@nestjs/common';
import { CapacityService } from './capacity.service';
import { GetCrowdQueryDto } from './dto/get-crowd-query.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Public - Capacity & Crowd')
@Controller('destinations')
export class CapacityPublicController {
  constructor(private readonly capacityService: CapacityService) {}

  @Get(':slug/crowd')
  @ApiOperation({
    summary: 'Melihat status & kalender keramaian destinasi (Publik)',
  })
  async getPublicCrowd(
    @Param('slug') slug: string,
    @Query() query: GetCrowdQueryDto,
  ) {
    return this.capacityService.getPublicCrowd(
      slug,
      query.startDate,
      query.endDate,
    );
  }
}