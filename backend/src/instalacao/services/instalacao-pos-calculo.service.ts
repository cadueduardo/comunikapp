import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, StatusInstalacao } from '@prisma/client';
import {
  CobrancaLogAcao,
  ParcelaStatus,
  ParcelaTipo,
} from '../../financeiro/enums/cobranca-status.enum';
import { PrismaService } from '../../prisma/prisma.service';

export interface MargemRealOsResultado {
  os_id: string;
  valor_orcado: number;
  custo_orcado: number;
  custos_extras_campo: number;
  lucro_real: number;
  margem_percentual: number;
}

export interface RelatorioTecnicoResultado {
  os_id: string;
  orcamento_id: string;
  cobranca_id: string;
  parcela_saldo_liberada: boolean;
  valor_cobranca_extra: number;
  parcela_extra_id?: string;
  relatorio_gerado_em: string;
  pdf_disponivel: boolean;
}

@Injectable()
export class InstalacaoPosCalculoService {
  private readonly logger = new Logger(InstalacaoPosCalculoService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Aplica trava de saldo após aprovação quando o orçamento exige instalação.
   */
  async aplicarTravaSaldoAposAprovacao(
    cobrancaId: string,
    orcamentoId: string,
    lojaId: string,
  ): Promise<number> {
    const exigeInstalacao = await this.orcamentoExigeInstalacao(
      orcamentoId,
      lojaId,
    );

    if (!exigeInstalacao) {
      return 0;
    }

    const resultado = await this.prisma.cobrancaParcela.updateMany({
      where: {
        cobranca_id: cobrancaId,
        tipo: ParcelaTipo.SALDO,
        status: ParcelaStatus.PREVISTO,
      },
      data: {
        status: ParcelaStatus.AGUARDANDO_RELATORIO_TECNICO,
      },
    });

    if (resultado.count > 0) {
      this.logger.log(
        `${resultado.count} parcela(s) SALDO retidas até relatório técnico — cobrança ${cobrancaId}`,
      );
    }

    return resultado.count;
  }

  async calcularMargemRealOs(
    osId: string,
    lojaId: string,
  ): Promise<MargemRealOsResultado> {
    const os = await this.prisma.ordemServico.findFirst({
      where: { id: osId, loja_id: lojaId },
      select: {
        id: true,
        valor_orcado: true,
        orcamento: {
          select: { custo_total: true, preco_final: true },
        },
      },
    });

    if (!os) {
      throw new NotFoundException('Ordem de serviço não encontrada.');
    }

    const agregadoExtras = await this.prisma.ocorrenciaInstalacao.aggregate({
      where: { os_id: osId, loja_id: lojaId },
      _sum: { custo_interno: true },
    });

    const valorOrcado = Number(
      os.valor_orcado ?? os.orcamento?.preco_final ?? 0,
    );
    const custoOrcado = Number(os.orcamento?.custo_total ?? 0);
    const custosExtras = Number(agregadoExtras._sum.custo_interno ?? 0);
    const lucroReal = valorOrcado - custoOrcado - custosExtras;
    const margemPercentual =
      valorOrcado > 0 ? (lucroReal / valorOrcado) * 100 : 0;

    return {
      os_id: osId,
      valor_orcado: this.arredondar(valorOrcado),
      custo_orcado: this.arredondar(custoOrcado),
      custos_extras_campo: this.arredondar(custosExtras),
      lucro_real: this.arredondar(lucroReal),
      margem_percentual: this.arredondar(margemPercentual),
    };
  }

  /**
   * Encerramento logístico: libera saldo (50%) e cobranças extras de campo.
   * PDF nativo será entregue na Fase 5 — aqui registramos o evento e liberamos financeiro.
   */
  async gerarRelatorioTecnicoFinal(
    osId: string,
    lojaId: string,
    usuarioId?: string | null,
  ): Promise<RelatorioTecnicoResultado> {
    const os = await this.prisma.ordemServico.findFirst({
      where: { id: osId, loja_id: lojaId },
      select: {
        id: true,
        orcamento_id: true,
      },
    });

    if (!os?.orcamento_id) {
      throw new BadRequestException(
        'OS sem orçamento vinculado não pode gerar relatório técnico.',
      );
    }

    await this.validarLotesConcluidos(osId, lojaId);

    const cobranca = await this.prisma.cobranca.findFirst({
      where: { orcamento_id: os.orcamento_id, loja_id: lojaId },
      include: {
        parcelas: { orderBy: { ordem: 'asc' } },
      },
    });

    if (!cobranca) {
      throw new NotFoundException('Cobrança não encontrada para esta OS.');
    }

    const extras = await this.prisma.ocorrenciaInstalacao.aggregate({
      where: { os_id: osId, loja_id: lojaId },
      _sum: { preco_cliente: true },
    });

    const valorExtras = Number(extras._sum.preco_cliente ?? 0);
    const prazoSaldoDias = 15;
    const vencimentoSaldo = new Date();
    vencimentoSaldo.setDate(vencimentoSaldo.getDate() + prazoSaldoDias);

    let parcelaExtraId: string | undefined;
    let saldoLiberada = false;

    await this.prisma.$transaction(async (tx) => {
      const saldoUpdate = await tx.cobrancaParcela.updateMany({
        where: {
          cobranca_id: cobranca.id,
          tipo: ParcelaTipo.SALDO,
          status: ParcelaStatus.AGUARDANDO_RELATORIO_TECNICO,
        },
        data: {
          status: ParcelaStatus.PREVISTO,
          data_vencimento: vencimentoSaldo,
        },
      });

      saldoLiberada = saldoUpdate.count > 0;

      if (valorExtras > 0.01) {
        const ultimaOrdem = cobranca.parcelas.reduce(
          (max, p) => Math.max(max, p.ordem),
          0,
        );

        const vencimentoExtra = new Date();
        vencimentoExtra.setDate(vencimentoExtra.getDate() + prazoSaldoDias);

        const parcelaExtra = await tx.cobrancaParcela.create({
          data: {
            cobranca_id: cobranca.id,
            ordem: ultimaOrdem + 1,
            tipo: ParcelaTipo.PARCELA,
            valor_previsto: new Prisma.Decimal(valorExtras),
            valor_recebido: new Prisma.Decimal(0),
            data_vencimento: vencimentoExtra,
            status: ParcelaStatus.PREVISTO,
          },
        });

        parcelaExtraId = parcelaExtra.id;
      }

      await tx.ordemServicoLog.create({
        data: {
          os_id: osId,
          tipo_acao: 'RELATORIO_TECNICO_GERADO',
          descricao:
            'Relatório técnico final emitido. Saldo liberado para faturamento e cobranças extras consolidadas.',
          usuario_id: usuarioId ?? null,
          dados_extras: JSON.stringify({
            parcela_saldo_liberada: saldoLiberada,
            valor_cobranca_extra: valorExtras,
            parcela_extra_id: parcelaExtraId ?? null,
          }),
        },
      });

      await tx.cobrancaLog.create({
        data: {
          cobranca_id: cobranca.id,
          tipo_acao: CobrancaLogAcao.EDITADA,
          descricao: `Saldo liberado após relatório técnico da OS ${osId}. Extra de campo: R$ ${valorExtras.toFixed(2)}.`,
          usuario_id: usuarioId ?? null,
        },
      });
    });

    this.logger.log(
      `Relatório técnico gerado para OS ${osId} — saldo liberado: ${saldoLiberada}`,
    );

    return {
      os_id: osId,
      orcamento_id: os.orcamento_id,
      cobranca_id: cobranca.id,
      parcela_saldo_liberada: saldoLiberada,
      valor_cobranca_extra: this.arredondar(valorExtras),
      parcela_extra_id: parcelaExtraId,
      relatorio_gerado_em: new Date().toISOString(),
      pdf_disponivel: false,
    };
  }

  private async validarLotesConcluidos(
    osId: string,
    lojaId: string,
  ): Promise<void> {
    const pendentes = await this.prisma.itemOSInstalacao.count({
      where: {
        loja_id: lojaId,
        item_os: { os_id: osId },
        status_instalacao: {
          notIn: [
            StatusInstalacao.CONCLUIDO,
            StatusInstalacao.LOGISTICA_NEGATIVA,
          ],
        },
      },
    });

    if (pendentes > 0) {
      throw new BadRequestException(
        `Existem ${pendentes} lote(s) de instalação ainda não encerrados.`,
      );
    }
  }

  private async orcamentoExigeInstalacao(
    orcamentoId: string,
    lojaId: string,
  ): Promise<boolean> {
    const produto = await this.prisma.produtoOrcamento.findFirst({
      where: {
        orcamento_id: orcamentoId,
        instalacao_necessaria: true,
        orcamento: { loja_id: lojaId },
      },
      select: { id: true },
    });

    return Boolean(produto);
  }

  private arredondar(valor: number): number {
    return Math.round(valor * 100) / 100;
  }
}
