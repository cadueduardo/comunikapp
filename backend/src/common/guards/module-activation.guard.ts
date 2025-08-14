import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ModuleActivationGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const lojaId: string | undefined = request.user?.loja_id || request.estoque?.lojaId;
    const moduleKey: string = request.route?.path?.includes('/usuarios') ? 'usuarios' : '';

    if (!moduleKey) return true;
    if (!lojaId) throw new UnauthorizedException('lojaId ausente');

    // Feature flag via env para fallback rápido em dev
    if (process.env.DISABLE_MARKETPLACE_CHECK === 'true') return true;

    // Verifica ativação no marketplace (se existir tabela)
    try {
      const exists = await this.prisma.$queryRawUnsafe<any[]>(
        "SELECT 1 FROM loja_modulo WHERE loja_id = ? AND modulo_chave = ? AND ativo = 1 LIMIT 1",
        lojaId,
        moduleKey,
      );
      return Array.isArray(exists) && exists.length > 0;
    } catch (_) {
      // Se tabela não existir, permitir (será implementado na fase do marketplace)
      return true;
    }
  }
}


