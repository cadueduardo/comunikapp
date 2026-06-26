import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrcamentoStatus } from '../../orcamentos-v2/enums/orcamento-status.enum';
import { CobrancaStatus } from '../../financeiro/enums/cobranca-status.enum';
import { StatusExpedicao } from '../../expedicao/enums/status-expedicao.enum';
import { HomeCacheService } from './home-cache.service';
import { ContadoresMenuResponse } from '../interfaces/contadores-menu.interface';

export interface ContadoresMenuOpcoes {
  forcar?: boolean;
  /** Itens que entraram na fila do módulo após este instante (por usuário/navegador). */
  osDesde?: Date;
  pcpDesde?: Date;
  expedicaoDesde?: Date;
  financeiroDesde?: Date;
}

/**
 * Badges do menu lateral: apenas itens NOVOS desde a última visita ao módulo.
 * Não reflete o total de pendências — só alerta o que chegou depois que o usuário abriu a página.
 */
@Injectable()
export class ContadoresMenuService {
  private readonly logger = new Logger(ContadoresMenuService.name);
  private readonly CACHE_KEY = 'contadores-menu-novos';

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: HomeCacheService,
  ) {}

  async obter(
    lojaId: string,
    opcoes: ContadoresMenuOpcoes = {},
  ): Promise<ContadoresMenuResponse> {
    const { forcar = false } = opcoes;

    const chaveCache = this.montarChaveCache(lojaId, opcoes);
    if (!forcar) {
      const cached = this.cache.obter<ContadoresMenuResponse>(chaveCache);
      if (cached) {
        return cached;
      }
    }

    try {
      const [os, pcp, expedicao, financeiro] = await Promise.all([
        opcoes.osDesde
          ? this.contarNovosOs(lojaId, opcoes.osDesde)
          : Promise.resolve(0),
        opcoes.pcpDesde
          ? this.contarNovosPcp(lojaId, opcoes.pcpDesde)
          : Promise.resolve(0),
        opcoes.expedicaoDesde
          ? this.contarNovasExpedicoes(lojaId, opcoes.expedicaoDesde)
          : Promise.resolve(0),
        opcoes.financeiroDesde
          ? this.contarNovasCobrancas(lojaId, opcoes.financeiroDesde)
          : Promise.resolve(0),
      ]);

      const resultado: ContadoresMenuResponse = {
        os,
        pcp,
        expedicao,
        financeiro,
      };

      this.cache.gravar(chaveCache, resultado);
      return resultado;
    } catch (error) {
      this.logger.warn(
        `Falha ao calcular contadores do menu: ${error instanceof Error ? error.message : error}`,
      );
      return { os: 0, pcp: 0, expedicao: 0, financeiro: 0 };
    }
  }

  private montarChaveCache(
    lojaId: string,
    opcoes: ContadoresMenuOpcoes,
  ): string {
    const partes = [
      lojaId,
      this.CACHE_KEY,
      opcoes.osDesde?.toISOString() ?? '0',
      opcoes.pcpDesde?.toISOString() ?? '0',
      opcoes.expedicaoDesde?.toISOString() ?? '0',
      opcoes.financeiroDesde?.toISOString() ?? '0',
    ];
    return partes.join(':');
  }

  /**
   * OS: orçamento aprovado sem OS criada, ou OS nova aguardando revisão técnica.
   */
  private async contarNovosOs(lojaId: string, desde: Date): Promise<number> {
    const orcamentosComOS = await this.prisma.ordemServico.findMany({
      where: { loja_id: lojaId, orcamento_id: { not: null }, ativo: true },
      select: { orcamento_id: true },
    });
    const idsComOS = orcamentosComOS
      .map((o) => o.orcamento_id)
      .filter((id): id is string => !!id);

    const [aprovadosSemOs, revisaoTecnica] = await Promise.all([
      this.prisma.orcamento.count({
        where: {
          loja_id: lojaId,
          status: OrcamentoStatus.APROVADO,
          id: { notIn: idsComOS },
          OR: [
            { data_aprovacao: { gte: desde } },
            {
              data_aprovacao: null,
              atualizado_em: { gte: desde },
            },
          ],
        },
      }),
      this.prisma.ordemServico.count({
        where: {
          loja_id: lojaId,
          ativo: true,
          aprovacao_tecnica_status: 'PENDENTE',
          status: { notIn: ['CANCELADA', 'FINALIZADA'] },
          criado_em: { gte: desde },
        },
      }),
    ]);

    return aprovadosSemOs + revisaoTecnica;
  }

  /**
   * PCP: OS liberada para produção (aprovada tecnicamente) após a última visita.
   * Usa os status reais da OS (não o bucket FILA do Kanban).
   */
  private async contarNovosPcp(lojaId: string, desde: Date): Promise<number> {
    return this.prisma.ordemServico.count({
      where: {
        loja_id: lojaId,
        ativo: true,
        aprovacao_tecnica_status: 'APROVADA',
        aprovacao_tecnica_em: { gte: desde },
        status: {
          in: [
            'APROVADA_TECNICA',
            'LIBERADA_PARA_PCP',
            'EM_WORKFLOW',
            'PRODUCAO',
            'ACABAMENTO',
            'AGUARDANDO_MATERIAL',
          ],
        },
      },
    });
  }

  /**
   * Expedição: registro logístico criado após a última visita (ex.: PCP concluído).
   */
  private async contarNovasExpedicoes(
    lojaId: string,
    desde: Date,
  ): Promise<number> {
    return this.prisma.expedicaoLogistica.count({
      where: {
        loja_id: lojaId,
        ordem_servico: { ativo: true },
        criado_em: { gte: desde },
        status: {
          notIn: [
            StatusExpedicao.ENTREGUE_FINALIZADO,
            StatusExpedicao.ARQUIVADO,
            StatusExpedicao.DEVOLVIDA,
          ],
        },
      },
    });
  }

  /**
   * Financeiro: cobrança criada após a última visita (ex.: orçamento aprovado).
   */
  private async contarNovasCobrancas(
    lojaId: string,
    desde: Date,
  ): Promise<number> {
    return this.prisma.cobranca.count({
      where: {
        loja_id: lojaId,
        criado_em: { gte: desde },
        status: {
          in: [
            CobrancaStatus.PREVISTA,
            CobrancaStatus.PARCIAL_PAGO,
            CobrancaStatus.VENCIDO,
          ],
        },
      },
    });
  }
}
