import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Cookie parser
  app.use(cookieParser());

  // Debug middleware to log all requests
  app.use((req, res, next) => {
    if (req.url.includes('/users/')) {
      console.log(`\n=== Request Debug ===`);
      console.log(`URL: ${req.method} ${req.url}`);
      console.log(`Authorization header: ${req.headers.authorization}`);
      console.log(`All headers:`, Object.keys(req.headers));
      console.log(`==================\n`);
    }
    next();
  });

  // CORS configuration
  app.enableCors({
    origin: [
      configService.get('FRONTEND_URL') || 'http://localhost:3000',
      'http://localhost:3001', // Allow requests from Swagger UI
      'https://faithbliss.vercel.app', // Production frontend
      'https://*.vercel.app', // Allow all Vercel deployments
      'https://faithbliss-backend.fly.dev', // Allow self-requests
    ],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('FaithBliss API')
    .setDescription('Christian Dating Platform Backend API')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token (without "Bearer" prefix - it will be added automatically)',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get('PORT') || 3001;
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 FaithBliss API is running on: http://0.0.0.0:${port}`);
  console.log(`📚 API Documentation: http://0.0.0.0:${port}/api/docs`);
}

bootstrap();