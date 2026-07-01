import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, StatusInstalacao } from '@prisma/client';

const STATUS_LOTE_INATIVO_AGENDA: StatusInstalacao[] = [
  StatusInstalacao.CONCLUIDO,
  StatusInstalacao.LOGISTICA_NEGATIVA,
];

/**
 * Sincronização reativa de data_instalacao_agendada na OS (UX-02).
 * A fonte canônica é data_previsao em cada lote ativo e futuro.
 */
@Injectable()
export class InstalacaoAgendaSyncService {
  private readonly logger = new Logger(InstalacaoAgendaSyncService.name);

  /**
   * Atualiza OrdensServico.data_instalacao_agendada com a menor data_previsao
   * válida entre lotes ativos e futuros da OS. Se não houver, define null.
   */
  async sincronizarDataOs(
    tx: Prisma.TransactionClient,
    lojaId: string,
    osId: string,
  ): Promise<void> {
    const inicioDia = this.inicioDiaOperacional();

    const proximoLote = await tx.itemOSInstalacao.findFirst({
      where: {
        loja_id: lojaId,
        item_os: { os_id: osId },
        data_previsao: { not: null, gte: inicioDia },
        status_instalacao: { notIn: STATUS_LOTE_INATIVO_AGENDA },
      },
      select: { data_previsao: true },
      orderBy: { data_previsao: 'asc' },
    });

    const proximaData = proximoLote?.data_previsao ?? null;

    const atualizado = await tx.ordemServico.updateMany({
      where: { id: osId, loja_id: lojaId },
      data: { data_instalacao_agendada: proximaData },
    });

    if (atualizado.count === 0) {
      throw new NotFoundException(
        'Ordem de serviço não encontrada para esta loja.',
      );
    }

    this.logger.debug(
      `OS ${osId}: data_instalacao_agendada sincronizada para ${
        proximaData?.toISOString() ?? 'null'
      }`,
    );
  }

  /** Início do dia operacional (America/Sao_Paulo), alinhado ao calendário do produto. */
  private inicioDiaOperacional(): Date {
    const hojeLocal = new Date().toLocaleDateString('en-CA', {
      timeZone: 'America/Sao_Paulo',
    });
    return new Date(hojeLocal);
  }
}
