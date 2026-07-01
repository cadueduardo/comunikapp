import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, StatusInstalacao, StatusFinanceiroOcorrencia } from '@prisma/client';
import {
  CobrancaLogAcao,
  ParcelaStatus,
  ParcelaTipo,
} from '../../financeiro/enums/cobranca-status.enum';
import { PrismaService } from '../../prisma/prisma.service';
import { InstalacaoRelatorioPdfService } from './instalacao-relatorio-pdf.service';
import { InstalacaoSplitFiscalService } from './instalacao-split-fiscal.service';
import { InstalacaoFechamentoService } from './instalacao-fechamento.service';
import { ConfiguracaoInstalacaoService } from './configuracao-instalacao.service';
import type { SplitFiscalResultado } from '../utils/split-fiscal.util';

export interface MargemRealOsResultado {
  os_id: string;
  valor_orcado: number;
  custo_orcado: number;
  custos_extras_campo: number;
  custo_operacional_instalacao: number;
  receita_extras_campo: number;
  receita_os_aditivas: number;
  receita_total: number;
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
  pdf_url?: string;
  pdf_token?: string;
  split_fiscal?: SplitFiscalResultado;
}

export interface AprovarFinanceiroResultado extends RelatorioTecnicoResultado {
  aprovacao_financeira_em: string;
}

interface LiberacaoComercialTransacaoParams {
  osId: string;
  lojaId: string;
  cobrancaId: string;
  parcelasOrdemMax: number;
  valorExtras: number;
  usuarioId?: string | null;
  pdfGerado: {
    pdf_token: string;
    pdf_url: string;
    split: SplitFiscalResultado;
  };
  registrarRelatorio: boolean;
  logTipoAcao: 'RELATORIO_TECNICO_GERADO' | 'APROVACAO_FINANCEIRA_INSTALACAO';
  logDescricao: string;
}

