import { ForbiddenException, Injectable } from '@nestjs/common';
import { PermissaoEfetivaService } from '../../rbac/autorizacao/permissao-efetiva.service';
import { COMPRAS_PERMISSOES } from '../compras-permissoes';

export {
  COMPRAS_PERMISSOES,
  COMPRAS_PERMISSOES_LEITURA_SOLICITACAO,
  COMPRAS_PERMISSOES_LEITURA_PEDIDO,
  COMPRAS_PERMISSOES_LEITURA_RECEBIMENTO,
  COMPRAS_PERMISSOES_LEITURA_ACEITE,
  COMPRAS_PERMISSOES_LEITURA_CONTA_PAGAR,
} from '../compras-permissoes';

@Injectable()
export class ComprasPermissionsService {
  constructor(private readonly permissaoEfetiva: PermissaoEfetivaService) {}

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
    this.parseAcaoCompleta(acaoCompleta);
    return this.permissaoEfetiva.pode(usuarioId, lojaId, acaoCompleta);
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
