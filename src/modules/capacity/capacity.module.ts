import { Module } from '@nestjs/common';
import { CapacityService } from './capacity.service';
import { CapacityController } from './capacity.controller';

// 🔹 Import AuthModule agar JwtService & JwtAuthGuard tersedia di CapacityModule
import { AuthModule } from '../auth/auth.module'; 

@Module({
  imports: [
    AuthModule, // 👈 Tambahkan di sini
  ],
  controllers: [CapacityController],
  providers: [CapacityService],
  exports: [CapacityService],
})
export class CapacityModule {}