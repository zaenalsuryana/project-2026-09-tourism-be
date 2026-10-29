import { Module } from '@nestjs/common';
import { TicketInventoriesService } from './ticket-inventories.service';
import { TicketInventoriesController } from './ticket-inventories.controller';
import { AuthModule } from '../auth/auth.module'; // Pastikan path-nya sesuai ke folder auth
import { PrismaModule } from '../../common/prisma/prisma.module'; // <-- Tambahkan PrismaModule

@Module({
  imports: [AuthModule, PrismaModule], // <-- Masukkan PrismaModule ke dalam array imports
  controllers: [TicketInventoriesController],
  providers: [TicketInventoriesService],
})
export class TicketInventoriesModule {}