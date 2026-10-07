import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TicketTypesService } from './ticket-types.service';
import { TicketTypesController } from './ticket-types.controller';

@Module({
  imports: [AuthModule],
  controllers: [TicketTypesController],
  providers: [TicketTypesService],
  exports: [TicketTypesService],
})
export class TicketTypesModule {}