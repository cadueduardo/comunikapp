import { Injectable, Logger } from '@nestjs/common';
import {
  ParcelaStatus,
  ParcelaTipo,
} from '../../financeiro/enums/cobranca-status.enum';
import { PrismaService } from '../../prisma/prisma.service';
import {
  StatusLiberacaoPcp,
  StatusLiberacaoPcpValor,
} from '../constants/pcp-liberacao.constants';
import { ConfiguracaoInstalacaoService } from './configuracao-instalacao.service';

export interface ResultadoDesbloqueioSinal {
  itens_desbloqueados: number;
  orcamento_id: string | null;
}

/**
 * Trava e destrava itens do PCP conforme compensação do sinal (50%).
 * Não interfere no módulo de Arte & Aprovação.
 */
@Injectable()
export class PcpBloqueioSinalService {
  private readonly logger = new Logger(PcpBloqueioSinalService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configuracaoInstalacaoService: ConfiguracaoInstalacaoService,
  ) {}

  async resolverStatusInicialItem(
    lojaId: string,
    orcamentoId?: string | null,
  ): Promise<StatusLiberacaoPcpValor> {
    const exigir =
      await this.configuracaoInstalacaoService.deveExigirSinalProducao(lojaId);

    if (!exigir) {
      return StatusLiberacaoPcp.PENDENTE;
    }

    if (orcamentoId && (await this.entradaJaLiquidada(lojaId, orcamentoId))) {
      return StatusLiberacaoPcp.PENDENTE;
    }

    return StatusLiberacaoPcp.BLOQUEADO_AGUARDANDO_SINAL;
  }

  async entradaJaLiquidada(
    lojaId: string,
    orcamentoId: string,
  ): Promise<boolean> {
    const cobranca = await this.prisma.cobranca.findFirst({
      where: { loja_id: lojaId, orcamento_id: orcamentoId },
      include: {
        parcelas: {
          where: { tipo: ParcelaTipo.ENTRADA },
          take: 1,
        },
      },
    });

    if (!cobranca?.parcelas.length) {
      return false;
    }

    return cobranca.parcelas[0].status === ParcelaStatus.LIQUIDADO;
  }

  /**
   * Hook financeiro: parcela ENTRADA liquidada libera itens aguardando sinal.
   */
  async processarEntradaLiquidadaCobranca(
    lojaId: string,
    cobrancaId: string,
  ): Promise<ResultadoDesbloqueioSinal> {
    const cobranca = await this.prisma.cobranca.findFirst({
      where: { id: cobrancaId, loja_id: lojaId },
      select: { orcamento_id: true },
    });

    if (!cobranca?.orcamento_id) {
      return { itens_desbloqueados: 0, orcamento_id: null };
    }

    const itensDesbloqueados = await this.desbloquearItensPorOrcamento(
      lojaId,
      cobranca.orcamento_id,
    );

    return {
      itens_desbloqueados: itensDesbloqueados,
      orcamento_id: cobranca.orcamento_id,
    };
  }

  async desbloquearItensPorOrcamento(
    lojaId: string,
    orcamentoId: string,
  ): Promise<number> {
    const resultado = await this.prisma.itemOS.updateMany({
      where: {
        status_liberacao_pcp: StatusLiberacaoPcp.BLOQUEADO_AGUARDANDO_SINAL,
        os: {
          loja_id: lojaId,
          orcamento_id: orcamentoId,
        },
      },
      data: {
        status_liberacao_pcp: StatusLiberacaoPcp.PENDENTE,
      },
    });

    if (resultado.count > 0) {
      this.logger.log(
        `${resultado.count} item(ns) desbloqueado(s) para produção após liquidação do sinal — orçamento ${orcamentoId}`,
      );

      const ordens = await this.prisma.ordemServico.findMany({
        where: { loja_id: lojaId, orcamento_id: orcamentoId },
        select: { id: true, status: true },
      });

      for (const os of ordens) {
        if (os.status === 'AGUARDANDO_APROVACAO_FINANCEIRA') {
          await this.prisma.ordemServico.update({
            where: { id: os.id },
            data: { status: 'AGUARDANDO_APROVACAO_TECNICA' },
          });
        }

        await this.prisma.ordemServicoLog.create({
          data: {
            os_id: os.id,
            tipo_acao: 'PCP_DESBLOQUEIO_SINAL',
            descricao:
              'Itens liberados para planejamento de produção após compensação do sinal (50%).',
            usuario_id: null,
          },
        });
      }
    }

    return resultado.count;
  }
}
