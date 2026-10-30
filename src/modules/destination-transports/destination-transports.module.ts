import { Module } from '@nestjs/common';
import { DestinationTransportsService } from './destination-transports.service';
import { DestinationTransportsController } from './destination-transports.controller';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [DestinationTransportsController],
  providers: [DestinationTransportsService],
  exports: [DestinationTransportsService],
})
export class DestinationTransportsModule {}