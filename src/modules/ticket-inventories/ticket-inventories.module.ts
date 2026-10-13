import { Module } from '@nestjs/common';
import { TicketInventoriesService } from './ticket-inventories.service';
import { TicketInventoriesController } from './ticket-inventories.controller';
import { AuthModule } from '../auth/auth.module'; // Pastikan path-nya sesuai ke folder auth

@Module({
  imports: [AuthModule], // <-- TAMBAHKAN INI AGAR JWT SERVICE DIKENALI
  controllers: [TicketInventoriesController],
  providers: [TicketInventoriesService],
})
export class TicketInventoriesModule {}