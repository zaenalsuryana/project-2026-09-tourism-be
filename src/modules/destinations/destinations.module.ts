import { Module } from '@nestjs/common';
import { DestinationsService } from './destinations.service';
import { DestinationsController } from './destinations.controller';
import { AuthModule } from '../auth/auth.module'; // <--- Import AuthModule

@Module({
  imports: [AuthModule], // <--- Masukkan ke dalam array imports
  controllers: [DestinationsController],
  providers: [DestinationsService],
})
export class DestinationsModule {}