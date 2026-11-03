import { Module } from '@nestjs/common';
import { MeController } from './me.controller';
import { MeService } from './me.service';
import { AuthModule } from '../auth/auth.module'; 

@Module({
  imports: [AuthModule], 
  controllers: [MeController],
  providers: [MeService],
})
export class MeModule {}