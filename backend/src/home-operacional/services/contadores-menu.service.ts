import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrcamentoStatus } from '../../orcamentos-v2/enums/orcamento-status.enum';
import { CobrancaStatus } from '../../financeiro/enums/cobranca-status.enum';
import { StatusExpedicao } from '../../expedicao/enums/status-expedicao.enum';
import { filtroOsElegivelFluxoPcp } from '../../pcp/utils/os-elegivel-pcp-kanban.util';
import { ArteFilaService } from '../../modules/arte-aprovacao/services/arte-fila.service';
import { HomeCacheService } from './home-cache.service';
import { ContadoresMenuResponse } from '../interfaces/contadores-menu.interface';

export interface ContadoresMenuOpcoes {
  forcar?: boolean;
  /** Itens que entraram na fila do módulo após este instante (por usuário/navegador). */
  osDesde?: Date;
  pcpDesde?: Date;
  expedicaoDesde?: Date;
  financeiroDesde?: Date;
  arteDesde?: Date;
  instalacaoDesde?: Date;
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
    private readonly arteFilaService: ArteFilaService,
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
      const [os, pcp, expedicao, financeiro, arte, instalacao] =
        await Promise.all([
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
          opcoes.arteDesde
            ? this.arteFilaService.contarNovosDesde(lojaId, opcoes.arteDesde)
            : Promise.resolve(0),
          opcoes.instalacaoDesde
            ? this.contarNovasInstalacoes(lojaId, opcoes.instalacaoDesde)
            : Promise.resolve(0),
        ]);

      const resultado: ContadoresMenuResponse = {
        os,
        pcp,
        expedicao,
        financeiro,
        arte,
        instalacao,
      };

      this.cache.gravar(chaveCache, resultado);
      return resultado;
    } catch (error) {
      this.logger.warn(
        `Falha ao calcular contadores do menu: ${error instanceof Error ? error.message : error}`,
      );
      return {
        os: 0,
        pcp: 0,
        expedicao: 0,
        financeiro: 0,
        arte: 0,
        instalacao: 0,
      };
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
      opcoes.arteDesde?.toISOString() ?? '0',
      opcoes.instalacaoDesde?.toISOString() ?? '0',
    ];
    return partes.join(':');
  }

  /**
   * OS: orçamento aprovado sem OS criada, OS aguardando revisão técnica,
   * ou movimentação de arte (arquivo do cliente, aprovação ou liberação).
   */
  private async contarNovosOs(lojaId: string, desde: Date): Promise<number> {
    const orcamentosComOS = await this.prisma.ordemServico.findMany({
      where: { loja_id: lojaId, orcamento_id: { not: null }, ativo: true },
      select: { orcamento_id: true },
    });
    const idsComOS = orcamentosComOS
      .map((o) => o.orcamento_id)
      .filter((id): id is string => !!id);

    const [aprovadosSemOs, revisaoTecnica, movimentacaoArte, interacaoInstalacao] =
      await Promise.all([
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
        this.contarOsComMovimentacaoArte(lojaId, desde),
        this.contarOsComInteracaoInstalacao(lojaId, desde),
      ]);

    return aprovadosSemOs + revisaoTecnica + movimentacaoArte + interacaoInstalacao;
  }

  /** OS com ocorrência ou lote de instalação movimentado após a última visita. */
  private async contarOsComInteracaoInstalacao(
    lojaId: string,
    desde: Date,
  ): Promise<number> {
    const [porOcorrencia, lotes] = await Promise.all([
      this.prisma.ocorrenciaInstalacao.findMany({
        where: { loja_id: lojaId, criado_em: { gte: desde } },
        select: { os_id: true },
        distinct: ['os_id'],
      }),
      this.prisma.itemOSInstalacao.findMany({
        where: { loja_id: lojaId, atualizado_em: { gte: desde } },
        select: { item_os: { select: { os_id: true } } },
      }),
    ]);

    const osIds = new Set<string>([
      ...porOcorrencia.map((item) => item.os_id),
      ...lotes.map((item) => item.item_os.os_id),
    ]);

    return osIds.size;
  }

  /** OS com arte do cliente inserida ou versão aprovada/liberada após `desde`. */
  private async contarOsComMovimentacaoArte(
    lojaId: string,
    desde: Date,
  ): Promise<number> {
    const itensCliente = await this.prisma.itemOS.findMany({
      where: {
        os: { loja_id: lojaId, ativo: true },
        responsabilidade_arte: 'CLIENTE_FORNECE',
      },
      select: { id: true },
    });
    const itemIdsCliente = itensCliente.map((i) => i.id);

    const [porArquivoCliente, porVersao] = await Promise.all([
      itemIdsCliente.length === 0
        ? Promise.resolve([])
        : this.prisma.arteVersao.findMany({
            where: {
              loja_id: lojaId,
              deletado: false,
              servico_id: { in: itemIdsCliente },
              os: { loja_id: lojaId, ativo: true },
              arquivos: { some: { data_upload: { gte: desde } } },
            },
            select: { os_id: true },
            distinct: ['os_id'],
          }),
      this.prisma.arteVersao.findMany({
        where: {
          loja_id: lojaId,
          deletado: false,
          os: { loja_id: lojaId, ativo: true },
          OR: [
            { data_aprovacao: { gte: desde } },
            { liberado_em: { gte: desde } },
          ],
        },
        select: { os_id: true },
        distinct: ['os_id'],
      }),
    ]);

    const osIds = new Set([
      ...porArquivoCliente.map((r) => r.os_id),
      ...porVersao.map((r) => r.os_id),
    ]);

    return osIds.size;
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
        ...filtroOsElegivelFluxoPcp,
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
            StatusExpedicao.AGUARDANDO_INSTALACAO,
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

  /**
   * Instalações: entradas novas na fila do módulo após a última visita.
   *
   * Espelha o critério do grid `/instalacao` (listarOsInstalacaoGestao):
   * 1. Lote criado (baixa de produção no PCP ou rollout manual);
   * 2. OS FINALIZADA com produto instalável ainda sem lote — caso em que o
   *    lote automático foi pulado (ex.: endereço pendente de confirmação)
   *    e o gestor precisa alocar manualmente.
   */
  private async contarNovasInstalacoes(
    lojaId: string,
    desde: Date,
  ): Promise<number> {
    const [lotesNovos, osFinalizadasSemLote] = await Promise.all([
      this.prisma.itemOSInstalacao.count({
        where: {
          loja_id: lojaId,
          criado_em: { gte: desde },
          status_instalacao: {
            in: ['AGUARDANDO', 'EM_ANDAMENTO', 'LOGISTICA_NEGATIVA'],
          },
        },
      }),
      this.prisma.ordemServico.count({
        where: {
          loja_id: lojaId,
          ativo: true,
          status: 'FINALIZADA',
          atualizado_em: { gte: desde },
          orcamento_id: { not: null },
          orcamento: {
            loja_id: lojaId,
            produtos: { some: { instalacao_necessaria: true } },
          },
          itens: {
            none: {
              lotes_instalacao: { some: { loja_id: lojaId } },
            },
          },
        },
      }),
    ]);

    return lotesNovos + osFinalizadasSemLote;
  }
}