@Injectable()
export class InstalacaoPosCalculoService {
  private readonly logger = new Logger(InstalacaoPosCalculoService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly relatorioPdfService: InstalacaoRelatorioPdfService,
    private readonly splitFiscalService: InstalacaoSplitFiscalService,
    private readonly instalacaoFechamentoService: InstalacaoFechamentoService,
    private readonly configuracaoInstalacaoService: ConfiguracaoInstalacaoService,
  ) {}

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
      where: {
        os_id: osId,
        loja_id: lojaId,
        status_financeiro: {
          in: [
            StatusFinanceiroOcorrencia.PRECIFICADO,
            StatusFinanceiroOcorrencia.FATURADO,
          ],
        },
      },
      _sum: { custo_interno: true, preco_cliente: true },
    });

    const receitaAditiva = await this.prisma.ordemServico.aggregate({
      where: {
        loja_id: lojaId,
        os_pai_id: osId,
        tipo_vinculo_os: 'ADITIVA_INSTALACAO',
      },
      _sum: { valor_orcado: true },
    });

    const custoInstalacaoOrcamento =
      await this.calcularCustoOperacionalInstalacao(osId, lojaId);

    const valorOrcado = Number(
      os.valor_orcado ?? os.orcamento?.preco_final ?? 0,
    );
    const custoOrcado = Number(os.orcamento?.custo_total ?? 0);
    const custosExtras = Number(agregadoExtras._sum.custo_interno ?? 0);
    const receitaExtras = Number(agregadoExtras._sum.preco_cliente ?? 0);
    const receitaOsAditivas = Number(receitaAditiva._sum.valor_orcado ?? 0);
    const receitaTotal = valorOrcado + receitaExtras + receitaOsAditivas;
    const custoTotal = custoOrcado + custosExtras + custoInstalacaoOrcamento;
    const lucroReal = receitaTotal - custoTotal;
    const margemPercentual =
      receitaTotal > 0 ? (lucroReal / receitaTotal) * 100 : 0;

    return {
      os_id: osId,
      valor_orcado: this.arredondar(valorOrcado),
      custo_orcado: this.arredondar(custoOrcado),
      custos_extras_campo: this.arredondar(custosExtras),
      custo_operacional_instalacao: this.arredondar(custoInstalacaoOrcamento),
      receita_extras_campo: this.arredondar(receitaExtras),
      receita_os_aditivas: this.arredondar(receitaOsAditivas),
      receita_total: this.arredondar(receitaTotal),
      lucro_real: this.arredondar(lucroReal),
      margem_percentual: this.arredondar(margemPercentual),
    };
  }

  private async calcularCustoOperacionalInstalacao(
    osId: string,
    lojaId: string,
  ): Promise<number> {
    const os = await this.prisma.ordemServico.findFirst({
      where: { id: osId, loja_id: lojaId },
      select: { orcamento_id: true },
    });

    if (!os?.orcamento_id) {
      return 0;
    }

    const produtos = await this.prisma.produtoOrcamento.findMany({
      where: {
        orcamento_id: os.orcamento_id,
        instalacao_necessaria: true,
        ativo: true,
      },
      select: {
        instalacao_custo_mao_obra: true,
        instalacao_custo_deslocamento: true,
      },
    });

    return produtos.reduce((acc, produto) => {
      return (
        acc +
        Number(produto.instalacao_custo_mao_obra ?? 0) +
        Number(produto.instalacao_custo_deslocamento ?? 0)
      );
    }, 0);
  }

  async obterSplitFiscalOs(osId: string, lojaId: string) {
    return this.splitFiscalService.calcularSplitFiscalOs(osId, lojaId);
  }

  async obterRelatorioExistente(osId: string, lojaId: string) {
    return this.prisma.relatorioTecnicoInstalacao.findFirst({
      where: { os_id: osId, loja_id: lojaId },
    });
  }

  /**
   * Passo 1f (DEC-04): gatilho financeiro — libera saldo A_FATURAR, extras de campo
   * e conclui OS/expedição via transação atômica.
   */
  async aprovarFinanceiroOs(
    osId: string,
    lojaId: string,
    usuarioId?: string | null,
  ): Promise<AprovarFinanceiroResultado> {
    const os = await this.prisma.ordemServico.findFirst({
      where: { id: osId, loja_id: lojaId },
      select: {
        id: true,
        orcamento_id: true,
        status_instalacao_os: true,
      },
    });

    if (!os) {
      throw new NotFoundException(
        'Ordem de serviço não encontrada para esta loja.',
      );
    }

    if (!os.orcamento_id) {
      throw new BadRequestException(
        'OS sem orçamento vinculado não pode ser aprovada financeiramente.',
      );
    }

    const relatorioExistente =
      await this.prisma.relatorioTecnicoInstalacao.findFirst({
        where: { os_id: osId, loja_id: lojaId },
      });

    if (relatorioExistente) {
      throw new BadRequestException(
        'Liberação financeira já foi registrada para esta OS.',
      );
    }

    await this.validarLotesConcluidos(osId, lojaId);
    await this.validarSemOcorrenciasFinanceirasPendentes(osId, lojaId);

    const cobranca = await this.prisma.cobranca.findFirst({
      where: { orcamento_id: os.orcamento_id, loja_id: lojaId },
      include: {
        parcelas: { orderBy: { ordem: 'asc' } },
      },
    });

    if (!cobranca) {
      throw new NotFoundException('Cobrança não encontrada para esta OS.');
    }

    const pdfGerado = await this.relatorioPdfService.gerarRelatorioPdf(
      osId,
      lojaId,
    );

    const valorExtras = await this.calcularValorExtrasLegado(osId, lojaId);
    const ultimaOrdem = cobranca.parcelas.reduce(
      (max, parcela) => Math.max(max, parcela.ordem),
      0,
    );

    const liberacao = await this.executarLiberacaoComercialEmTransacao({
      osId,
      lojaId,
      cobrancaId: cobranca.id,
      parcelasOrdemMax: ultimaOrdem,
      valorExtras,
      usuarioId,
      pdfGerado,
      registrarRelatorio: true,
      logTipoAcao: 'APROVACAO_FINANCEIRA_INSTALACAO',
      logDescricao: valorExtras > 0.01
        ? 'Aprovação financeira pós-instalação: saldo liberado e parcela extra de campo consolidada (fluxo legado).'
        : 'Aprovação financeira pós-instalação: saldo liberado para faturamento e expedição finalizada. Extras de campo via OS Aditiva.',
    });

    this.logger.log(
      `Aprovação financeira OS ${osId} — saldo liberado: ${liberacao.saldoLiberada}`,
    );

    const aprovadoEm = new Date().toISOString();

    return {
      os_id: osId,
      orcamento_id: os.orcamento_id,
      cobranca_id: cobranca.id,
      parcela_saldo_liberada: liberacao.saldoLiberada,
      valor_cobranca_extra: this.arredondar(valorExtras),
      parcela_extra_id: liberacao.parcelaExtraId,
      relatorio_gerado_em: aprovadoEm,
      aprovacao_financeira_em: aprovadoEm,
      pdf_disponivel: true,
      pdf_url: pdfGerado.pdf_url,
      pdf_token: pdfGerado.pdf_token,
      split_fiscal: pdfGerado.split,
    };
  }

  /**
   * Encerramento logístico: gera PDF, libera saldo (50%) e cobranças extras.
   */
  async gerarRelatorioTecnicoFinal(
    osId: string,
    lojaId: string,
    usuarioId?: string | null,
  ): Promise<RelatorioTecnicoResultado> {
    const existente = await this.prisma.relatorioTecnicoInstalacao.findFirst({
      where: { os_id: osId, loja_id: lojaId },
    });

    if (existente) {
      throw new BadRequestException(
        'Relatório técnico já foi emitido para esta OS.',
      );
    }

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
    await this.validarSemOcorrenciasFinanceirasPendentes(osId, lojaId);

    const cobranca = await this.prisma.cobranca.findFirst({
      where: { orcamento_id: os.orcamento_id, loja_id: lojaId },
      include: {
        parcelas: { orderBy: { ordem: 'asc' } },
      },
    });

    if (!cobranca) {
      throw new NotFoundException('Cobrança não encontrada para esta OS.');
    }

    const pdfGerado = await this.relatorioPdfService.gerarRelatorioPdf(
      osId,
      lojaId,
    );

    const valorExtras = await this.calcularValorExtrasLegado(osId, lojaId);

    const ultimaOrdem = cobranca.parcelas.reduce(
      (max, parcela) => Math.max(max, parcela.ordem),
      0,
    );

    const liberacao = await this.executarLiberacaoComercialEmTransacao({
      osId,
      lojaId,
      cobrancaId: cobranca.id,
      parcelasOrdemMax: ultimaOrdem,
      valorExtras,
      usuarioId,
      pdfGerado,
      registrarRelatorio: true,
      logTipoAcao: 'RELATORIO_TECNICO_GERADO',
      logDescricao:
        valorExtras > 0.01
          ? 'Relatório técnico final emitido. Saldo liberado e parcela extra de campo (fluxo legado).'
          : 'Relatório técnico final emitido em PDF. Saldo liberado para faturamento. Extras de campo via OS Aditiva.',
    });

    this.logger.log(
      `Relatório técnico gerado para OS ${osId} — PDF ${pdfGerado.pdf_token} — saldo liberado: ${liberacao.saldoLiberada}`,
    );

    return {
      os_id: osId,
      orcamento_id: os.orcamento_id,
      cobranca_id: cobranca.id,
      parcela_saldo_liberada: liberacao.saldoLiberada,
      valor_cobranca_extra: this.arredondar(valorExtras),
      parcela_extra_id: liberacao.parcelaExtraId,
      relatorio_gerado_em: new Date().toISOString(),
      pdf_disponivel: true,
      pdf_url: pdfGerado.pdf_url,
      pdf_token: pdfGerado.pdf_token,
      split_fiscal: pdfGerado.split,
    };
  }

  private async executarLiberacaoComercialEmTransacao(
    params: LiberacaoComercialTransacaoParams,
  ): Promise<{ saldoLiberada: boolean; parcelaExtraId?: string }> {
    const prazoSaldoDias = 15;
    const vencimentoSaldo = new Date();
    vencimentoSaldo.setDate(vencimentoSaldo.getDate() + prazoSaldoDias);

    let parcelaExtraId: string | undefined;
    let saldoLiberada = false;

    await this.prisma.$transaction(async (tx) => {
      const saldoUpdate = await tx.cobrancaParcela.updateMany({
        where: {
          cobranca_id: params.cobrancaId,
          tipo: ParcelaTipo.SALDO,
          status: ParcelaStatus.AGUARDANDO_RELATORIO_TECNICO,
        },
        data: {
          status: ParcelaStatus.A_FATURAR,
          data_vencimento: vencimentoSaldo,
        },
      });

      saldoLiberada = saldoUpdate.count > 0;

      if (params.valorExtras > 0.01) {
        const vencimentoExtra = new Date();
        vencimentoExtra.setDate(vencimentoExtra.getDate() + prazoSaldoDias);

        const parcelaExtra = await tx.cobrancaParcela.create({
          data: {
            cobranca_id: params.cobrancaId,
            ordem: params.parcelasOrdemMax + 1,
            tipo: ParcelaTipo.PARCELA,
            valor_previsto: new Prisma.Decimal(params.valorExtras),
            valor_recebido: new Prisma.Decimal(0),
            data_vencimento: vencimentoExtra,
            status: ParcelaStatus.A_FATURAR,
          },
        });

        parcelaExtraId = parcelaExtra.id;
      }

      if (params.registrarRelatorio) {
        await tx.relatorioTecnicoInstalacao.create({
          data: {
            loja_id: params.lojaId,
            os_id: params.osId,
            pdf_token: params.pdfGerado.pdf_token,
            pdf_url: params.pdfGerado.pdf_url,
            total_nfe: new Prisma.Decimal(params.pdfGerado.split.total_nfe),
            total_nfs: new Prisma.Decimal(params.pdfGerado.split.total_nfs),
            split_detalhes: params.pdfGerado.split
              .detalhes as unknown as Prisma.InputJsonValue,
            gerado_por: params.usuarioId ?? null,
          },
        });
      }

      await this.instalacaoFechamentoService.finalizarAposRelatorioTecnico(
        tx,
        params.lojaId,
        params.osId,
      );

      await tx.ordemServicoLog.create({
        data: {
          os_id: params.osId,
          tipo_acao: params.logTipoAcao,
          descricao: params.logDescricao,
          usuario_id: params.usuarioId ?? null,
          dados_extras: JSON.stringify({
            parcela_saldo_liberada: saldoLiberada,
            valor_cobranca_extra: params.valorExtras,
            parcela_extra_id: parcelaExtraId ?? null,
            pdf_url: params.pdfGerado.pdf_url,
            split_fiscal: params.pdfGerado.split,
          }),
        },
      });

      await tx.cobrancaLog.create({
        data: {
          cobranca_id: params.cobrancaId,
          tipo_acao: CobrancaLogAcao.EDITADA,
          descricao:
            params.valorExtras > 0.01
              ? `Saldo liberado (A_FATURAR) após aprovação financeira da OS ${params.osId}. Extra de campo: R$ ${params.valorExtras.toFixed(2)}.`
              : `Saldo liberado (A_FATURAR) após aprovação financeira da OS ${params.osId}.`,
          usuario_id: params.usuarioId ?? null,
        },
      });
    });

    return { saldoLiberada, parcelaExtraId };
  }

  private async calcularValorExtrasLegado(
    osId: string,
    lojaId: string,
  ): Promise<number> {
    const osAditivaHabilitada =
      await this.configuracaoInstalacaoService.osAditivaHabilitada(lojaId);
    if (osAditivaHabilitada) {
      return 0;
    }

    const extras = await this.prisma.ocorrenciaInstalacao.aggregate({
      where: {
        os_id: osId,
        loja_id: lojaId,
        status_financeiro: StatusFinanceiroOcorrencia.PRECIFICADO,
      },
      _sum: { preco_cliente: true },
    });

    return Number(extras._sum.preco_cliente ?? 0);
  }

  private async validarSemOcorrenciasFinanceirasPendentes(
    osId: string,
    lojaId: string,
  ): Promise<void> {
    const osAditivaHabilitada =
      await this.configuracaoInstalacaoService.osAditivaHabilitada(lojaId);
    if (!osAditivaHabilitada) {
      return;
    }

    const pendentes = await this.prisma.ocorrenciaInstalacao.count({
      where: {
        os_id: osId,
        loja_id: lojaId,
        status_financeiro: {
          in: [
            StatusFinanceiroOcorrencia.PENDENTE_PRECIFICACAO,
            StatusFinanceiroOcorrencia.PRECIFICADO,
          ],
        },
      },
    });

    if (pendentes > 0) {
      throw new BadRequestException(
        `Existem ${pendentes} ocorrência(s) de campo sem faturamento via OS Aditiva. Precifique e gere a aditiva antes de aprovar o faturamento principal.`,
      );
    }
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
