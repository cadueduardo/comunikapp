import { createHash, timingSafeEqual } from 'crypto';
import { ConfigService } from '@nestjs/config';

function equalSecrets(left: string, right: string): boolean {
  const leftHash = createHash('sha256').update(left).digest();
  const rightHash = createHash('sha256').update(right).digest();
  return timingSafeEqual(leftHash, rightHash);
}

export function getRequiredAdminJwtSecret(
  configService: ConfigService,
): string {
  const configured = configService.get<string>('ADMIN_JWT_SECRET')?.trim();
  const lojaSecret = configService.get<string>('JWT_SECRET')?.trim();
  const isProduction =
    configService.get<string>('NODE_ENV')?.trim() === 'production';

  if (configured && configured.length >= 32) {
    if (lojaSecret && equalSecrets(configured, lojaSecret)) {
      throw new Error(
        'ADMIN_JWT_SECRET deve ser diferente de JWT_SECRET.',
      );
    }
    return configured;
  }

  if (isProduction) {
    throw new Error(
      'ADMIN_JWT_SECRET forte e exclusivo é obrigatório em produção.',
    );
  }

  if (!lojaSecret || lojaSecret.length < 32) {
    throw new Error(
      'ADMIN_JWT_SECRET ou JWT_SECRET com ao menos 32 caracteres é obrigatório.',
    );
  }

  return createHash('sha256')
    .update(`comunikapp-admin-v1:${lojaSecret}`)
    .digest('hex');
}

