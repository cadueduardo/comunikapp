import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS deve ser habilitado o mais cedo possível
  app.enableCors({
    origin:
      process.env.NODE_ENV === 'production'
        ? (process.env.CORS_ORIGINS || '').split(',').filter(Boolean)
        : '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders:
      'Content-Type, Accept, Authorization, x-loja-id, x-user-roles, x-internal-token',
    exposedHeaders: 'Content-Length',
    credentials: false,
  });

  // Níveis de log por ambiente
  const isProd = process.env.NODE_ENV === 'production';
  app.useLogger(isProd ? ['error', 'warn', 'log'] : ['error', 'warn', 'log', 'debug', 'verbose']);

  // Segurança básica
  app.use(
    helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 1000,
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req: any) => req.method === 'OPTIONS',
    }) as any,
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Configurar serve de arquivos estáticos
  const uploadsPath = join(process.cwd(), 'uploads');
  console.log('📁 Servindo arquivos estáticos de:', uploadsPath);
  app.use('/uploads', express.static(uploadsPath));

  await app.listen(process.env.PORT ?? 3001); // Mudar porta padrão para 3001
}
bootstrap();
