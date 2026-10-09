import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { DestinationsModule } from './modules/destinations/destinations.module';
import { TicketTypesModule } from './modules/ticket-types/ticket-types.module';
import { TicketInventoriesModule } from './modules/ticket-inventories/ticket-inventories.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    
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
  ],
})
export class AppModule {}