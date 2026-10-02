import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import cookieParser = require('cookie-parser');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.use(cookieParser());

  // Konfigurasi Swagger menggunakan Bearer Auth standar (lebih mudah untuk testing)
  const config = new DocumentBuilder()
    .setTitle('Tourism API')
    .setDescription('Dokumentasi API untuk Aplikasi Pariwisata')
    .setVersion('1.0')
    .addBearerAuth() // <-- Menggunakan addBearerAuth standar
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`🚀 API berjalan di: http://localhost:${port}/api`);
  console.log(`📚 Swagger Docs di: http://localhost:${port}/api/docs`);
}
bootstrap();