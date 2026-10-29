import { Module } from '@nestjs/common';
import { CapacityService } from './capacity.service';
import { CapacityController } from './capacity.controller';
import { CapacityPublicController } from './capacity-public.controller';
import { AuthModule } from '../auth/auth.module'; 
import { PrismaModule } from '../../common/prisma/prisma.module'; // Sesuaikan path menuju PrismaModule kamu

@Module({
  imports: [AuthModule, PrismaModule], // Tambahkan PrismaModule di sini agar DestinationScopeGuard bisa berjalan
  controllers: [CapacityController, CapacityPublicController],
  providers: [CapacityService],
  exports: [CapacityService],
})
export class CapacityModule {}