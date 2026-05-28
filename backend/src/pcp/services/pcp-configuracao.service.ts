import { Injectable, NotFoundException } from '@nestjs/common';
import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NivelPCP } from '../dto/pcp-configuracao.dto';
import { AuthenticatedUser } from '../../auth/auth.service';

export interface ConfiguracaoPCP {
  nivel: NivelPCP | null;
  definido: boolean;
}

@Injectable()
export class PCPConfiguracaoService {
  constructor(private readonly prisma: PrismaService) {}

  async obter(lojaId: string): Promise<ConfiguracaoPCP> {
    const loja = await this.prisma.loja.findUnique({
      where: { id: lojaId },
      select: { pcp_nivel: true },
    });

    if (!loja) {
      throw new NotFoundException('Loja não encontrada.');
    }

    const nivel = this.normalizarNivel(loja.pcp_nivel);
    return {
      nivel,
      definido: nivel !== null,
    };
  }

  async aplicarPadrao(
    lojaId: string,
    usuario?: AuthenticatedUser,
  ): Promise<ConfiguracaoPCP> {
    return this.atualizar(lojaId, NivelPCP.ORGANIZADO, usuario);
  }

  async atualizar(
    lojaId: string,
    nivel: NivelPCP,
    usuario?: AuthenticatedUser,
  ): Promise<ConfiguracaoPCP> {
    if (usuario && usuario.funcao !== 'ADMINISTRADOR') {
      throw new ForbiddenException(
        'Apenas administradores podem alterar a configuração do PCP.',
      );
    }

    const loja = await this.prisma.loja.update({
      where: { id: lojaId },
      data: {
        pcp_nivel: nivel,
        atualizado_em: new Date(),
      },
      select: { pcp_nivel: true },
    });

    return {
      nivel: this.normalizarNivel(loja.pcp_nivel),
      definido: true,
    };
  }

  private normalizarNivel(valor: string | null): NivelPCP | null {
    if (
      valor === NivelPCP.ESSENCIAL ||
      valor === NivelPCP.ORGANIZADO ||
      valor === NivelPCP.COMPLETO
    ) {
      return valor;
    }

    return null;
  }
}
