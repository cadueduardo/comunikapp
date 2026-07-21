import { ForbiddenException, Injectable } from '@nestjs/common';
import { usuario_funcao } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export const COMPRAS_PERMISSOES = {
  SOLICITACAO_CRIAR: 'compras.solicitacao.criar',
  SOLICITACAO_APROVAR: 'compras.solicitacao.aprovar',
  PEDIDO_CRIAR: 'compras.pedido.criar',
  PEDIDO_APROVAR: 'compras.pedido.aprovar',
  PEDIDO_ENVIAR: 'compras.pedido.enviar',
  PEDIDO_CANCELAR: 'compras.pedido.cancelar',
  PEDIDO_SUBSTITUIR_FORNECEDOR: 'compras.pedido.substituir_fornecedor',
  RECEBIMENTO_REGISTRAR: 'compras.recebimento.registrar',
  SERVICO_ACEITAR: 'compras.servico.aceitar',
  CONTA_PAGAR_CRIAR: 'compras.conta_pagar.criar',
  PAGAMENTO_REGISTRAR: 'compras.pagamento.registrar',
  PAGAMENTO_ESTORNAR: 'compras.pagamento.estornar',
  AUDITORIA_VISUALIZAR: 'compras.auditoria.visualizar',
} as const;

@Injectable()
export class ComprasPermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Parseia "compras.solicitacao.criar" em modulo=compras, acao=solicitacao.criar.
   */
  parseAcaoCompleta(acaoCompleta: string): { modulo: string; acao: string } {
    const partes = acaoCompleta.split('.');
    if (partes.length < 2 || !partes[0]) {
      throw new ForbiddenException(
        `Permissão de compras inválida: "${acaoCompleta}"`,
      );
    }
    const modulo = partes[0];
    const acao = partes.slice(1).join('.');
    return { modulo, acao };
  }

  async pode(
    usuarioId: string,
    lojaId: string,
    acaoCompleta: string,
  ): Promise<boolean> {
    const { modulo, acao } = this.parseAcaoCompleta(acaoCompleta);

    const usuario = await this.prisma.usuario.findFirst({
      where: {
        id: usuarioId,
        loja_id: lojaId,
        status: 'ATIVO',
        ativo: true,
      },
      include: {
        perfis: {
          include: {
            perfil: {
              include: {
                permissoes: {
                  where: {
                    modulo,
                    acao,
                    permitido: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!usuario) {
      return false;
    }

    if (usuario.funcao === usuario_funcao.ADMINISTRADOR) {
      return true;
    }

    const temPerfilAdministrador = usuario.perfis.some(
      (up) =>
        up.perfil.ativo &&
        up.perfil.nome.trim().toUpperCase() === 'ADMINISTRADOR',
    );
    if (temPerfilAdministrador) {
      return true;
    }

    return usuario.perfis.some(
      (up) => up.perfil.ativo && up.perfil.permissoes.length > 0,
    );
  }

  async assertPode(
    usuarioId: string,
    lojaId: string,
    acaoCompleta: string,
  ): Promise<void> {
    const permitido = await this.pode(usuarioId, lojaId, acaoCompleta);
    if (!permitido) {
      throw new ForbiddenException(
        `Você não tem permissão para executar "${acaoCompleta}".`,
      );
    }
  }

  async podeAprovarSolicitacao(
    usuarioId: string,
    lojaId: string,
  ): Promise<boolean> {
    return this.pode(
      usuarioId,
      lojaId,
      COMPRAS_PERMISSOES.SOLICITACAO_APROVAR,
    );
  }

  async podeAprovarPedido(
    usuarioId: string,
    lojaId: string,
  ): Promise<boolean> {
    return this.pode(usuarioId, lojaId, COMPRAS_PERMISSOES.PEDIDO_APROVAR);
  }
}
