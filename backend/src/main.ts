import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  // Configurar codificação UTF-8 para caracteres especiais
  process.stdout.setEncoding('utf8');
  process.stderr.setEncoding('utf8');

  // Configurar timezone - padrão Brasil, mas configurável via .env
  process.env.TZ = process.env.TZ || 'America/Sao_Paulo';
  const app = await NestFactory.create(AppModule);

  // CORS deve ser habilitado o mais cedo possível
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      ...(process.env.NODE_ENV === 'production'
        ? (process.env.CORS_ORIGINS || '').split(',').filter(Boolean)
        : []),
    ],
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Accept',
      'Authorization',
      'x-loja-id',
      'x-user-roles',
      'x-internal-token',
      'Cache-Control',
      'Pragma',
    ],
    exposedHeaders: ['Content-Length'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Níveis de log por ambiente
  const isProd = process.env.NODE_ENV === 'production';
  app.useLogger(
    isProd
      ? ['error', 'warn', 'log']
      : ['error', 'warn', 'log', 'debug', 'verbose'],
  );

  // Segurança básica
  app.use(
    helmet({
      contentSecurityPolicy:
        process.env.NODE_ENV === 'production' ? undefined : false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      frameguard: false, // Permite iframes para visualização de PDFs
    }),
  );
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 1000,
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req: any) => (req as any).method === 'OPTIONS',
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

  // Swagger OpenAPI
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Comunikapp API')
    .setDescription('Documentação da API (Orçamentos, Estoque, etc.)')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument, {
    swaggerOptions: { persistAuthorization: true },
  });

  // Log de debug para identificar problema
  const port = process.env.PORT ?? 4000;
  console.log('🚀 Tentando iniciar servidor na porta:', port);
  console.log('🔧 Variáveis de ambiente:');
  console.log('   - PORT:', process.env.PORT);
  console.log('   - NODE_ENV:', process.env.NODE_ENV);
  console.log(
    '   - DATABASE_URL:',
    process.env.DATABASE_URL ? 'CONFIGURADO' : 'NÃO CONFIGURADO',
  );
  console.log(
    '   - TIMEZONE:',
    process.env.TZ,
    '| Data atual:',
    new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
  );

  try {
    await app.listen(port);
    console.log('✅ Servidor iniciado com sucesso na porta:', port);
    console.log('🌐 Acesse: http://localhost:' + port);
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}
void bootstrap();
