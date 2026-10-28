import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { NavigationsService } from './navigations.service';
import { NavigationsController } from './navigations.controller';
import { PrismaModule } from '../../common/prisma/prisma.module'; // Pastikan path ini sesuai dengan strukturmu

@Module({
  imports: [HttpModule, PrismaModule],
  controllers: [NavigationsController],
  providers: [NavigationsService],
})
export class NavigationsModule {}