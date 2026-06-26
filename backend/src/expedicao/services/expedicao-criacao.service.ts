import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { HomeCacheService } from '../../home-operacional/services/home-cache.service';
import { StatusExpedicao } from '../enums/status-expedicao.enum';
import { ExpedicaoModalidadeMapper } from './expedicao-modalidade.mapper';

export type MotivoSkipExpedicaoCriacao =
  | 'JA_EXISTE'
  | 'OS_INTERNA'
  | 'OS_NAO_ENCONTRADA';

export interface ResultadoCriacaoExpedicao {
  criado: boolean;
  reativado?: boolean;
  expedicao_id?: string;
  motivo_skip?: MotivoSkipExpedicaoCriacao;
}

/**
 * Cria registro em `expedicoes_logistica` quando a OS entra no fluxo logístico.
 *
 * Idempotência: no máximo um registro não-`DEVOLVIDA` por OS/loja.
 * Após devolução (`DEVOLVIDA`), uma nova conclusão de produção pode gerar novo registro.
 */
@Injectable()
export class ExpedicaoCriacaoService {
  private readonly logger = new Logger(ExpedicaoCriacaoService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly modalidadeMapper: ExpedicaoModalidadeMapper,
    private readonly homeCacheService: HomeCacheService,
  ) {}

  /**
   * Gatilho compartilhado pelos hooks do PCP e da OS manual.
   * Falhas são logadas pelo caller — não devem reverter a conclusão da produção.
   */
  async criarSeElegivel(
    osId: string,
    lojaId: string,
  ): Promise<ResultadoCriacaoExpedicao> {
    const os = await this.prisma.ordemServico.findFirst({
      where: { id: osId, loja_id: lojaId },
      select: {
        id: true,
        loja_id: true,
        tipo_os: true,
        orcamento_id: true,
      },
    });

    if (!os) {
      this.logger.warn(
        `Expedição não criada: OS ${osId} não encontrada na loja ${lojaId}`,
      );
      return { criado: false, motivo_skip: 'OS_NAO_ENCONTRADA' };
    }

    if (String(os.tipo_os).toUpperCase() === 'INTERNA') {
      this.logger.debug(`OS ${osId} interna — fora do fluxo de expedição`);
      return { criado: false, motivo_skip: 'OS_INTERNA' };
    }

    const modalidade = await this.resolverModalidadeInicial(
      os.orcamento_id,
      lojaId,
    );

    return this.prisma.$transaction(async (tx) => {
      const existenteAtivo = await tx.expedicaoLogistica.findFirst({
        where: {
          os_id: osId,
          loja_id: lojaId,
          status: {
            notIn: [StatusExpedicao.DEVOLVIDA, StatusExpedicao.ARQUIVADO],
          },
        },
        select: { id: true },
      });

      if (existenteAtivo) {
        this.logger.debug(
          `Expedição já existe para OS ${osId} (${existenteAtivo.id}) — idempotente`,
        );
        return {
          criado: false,
          expedicao_id: existenteAtivo.id,
          motivo_skip: 'JA_EXISTE' as const,
        };
      }

      const arquivadaPorReversaoPcp = await tx.expedicaoLogistica.findFirst({
        where: {
          os_id: osId,
          loja_id: lojaId,
          status: StatusExpedicao.ARQUIVADO,
        },
        orderBy: { atualizado_em: 'desc' },
        select: { id: true },
      });

      if (arquivadaPorReversaoPcp) {
        await tx.expedicaoLogistica.update({
          where: { id: arquivadaPorReversaoPcp.id },
          data: {
            status: StatusExpedicao.AGUARDANDO_SEPARACAO,
            atualizado_em: new Date(),
          },
        });

        this.homeCacheService.invalidarPorPrefixo(`${lojaId}:`);

        this.logger.log(
          `Expedição ${arquivadaPorReversaoPcp.id} reativada para OS ${osId} após nova conclusão no PCP`,
        );

        return {
          criado: true,
          reativado: true,
          expedicao_id: arquivadaPorReversaoPcp.id,
        };
      }

      const criada = await tx.expedicaoLogistica.create({
        data: {
          loja_id: lojaId,
          os_id: osId,
          modalidade,
          status: StatusExpedicao.AGUARDANDO_SEPARACAO,
        },
        select: { id: true },
      });

      this.logger.log(
        `Expedição ${criada.id} criada para OS ${osId} (modalidade ${modalidade})`,
      );

      this.homeCacheService.invalidarPorPrefixo(`${lojaId}:`);

      return {
        criado: true,
        expedicao_id: criada.id,
      };
    });
  }

  async cancelarPorReversaoConclusaoPcp(
    osId: string,
    lojaId: string,
  ): Promise<{ cancelada: boolean; expedicao_id?: string }> {
    const expedicao = await this.prisma.expedicaoLogistica.findFirst({
      where: {
        os_id: osId,
        loja_id: lojaId,
        status: StatusExpedicao.AGUARDANDO_SEPARACAO,
      },
      select: { id: true },
    });

    if (!expedicao) {
      return { cancelada: false };
    }

    await this.prisma.expedicaoLogistica.update({
      where: { id: expedicao.id },
      data: {
        status: StatusExpedicao.ARQUIVADO,
        atualizado_em: new Date(),
      },
    });

    this.homeCacheService.invalidarPorPrefixo(`${lojaId}:`);

    this.logger.log(
      `Expedição ${expedicao.id} arquivada — OS ${osId} revertida para produção no PCP`,
    );

    return { cancelada: true, expedicao_id: expedicao.id };
  }

  private async resolverModalidadeInicial(
    orcamentoId: string | null,
    lojaId: string,
  ) {
    if (!orcamentoId) {
      return this.modalidadeMapper.resolver({
        instalacaoNecessaria: false,
        nomeModalidadeEntrega: null,
      });
    }

    const orcamento = await this.prisma.orcamento.findFirst({
      where: { id: orcamentoId, loja_id: lojaId },
      select: {
        entrega_modalidade: { select: { nome: true } },
        produtos: { select: { instalacao_necessaria: true } },
      },
    });

    const instalacaoNecessaria =
      orcamento?.produtos.some((p) => p.instalacao_necessaria) ?? false;

    return this.modalidadeMapper.resolver({
      instalacaoNecessaria,
      nomeModalidadeEntrega: orcamento?.entrega_modalidade?.nome ?? null,
    });
  }
}
