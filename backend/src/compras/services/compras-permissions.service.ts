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

/** Qualquer permissão operacional de solicitação (ou auditoria). */
export const COMPRAS_PERMISSOES_LEITURA_SOLICITACAO: readonly string[] = [
  COMPRAS_PERMISSOES.SOLICITACAO_CRIAR,
  COMPRAS_PERMISSOES.SOLICITACAO_APROVAR,
  COMPRAS_PERMISSOES.PEDIDO_CRIAR,
  COMPRAS_PERMISSOES.AUDITORIA_VISUALIZAR,
];

/** Qualquer permissão operacional de pedido (ou auditoria). */
export const COMPRAS_PERMISSOES_LEITURA_PEDIDO: readonly string[] = [
  COMPRAS_PERMISSOES.PEDIDO_CRIAR,
  COMPRAS_PERMISSOES.PEDIDO_APROVAR,
  COMPRAS_PERMISSOES.PEDIDO_ENVIAR,
  COMPRAS_PERMISSOES.PEDIDO_CANCELAR,
  COMPRAS_PERMISSOES.PEDIDO_SUBSTITUIR_FORNECEDOR,
  COMPRAS_PERMISSOES.RECEBIMENTO_REGISTRAR,
  COMPRAS_PERMISSOES.SERVICO_ACEITAR,
  COMPRAS_PERMISSOES.CONTA_PAGAR_CRIAR,
  COMPRAS_PERMISSOES.AUDITORIA_VISUALIZAR,
];

export const COMPRAS_PERMISSOES_LEITURA_RECEBIMENTO: readonly string[] = [
  COMPRAS_PERMISSOES.RECEBIMENTO_REGISTRAR,
  COMPRAS_PERMISSOES.PEDIDO_CRIAR,
  COMPRAS_PERMISSOES.PEDIDO_APROVAR,
  COMPRAS_PERMISSOES.AUDITORIA_VISUALIZAR,
];

export const COMPRAS_PERMISSOES_LEITURA_ACEITE: readonly string[] = [
  COMPRAS_PERMISSOES.SERVICO_ACEITAR,
  COMPRAS_PERMISSOES.PEDIDO_CRIAR,
  COMPRAS_PERMISSOES.PEDIDO_APROVAR,
  COMPRAS_PERMISSOES.AUDITORIA_VISUALIZAR,
];

/** Contas a pagar / pagamentos (leitura). */
export const COMPRAS_PERMISSOES_LEITURA_CONTA_PAGAR: readonly string[] = [
  COMPRAS_PERMISSOES.CONTA_PAGAR_CRIAR,
  COMPRAS_PERMISSOES.PAGAMENTO_REGISTRAR,
  COMPRAS_PERMISSOES.PAGAMENTO_ESTORNAR,
  COMPRAS_PERMISSOES.AUDITORIA_VISUALIZAR,
];

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

  /**
   * Exige pelo menos uma das ações (OR). ADMINISTRADOR continua bypass via `pode`.
   */
  async assertPodeQualquer(
    usuarioId: string,
    lojaId: string,
    acoes: readonly string[],
    rotulo = 'consultar este recurso de compras',
  ): Promise<void> {
    if (!acoes.length) {
      throw new ForbiddenException(
        `Você não tem permissão para ${rotulo}.`,
      );
    }
    for (const acao of acoes) {
      if (await this.pode(usuarioId, lojaId, acao)) {
        return;
      }
    }
    throw new ForbiddenException(
      `Você não tem permissão para ${rotulo}.`,
    );
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
