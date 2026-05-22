import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Configurar codificação UTF-8 para caracteres especiais
  process.stdout.setEncoding('utf8');
  process.stderr.setEncoding('utf8');

  // Configurar timezone - padrão Brasil, mas configurável via .env
  process.env.TZ = process.env.TZ || 'America/Sao_Paulo';
  const app = await NestFactory.create(AppModule);

  // Trust proxy: necessário para express-rate-limit atrás de nginx/reverse proxy (evita ERR_ERL_UNEXPECTED_X_FORWARDED_FOR)
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);

  // CORS: se CORS_VIA_PROXY=true (ex.: atrás do Nginx na VPS), não envia headers CORS aqui
  // para evitar valor duplicado; o proxy envia os headers.
  if (process.env.CORS_VIA_PROXY !== 'true') {
    const envOrigins = (process.env.CORS_ORIGINS || '')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);
    const defaultProduction = [
      'https://comunikapp.com.br',
      'https://www.comunikapp.com.br',
    ];
    const corsOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      ...defaultProduction,
      ...envOrigins,
    ];
    app.enableCors({
      origin: corsOrigins,
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
  }

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
      skip: (req: any) => req.method === 'OPTIONS',
      // Atrás de nginx: desativa validação estrita do X-Forwarded-For (trust proxy já configurado acima)
      validate: { xForwardedForHeader: false },
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
  if (!isProd) {
    logger.debug(`Uploads estáticos: ${uploadsPath}`);
  }
  app.use(
    '/uploads',
    express.static(uploadsPath, {
      dotfiles: 'deny',
      index: false,
      setHeaders: (res, filePath) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        if (filePath.toLowerCase().endsWith('.svg')) {
          res.setHeader('Content-Disposition', 'attachment');
          res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
        }
      },
    }),
  );

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

  const port = Number(process.env.PORT ?? 4000);
  // Em produção, escuta apenas em 127.0.0.1 por padrão (Nginx fica na frente).
  // Em dev, escuta em 0.0.0.0 para permitir acesso de outros dispositivos da rede local.
  const host =
    process.env.HOST ?? (isProd ? '127.0.0.1' : '0.0.0.0');

  if (!isProd) {
    logger.debug(
      `Env: PORT=${process.env.PORT} HOST=${host} NODE_ENV=${process.env.NODE_ENV} DATABASE_URL=${process.env.DATABASE_URL ? 'ok' : 'missing'} TZ=${process.env.TZ}`,
    );
  }

  try {
    await app.listen(port, host);
    logger.log(`API escutando em ${host}:${port}`);
  } catch (error) {
    logger.error('Falha ao iniciar o servidor', error as Error);
    process.exit(1);
  }
}
void bootstrap();
