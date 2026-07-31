import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import * as express from 'express';
// cookie-parser é CJS sem .default; require evita undefined em runtime sem esModuleInterop
// eslint-disable-next-line @typescript-eslint/no-require-imports
const cookieParser = require('cookie-parser') as typeof import('cookie-parser');
import { join } from 'path';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Configurar codificação UTF-8 para caracteres especiais
  if (typeof process.stdout.setEncoding === 'function') {
    process.stdout.setEncoding('utf8');
  }
  if (typeof process.stderr.setEncoding === 'function') {
    process.stderr.setEncoding('utf8');
  }

  // Configurar timezone - padrão Brasil, mas configurável via .env
  process.env.TZ = process.env.TZ || 'America/Sao_Paulo';
  const app = await NestFactory.create(AppModule);
  const isProd = process.env.NODE_ENV === 'production';

  // Trust proxy: necessário para express-rate-limit atrás de nginx/reverse proxy (evita ERR_ERL_UNEXPECTED_X_FORWARDED_FOR)
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);

  // Cookie HttpOnly de sessão (JWT em comunikapp_session)
  app.use(cookieParser());

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
      'https://gestao.comunikapp.com.br',
    ];
    const devOrigins = isProd
      ? []
      : ['http://localhost:3000', 'http://127.0.0.1:3000'];
    const allowlist = new Set([
      ...devOrigins,
      ...defaultProduction,
      ...envOrigins,
    ]);
    const { isAllowedComunikappOrigin } = await import('./lojas/tenant-host');
    app.enableCors({
      origin: (origin, callback) => {
        if (!origin) {
          callback(null, true);
          return;
        }
        if (allowlist.has(origin) || isAllowedComunikappOrigin(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error(`Origin não permitida: ${origin}`), false);
      },
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Accept',
        'Authorization',
        'x-loja-id',
        'x-user-roles',
        'x-tenant-slug',
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
  if (isProd) {
    app.use(
      rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 1000,
        standardHeaders: true,
        legacyHeaders: false,
        skip: (req: any) => req.method === 'OPTIONS',
        validate: { xForwardedForHeader: false },
      }) as any,
    );
  }

  // Rate limit dedicado (A05/A07): pagamento, estorno e export CSV.
  const sensitiveMax = isProd ? 60 : 300;
  const sensitiveLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: sensitiveMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      statusCode: 429,
      message:
        'Muitas tentativas nesta operação sensível. Aguarde alguns minutos e tente novamente.',
    },
    skip: (req: any) => req.method === 'OPTIONS',
    validate: { xForwardedForHeader: false },
  }) as any;

  const isRotaSensivelFinanceiro = (method: string, path: string): boolean => {
    if (
      method === 'POST' &&
      /\/financeiro\/contas-pagar\/[^/]+\/pagamentos\/?$/.test(path)
    ) {
      return true;
    }
    if (
      method === 'POST' &&
      /\/financeiro\/pagamentos\/[^/]+\/estornar\/?$/.test(path)
    ) {
      return true;
    }
    if (
      method === 'GET' &&
      /\/financeiro\/cobrancas\/export\.csv\/?$/.test(path)
    ) {
      return true;
    }
    return false;
  };

  app.use((req: any, res: any, next: any) => {
    const path = String(req.path || req.url || '').split('?')[0];
    if (isRotaSensivelFinanceiro(String(req.method || ''), path)) {
      return sensitiveLimiter(req, res, next);
    }
    return next();
  });

  const adminAuthLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isProd ? 10 : 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      statusCode: 429,
      message:
        'Muitas tentativas de autenticação. Aguarde alguns minutos e tente novamente.',
    },
    skip: (req: any) => req.method === 'OPTIONS',
    validate: { xForwardedForHeader: false },
  }) as any;

  app.use((req: any, res: any, next: any) => {
    const path = String(req.path || req.url || '').split('?')[0];
    const isAdminAuthMutation =
      req.method === 'POST' &&
      /^\/(?:api\/)?admin\/v1\/auth\/(?:login|invitation\/accept|2fa\/confirm)\/?$/.test(
        path,
      );
    if (isAdminAuthMutation) {
      return adminAuthLimiter(req, res, next);
    }
    return next();
  });

  // Gate 0S / HS-04: rate limit das duas rotas anonimas de proposta comercial
  // (acao do cliente e reenvio do codigo de aprovacao).
  //
  // Sao dois limites encadeados, porque cada um cobre um abuso diferente:
  //
  // 1. por (orcamento, IP): protege o alvo. Quem tenta adivinhar um codigo
  //    ataca um orcamento especifico. Chavear so por IP puniria um cliente
  //    legitimo por causa de outro que saisse pelo mesmo IP corporativo.
  // 2. por IP: protege contra varredura. Sozinho, o limite composto nao
  //    conteria enumeracao - bastaria trocar o id do orcamento a cada
  //    requisicao para ganhar um contador novo.
  //
  // A mensagem de excesso e a mesma nos dois e nao menciona o orcamento; a
  // chave existe apenas no armazenamento interno do limitador.
  //
  // O IP vem de `req.ip`, resolvido pela politica `trust proxy` definida no
  // inicio deste bootstrap. Nenhum header livre ou parametro de query
  // participa da chave.
  //
  // Esta e a camada de borda e **nao** substitui o contador
  // `codigo_aprovacao_tentativas`, gravado na linha do orcamento: e ele que
  // trava o alvo quando o atacante troca de IP.
  //
  // ATENCAO ao escalar: o armazenamento e em memoria do processo. Com mais de
  // uma instancia do backend, o limite passa a valer por instancia e o teto
  // efetivo se multiplica. Antes de escalar horizontalmente, estes limitadores
  // sensiveis precisam de store compartilhado (Redis).
  const ROTA_ACAO_PUBLICA_PROPOSTA =
    /^\/(?:api\/)?orcamentos-v2\/([^/]+)\/(?:publico\/acao|reenviar-codigo)\/?$/;

  const mensagemExcessoAcaoPublica = {
    statusCode: 429,
    message:
      'Muitas tentativas em sequência. Aguarde alguns instantes e tente novamente.',
  };

  // `ipKeyGenerator` colapsa IPv6 na /64. Sem isso, um atacante com um bloco
  // IPv6 - o comum em provedor residencial - ganharia um contador novo a cada
  // endereco e o limite nao valeria nada.
  const chaveDeIp = (req: any): string =>
    ipKeyGenerator(String(req.ip ?? 'sem-ip'));

  const acaoPublicaPorOrcamentoLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: isProd ? 5 : 50,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: any) => {
      const path = String(req.path || req.url || '').split('?')[0];
      const orcamentoId = ROTA_ACAO_PUBLICA_PROPOSTA.exec(path)?.[1] ?? 'sem-id';
      return `orcamento:${orcamentoId}:${chaveDeIp(req)}`;
    },
    message: mensagemExcessoAcaoPublica,
    skip: (req: any) => req.method === 'OPTIONS',
    validate: { xForwardedForHeader: false },
  }) as any;

  const acaoPublicaPorIpLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: isProd ? 20 : 200,
    standardHeaders: false,
    legacyHeaders: false,
    keyGenerator: (req: any) => `ip:${chaveDeIp(req)}`,
    message: mensagemExcessoAcaoPublica,
    skip: (req: any) => req.method === 'OPTIONS',
    validate: { xForwardedForHeader: false },
  }) as any;

  app.use((req: any, res: any, next: any) => {
    const path = String(req.path || req.url || '').split('?')[0];
    if (req.method !== 'POST' || !ROTA_ACAO_PUBLICA_PROPOSTA.test(path)) {
      return next();
    }
    return acaoPublicaPorIpLimiter(req, res, (erro?: unknown) =>
      erro ? next(erro) : acaoPublicaPorOrcamentoLimiter(req, res, next),
    );
  });

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
  app.use('/uploads/arte', (req, res, next) => {
    if (isProd && process.env.SERVE_PUBLIC_ARTE_UPLOADS !== 'true') {
      return res.status(404).json({ message: 'Arquivo não encontrado' });
    }
    return next();
  });
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
          res.setHeader(
            'Content-Security-Policy',
            "default-src 'none'; sandbox",
          );
        }
      },
    }),
  );

  // Swagger OpenAPI: desabilitado por padrão, inclusive em produção.
  if (process.env.ENABLE_SWAGGER === 'true') {
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
  }

  const port = Number(process.env.PORT ?? 4000);
  // Em produção, escuta apenas em 127.0.0.1 por padrão (Nginx fica na frente).
  // Em dev, escuta em 0.0.0.0 para permitir acesso de outros dispositivos da rede local.
  const host = process.env.HOST ?? (isProd ? '127.0.0.1' : '0.0.0.0');

  if (!isProd) {
    logger.debug(
      `Env: PORT=${process.env.PORT} HOST=${host} NODE_ENV=${process.env.NODE_ENV} DB_CONFIG=${process.env.DATABASE_URL ? 'ok' : 'missing'} TZ=${process.env.TZ}`,
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
