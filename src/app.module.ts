import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { MailerModule } from '@nestjs-modules/mailer';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { DestinationsModule } from './modules/destinations/destinations.module';
import { TicketTypesModule } from './modules/ticket-types/ticket-types.module';
import { TicketInventoriesModule } from './modules/ticket-inventories/ticket-inventories.module';
import { OrdersModule } from './modules/orders/orders.module';
import { CapacityModule } from './modules/capacity/capacity.module';
import { DiscountsModule } from './modules/discounts/discounts.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    
    // 🔹 1. Tambahkan konfigurasi batas request di sini
    // (Maksimal 3 request per 10.000 milidetik / 10 detik)
    ThrottlerModule.forRoot([{
      ttl: 10000, 
      limit: 3,
    }]),

    AuthModule,
    CapacityModule,
    
    // Konfigurasi MailerModule dengan Gmail
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: {
            user: configService.get<string>('SMTP_USER'),
            pass: configService.get<string>('SMTP_PASS'),
          },
        },
        defaults: {
          from: `"Tourism App Security" <${configService.get<string>('SMTP_USER')}>`,
        },
      } as any), 
    }),
    
    CategoriesModule,
    DestinationsModule,
    TicketTypesModule,
    TicketInventoriesModule,
    OrdersModule,
    DiscountsModule,
  ],
  // 🔹 2. Tambahkan providers di bawah array imports
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}