import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TicketTypesService } from './ticket-types.service';
import { TicketTypesController } from './ticket-types.controller';
import { PrismaModule } from '../../common/prisma/prisma.module'; // <-- Tambahkan import PrismaModule (sesuaikan path foldernya)

@Module({
  imports: [AuthModule, PrismaModule], // <-- Masukkan PrismaModule ke dalam array imports
  controllers: [TicketTypesController],
  providers: [TicketTypesService],
  exports: [TicketTypesService],
})
export class TicketTypesModule {}