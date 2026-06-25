import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StatusExpedicao } from '../enums/status-expedicao.enum';
import { ExpedicaoModalidadeMapper } from './expedicao-modalidade.mapper';

export type MotivoSkipExpedicaoCriacao =
  | 'JA_EXISTE'
  | 'OS_INTERNA'
  | 'OS_NAO_ENCONTRADA';

export interface ResultadoCriacaoExpedicao {
  criado: boolean;
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
      const existente = await tx.expedicaoLogistica.findFirst({
        where: {
          os_id: osId,
          loja_id: lojaId,
          status: { not: StatusExpedicao.DEVOLVIDA },
        },
        select: { id: true },
      });

      if (existente) {
        this.logger.debug(
          `Expedição já existe para OS ${osId} (${existente.id}) — idempotente`,
        );
        return {
          criado: false,
          expedicao_id: existente.id,
          motivo_skip: 'JA_EXISTE' as const,
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

      return {
        criado: true,
        expedicao_id: criada.id,
      };
    });
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
