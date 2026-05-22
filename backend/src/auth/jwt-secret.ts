import { ConfigService } from '@nestjs/config';

const BLOCKED_JWT_SECRETS = new Set([
  'your-secret-key',
  'your-super-secret-jwt-key-change-this-in-production',
  'sua-chave-secreta-aqui',
]);

export function getRequiredJwtSecret(configService: ConfigService): string {
  const secret = configService.get<string>('JWT_SECRET')?.trim();

  if (!secret || BLOCKED_JWT_SECRETS.has(secret) || secret.length < 32) {
    throw new Error(
      'JWT_SECRET ausente, fraco ou usando placeholder. Gere um valor forte antes de iniciar a API.',
    );
  }

  return secret;
}
