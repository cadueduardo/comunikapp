import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ParcelaStatus,
  ParcelaTipo,
} from '../../financeiro/enums/cobranca-status.enum';
import { StatusRollupService } from '../../financeiro/services/status-rollup.service';
import { BLOQUEIO_FINANCEIRO_CODE } from '../constants/bloqueio-financeiro.code';
import {
  ParcelaBloqueioExpedicao,
  ResultadoBloqueioFinanceiro,
} from '../interfaces/expedicao.interface';

const STATUS_SALDO_BLOQUEANTES = new Set<string>([
  ParcelaStatus.PREVISTO,
  ParcelaStatus.VENCIDO,
  ParcelaStatus.PARCIAL_PAGO,
]);

/**
 * Trava financeira da expedição (Fase 2).
 *
 * Regras (decisão de produto):
 * - `orcamento_id` nulo → libera sem consultar cobranças (null safety).
 * - Sem cobrança vinculada → libera.
 * - Bloqueia se existir parcela `SALDO` em PREVISTO/VENCIDO/PARCIAL_PAGO.
 * - Bloqueia se existir qualquer parcela VENCIDA (após recategorização sob demanda).
 */
@Injectable()
export class ExpedicaoFinanceiroService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly statusRollup: StatusRollupService,
  ) {}

  async verificarBloqueioEntrega(
    osId: string,
    lojaId: string,
  ): Promise<ResultadoBloqueioFinanceiro> {
    const os = await this.prisma.ordemServico.findFirst({
      where: { id: osId, loja_id: lojaId },
      select: {
        id: true,
        numero: true,
        orcamento_id: true,
        orcamento: { select: { numero: true } },
      },
    });

    if (!os) {
      throw new NotFoundException('Ordem de serviço não encontrada');
    }

    if (!os.orcamento_id) {
      return { bloqueado: false, motivo: 'SEM_ORCAMENTO' };
    }

    const cobranca = await this.prisma.cobranca.findFirst({
      where: {
        orcamento_id: os.orcamento_id,
        loja_id: lojaId,
      },
      include: {
        parcelas: { orderBy: { ordem: 'asc' } },
      },
    });

    if (!cobranca) {
      return { bloqueado: false, motivo: 'SEM_COBRANCA' };
    }

    const parcelasAtualizadas = this.statusRollup.recategorizarVencidas(
      cobranca.parcelas.map((p) => ({
        status: p.status,
        valor_previsto: Number(p.valor_previsto),
        valor_recebido: Number(p.valor_recebido),
        data_vencimento: p.data_vencimento,
      })),
    );

    const parcelasBloqueantes = this.identificarParcelasBloqueantes(
      cobranca.parcelas,
      parcelasAtualizadas,
    );

    if (parcelasBloqueantes.length === 0) {
      return { bloqueado: false };
    }

    return {
      bloqueado: true,
      motivo: 'PARCELAS_EM_ABERTO',
      parcelas: parcelasBloqueantes,
      cobranca_id: cobranca.id,
      os_id: os.id,
      os_numero: os.numero,
      orcamento_numero: os.orcamento?.numero ?? undefined,
      link_financeiro: this.montarLinkFinanceiro(cobranca.id, os.id, os.numero),
    };
  }

  private montarLinkFinanceiro(
    cobrancaId: string,
    osId: string,
    osNumero: string,
  ): string {
    const ref = encodeURIComponent(osNumero);
    return `/financeiro/recebimentos?cobranca=${cobrancaId}&os=${osId}&ref=${ref}`;
  }

  /**
   * Usado por `concluir-entrega`. Lança 409 com payload estruturado se bloqueado.
   */
  async assertEntregaLiberada(osId: string, lojaId: string): Promise<void> {
    await this.assertOperacaoLiberada(
      osId,
      lojaId,
      'Existem parcelas em aberto que impedem a conclusão da entrega. Regularize o financeiro antes de liberar o material.',
    );
  }

  async assertMovimentoKanbanLiberado(
    osId: string,
    lojaId: string,
  ): Promise<void> {
    await this.assertOperacaoLiberada(
      osId,
      lojaId,
      'Existem parcelas em aberto que impedem mover esta expedição. Regularize o financeiro antes de continuar.',
    );
  }

  private async assertOperacaoLiberada(
    osId: string,
    lojaId: string,
    mensagem: string,
  ): Promise<void> {
    const resultado = await this.verificarBloqueioEntrega(osId, lojaId);

    if (!resultado.bloqueado) {
      return;
    }

    throw new ConflictException({
      code: BLOQUEIO_FINANCEIRO_CODE,
      message: mensagem,
      parcelas: resultado.parcelas ?? [],
      link_financeiro: resultado.link_financeiro ?? '',
    });
  }

  private identificarParcelasBloqueantes(
    parcelasOriginais: Array<{
      id: string;
      tipo: string;
      valor_previsto: unknown;
      valor_recebido: unknown;
      data_vencimento: Date;
      status: string;
    }>,
    parcelasRollup: Array<{ status: string }>,
  ): ParcelaBloqueioExpedicao[] {
    const idsIncluidos = new Set<string>();
    const resultado: ParcelaBloqueioExpedicao[] = [];

    parcelasOriginais.forEach((parcela, indice) => {
      const statusEfetivo = parcelasRollup[indice]?.status ?? parcela.status;
      const bloqueia =
        statusEfetivo === ParcelaStatus.VENCIDO ||
        (parcela.tipo === ParcelaTipo.SALDO &&
          STATUS_SALDO_BLOQUEANTES.has(statusEfetivo));

      if (!bloqueia || idsIncluidos.has(parcela.id)) {
        return;
      }

      idsIncluidos.add(parcela.id);
      const valorPrevisto = Number(parcela.valor_previsto);
      const valorRecebido = Number(parcela.valor_recebido);

      resultado.push({
        id: parcela.id,
        tipo: parcela.tipo,
        valor_saldo: Math.round((valorPrevisto - valorRecebido) * 100) / 100,
        data_vencimento: parcela.data_vencimento.toISOString(),
        status: statusEfetivo,
      });
    });

    return resultado;
  }
}
