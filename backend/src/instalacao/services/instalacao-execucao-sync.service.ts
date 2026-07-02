import { Injectable, Logger } from '@nestjs/common';
import {
  Prisma,
  StatusInstalacao,
  StatusInstalacaoOs,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Sincroniza status operacional de lotes e rollup da OS após alocação ou
 * atividade de campo (UX gestão / instalador).
 *
 * Regras:
 * - Alocação 100% concluída → todos os lotes AGUARDANDO viram EM_ANDAMENTO.
 * - Ocorrência vinculada a um lote → esse lote AGUARDANDO vira EM_ANDAMENTO.
 * - OS.status_instalacao_os passa a EM_ANDAMENTO quando há lote em campo
 *   (não sobrescreve AGUARDANDO_RELATORIO_TECNICO nem CONCLUIDA).
 */
@Injectable()
export class InstalacaoExecucaoSyncService {
  private readonly logger = new Logger(InstalacaoExecucaoSyncService.name);

  constructor(private readonly prisma: PrismaService) {}

  async reconciliarStatusCampo(
    lojaId: string,
    osId: string,
  ): Promise<void> {
    await this.sincronizarAposMudancaLotes(lojaId, osId);

    const client = this.prisma;
    const ocorrencias = await client.ocorrenciaInstalacao.findMany({
      where: {
        loja_id: lojaId,
        os_id: osId,
        item_instalacao_id: { not: null },
      },
      select: { item_instalacao_id: true },
      distinct: ['item_instalacao_id'],
    });

    for (const ocorrencia of ocorrencias) {
      if (!ocorrencia.item_instalacao_id) {
        continue;
      }
      await this.promoverLoteComAtividadeCampo(
        lojaId,
        ocorrencia.item_instalacao_id,
        osId,
      );
    }
  }

  async sincronizarAposMudancaLotes(
    lojaId: string,
    osId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const completa = await this.osAlocacaoCompleta(lojaId, osId, tx);
    if (!completa) {
      return 0;
    }

    return this.promoverLotesAguardandoParaEmAndamento(lojaId, osId, tx);
  }

  async promoverLoteComAtividadeCampo(
    lojaId: string,
    loteId: string,
    osId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<boolean> {
    const client = tx ?? this.prisma;
    const atualizado = await client.itemOSInstalacao.updateMany({
      where: {
        id: loteId,
        loja_id: lojaId,
        status_instalacao: StatusInstalacao.AGUARDANDO,
        item_os: { os_id: osId },
      },
      data: {
        status_instalacao: StatusInstalacao.EM_ANDAMENTO,
        data_execucao: new Date(),
      },
    });

    if (atualizado.count === 0) {
      return false;
    }

    await this.rollupStatusOsEmAndamento(lojaId, osId, tx);
    this.logger.log(
      `Lote ${loteId} promovido para EM_ANDAMENTO após atividade de campo`,
    );
    return true;
  }

  async rollupStatusOsEmAndamento(
    lojaId: string,
    osId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = tx ?? this.prisma;

    const os = await client.ordemServico.findFirst({
      where: { id: osId, loja_id: lojaId },
      select: { status_instalacao_os: true },
    });

    if (!os) {
      return;
    }

    if (
      os.status_instalacao_os ===
        StatusInstalacaoOs.AGUARDANDO_RELATORIO_TECNICO ||
      os.status_instalacao_os === StatusInstalacaoOs.CONCLUIDA
    ) {
      return;
    }

    const emCampo = await client.itemOSInstalacao.count({
      where: {
        loja_id: lojaId,
        item_os: { os_id: osId },
        status_instalacao: StatusInstalacao.EM_ANDAMENTO,
      },
    });

    if (emCampo === 0) {
      return;
    }

    if (os.status_instalacao_os === StatusInstalacaoOs.EM_ANDAMENTO) {
      return;
    }

    await client.ordemServico.updateMany({
      where: { id: osId, loja_id: lojaId },
      data: { status_instalacao_os: StatusInstalacaoOs.EM_ANDAMENTO },
    });

    this.logger.log(`OS ${osId}: status_instalacao_os → EM_ANDAMENTO`);
  }

  private async promoverLotesAguardandoParaEmAndamento(
    lojaId: string,
    osId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const client = tx ?? this.prisma;
    const agora = new Date();

    const resultado = await client.itemOSInstalacao.updateMany({
      where: {
        loja_id: lojaId,
        item_os: { os_id: osId },
        status_instalacao: StatusInstalacao.AGUARDANDO,
      },
      data: {
        status_instalacao: StatusInstalacao.EM_ANDAMENTO,
        data_execucao: agora,
      },
    });

    if (resultado.count > 0) {
      await this.rollupStatusOsEmAndamento(lojaId, osId, tx);
      this.logger.log(
        `${resultado.count} lote(s) da OS ${osId} promovidos para EM_ANDAMENTO (alocação completa)`,
      );
    }

    return resultado.count;
  }

  private async osAlocacaoCompleta(
    lojaId: string,
    osId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<boolean> {
    const client = tx ?? this.prisma;

    const os = await client.ordemServico.findFirst({
      where: { id: osId, loja_id: lojaId },
      select: { orcamento_id: true },
    });

    if (!os?.orcamento_id) {
      return false;
    }

    const itens = await client.itemOS.findMany({
      where: { os_id: osId },
      select: { id: true, quantidade: true },
    });

    let itensInstalaveis = 0;

    for (const item of itens) {
      const produto = await client.produtoOrcamento.findFirst({
        where: {
          id: item.id,
          orcamento_id: os.orcamento_id,
          orcamento: { loja_id: lojaId },
          instalacao_necessaria: true,
        },
        select: { id: true },
      });

      if (!produto) {
        continue;
      }

      itensInstalaveis++;

      const saldo = await this.calcularSaldoItem(
        client,
        item.id,
        lojaId,
        Math.floor(Number(item.quantidade)),
      );

      if (saldo > 0) {
        return false;
      }
    }

    return itensInstalaveis > 0;
  }

  private async calcularSaldoItem(
    client: Prisma.TransactionClient | PrismaService,
    itemOsId: string,
    lojaId: string,
    quantidadeTotal: number,
  ): Promise<number> {
    const agregado = await client.itemOSInstalacao.aggregate({
      where: { item_os_id: itemOsId, loja_id: lojaId },
      _sum: { quantidade_alocada: true },
    });

    const alocado = agregado._sum.quantidade_alocada ?? 0;
    return Math.max(0, quantidadeTotal - alocado);
  }
}
