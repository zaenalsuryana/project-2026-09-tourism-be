import { Module } from '@nestjs/common';
import { CapacityService } from './capacity.service';
import { CapacityController } from './capacity.controller';
import { CapacityPublicController } from './capacity-public.controller';
import { AuthModule } from '../auth/auth.module'; 

@Module({
  imports: [AuthModule],
  controllers: [CapacityController, CapacityPublicController],
  providers: [CapacityService],
  exports: [CapacityService],
})
export class CapacityModule {}