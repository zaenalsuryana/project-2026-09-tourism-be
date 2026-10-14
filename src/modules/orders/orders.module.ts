import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module'; // Sesuaikan jalurnya jika berbeda

@Module({
  imports: [
    PrismaModule,
    AuthModule, // <-- Tambahkan ini agar JwtService / JwtAuthGuard bisa dibaca di OrdersModule
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}