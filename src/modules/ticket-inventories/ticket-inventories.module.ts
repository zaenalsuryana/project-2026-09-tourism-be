import { Module } from '@nestjs/common';
import { TicketInventoriesService } from './ticket-inventories.service';
import { TicketInventoriesController } from './ticket-inventories.controller';

@Module({
  providers: [TicketInventoriesService],
  controllers: [TicketInventoriesController]
})
export class TicketInventoriesModule {}
