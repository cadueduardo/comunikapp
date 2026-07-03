import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  StatusInstalacao,
  StatusInstalacaoOs,
} from '@prisma/client';
import { StatusExpedicao } from '../../expedicao/enums/status-expedicao.enum';
import { PrismaService } from '../../prisma/prisma.service';

const STATUS_LOTE_ENCERRADO: StatusInstalacao[] = [
  StatusInstalacao.CONCLUIDO,
  StatusInstalacao.LOGISTICA_NEGATIVA,
];

/**
 * Transições de encerramento do ciclo de instalação (DEC-04).
 * Operações devem rodar dentro da mesma transação Prisma do chamador.
 */
@Injectable()
export class InstalacaoFechamentoService {
  private readonly logger = new Logger(InstalacaoFechamentoService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Quando todos os lotes da OS estão encerrados em campo, retém a OS e a expedição
   * aguardando relatório técnico no Financeiro — sem finalizar a expedição.
   */
  async reterAposInstalacaoCompleta(
    tx: Prisma.TransactionClient,
    lojaId: string,
    osId: string,
  ): Promise<void> {
    const pendentes = await tx.itemOSInstalacao.count({
      where: {
        loja_id: lojaId,
        item_os: { os_id: osId },
        status_instalacao: { notIn: STATUS_LOTE_ENCERRADO },
      },
    });

    if (pendentes > 0) {
      return;
    }

    const totalLotes = await tx.itemOSInstalacao.count({
      where: {
        loja_id: lojaId,
        item_os: { os_id: osId },
      },
    });

    if (totalLotes === 0) {
      return;
    }

    await tx.ordemServico.updateMany({
      where: { id: osId, loja_id: lojaId },
      data: {
        status_instalacao_os: StatusInstalacaoOs.AGUARDANDO_RELATORIO_TECNICO,
      },
    });

    const expedicaoAtualizada = await tx.expedicaoLogistica.updateMany({
      where: {
        os_id: osId,
        loja_id: lojaId,
        status: StatusExpedicao.AGUARDANDO_INSTALACAO,
      },
      data: {
        status: StatusExpedicao.AGUARDANDO_FECHAMENTO,
        atualizado_em: new Date(),
      },
    });

    if (expedicaoAtualizada.count > 0) {
      this.logger.log(
        `OS ${osId}: instalação em campo concluída — expedição retida em AGUARDANDO_FECHAMENTO (DEC-04)`,
      );
    }
  }

  /**
   * Auto-reparo: relatório técnico já persistido, mas status da OS desatualizado
   * (ex.: aprovação anterior sem transição ou dado legado).
   */
  async reconciliarStatusComRelatorioEmitido(
    lojaId: string,
    osIds: string[],
  ): Promise<Set<string>> {
    if (osIds.length === 0) {
      return new Set();
    }

    const relatorios = await this.prisma.relatorioTecnicoInstalacao.findMany({
      where: { loja_id: lojaId, os_id: { in: osIds } },
      select: { os_id: true },
    });

    const corrigidos = new Set<string>();

    for (const relatorio of relatorios) {
      const corrigiu = await this.prisma.$transaction((tx) =>
        this.concluirInstalacaoComRelatorioExistente(
          tx,
          lojaId,
          relatorio.os_id,
        ),
      );
      if (corrigiu) {
        corrigidos.add(relatorio.os_id);
      }
    }

    return corrigidos;
  }

  private async concluirInstalacaoComRelatorioExistente(
    tx: Prisma.TransactionClient,
    lojaId: string,
    osId: string,
  ): Promise<boolean> {
    const relatorio = await tx.relatorioTecnicoInstalacao.findFirst({
      where: { os_id: osId, loja_id: lojaId },
      select: { id: true },
    });

    if (!relatorio) {
      return false;
    }

    const atualizada = await tx.ordemServico.updateMany({
      where: {
        id: osId,
        loja_id: lojaId,
        status_instalacao_os: { not: StatusInstalacaoOs.CONCLUIDA },
      },
      data: { status_instalacao_os: StatusInstalacaoOs.CONCLUIDA },
    });

    if (atualizada.count === 0) {
      return false;
    }

    await tx.expedicaoLogistica.updateMany({
      where: {
        os_id: osId,
        loja_id: lojaId,
        status: StatusExpedicao.AGUARDANDO_FECHAMENTO,
      },
      data: {
        status: StatusExpedicao.ENTREGUE_FINALIZADO,
        data_conclusao: new Date(),
        atualizado_em: new Date(),
      },
    });

    this.logger.warn(
      `OS ${osId}: status_instalacao_os corrigido para CONCLUIDA (relatório técnico já existia)`,
    );

    return true;
  }

  /**
   * Gatilho comercial (DEC-04): após relatório técnico aprovado no Financeiro,
   * conclui a OS e libera a expedição retida em AGUARDANDO_FECHAMENTO.
   */
  async finalizarAposRelatorioTecnico(
    tx: Prisma.TransactionClient,
    lojaId: string,
    osId: string,
  ): Promise<void> {
    const os = await tx.ordemServico.findFirst({
      where: { id: osId, loja_id: lojaId },
      select: { id: true, status_instalacao_os: true },
    });

    if (!os) {
      throw new NotFoundException(
        'Ordem de serviço não encontrada para esta loja.',
      );
    }

    if (
      os.status_instalacao_os !==
      StatusInstalacaoOs.AGUARDANDO_RELATORIO_TECNICO
    ) {
      throw new BadRequestException(
        'A OS não está aguardando relatório técnico para conclusão.',
      );
    }

    await tx.ordemServico.updateMany({
      where: {
        id: osId,
        loja_id: lojaId,
        status_instalacao_os:
          StatusInstalacaoOs.AGUARDANDO_RELATORIO_TECNICO,
      },
      data: {
        status_instalacao_os: StatusInstalacaoOs.CONCLUIDA,
      },
    });

    const expedicaoAtualizada = await tx.expedicaoLogistica.updateMany({
      where: {
        os_id: osId,
        loja_id: lojaId,
        status: StatusExpedicao.AGUARDANDO_FECHAMENTO,
      },
      data: {
        status: StatusExpedicao.ENTREGUE_FINALIZADO,
        data_conclusao: new Date(),
        atualizado_em: new Date(),
      },
    });

    if (expedicaoAtualizada.count > 0) {
      this.logger.log(
        `OS ${osId}: relatório técnico aprovado — expedição finalizada (DEC-04)`,
      );
    } else {
      this.logger.warn(
        `OS ${osId}: relatório técnico aprovado sem expedição em AGUARDANDO_FECHAMENTO`,
      );
    }
  }
}
