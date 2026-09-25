import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Mengatur semua endpoint agar diawali dengan /api
  app.setGlobalPrefix('api');

  // Mengaktifkan validasi input otomatis
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Konfigurasi dokumentasi Swagger UI
  const config = new DocumentBuilder()
    .setTitle('Tourism API')
    .setDescription('Dokumentasi API untuk Aplikasi Pariwisata')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Otomatis menggunakan port 3000 jika belum ada file .env
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`🚀 API berjalan di: http://localhost:${port}/api`);
  console.log(`📚 Swagger Docs di: http://localhost:${port}/api/docs`);
}
bootstrap();