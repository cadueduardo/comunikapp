import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Sincronização de perfis de sistema.
 * Perfis customizados (`sistema=false`) nunca recebem grant novo.
 * O seed canônico de Vendas (`seed-vendas-rbac.ts`) permanece o escritor
 * dos defaults versionados de Vendas.
 */
@Injectable()
export class SincronizarPerfisSistemaService {
  constructor(private readonly prisma: PrismaService) {}

  async preservarCustomizados(lojaId: string): Promise<{
    customizados: number;
    grantsCustomizados: number;
  }> {
    const customizados = await this.prisma.perfil_acesso.findMany({
      where: { loja_id: lojaId, sistema: false },
      select: {
        id: true,
        _count: { select: { permissoes: true } },
      },
    });
    return {
      customizados: customizados.length,
      grantsCustomizados: customizados.reduce(
        (acc, perfil) => acc + perfil._count.permissoes,
        0,
      ),
    };
  }
}
