import { Module } from '@nestjs/common';
import { DiscountsController } from './discounts.controller';
import { DiscountsService } from './discounts.service';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../common/prisma/prisma.module'; // <-- Tambahkan import PrismaModule

@Module({
  imports: [AuthModule, PrismaModule], // <-- Masukkan PrismaModule ke dalam array imports
  controllers: [DiscountsController],
  providers: [DiscountsService],
  exports: [DiscountsService],
})
export class DiscountsModule {}