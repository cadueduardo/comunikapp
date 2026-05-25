import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrcamentoStatus } from '../../orcamentos-v2/enums/orcamento-status.enum';
import {
  AcaoCardFluxo,
  CardFluxo,
  ColunaFluxo,
  FluxoResponseData,
} from '../interfaces/fluxo.interface';

/**
 * Service que monta o agregador de Fluxo de Trabalho da Home (Fase 4).
 *
 * Cada coluna devolve no maximo `LIMITE_CARDS` cards mais recentes; o
 * `total` reflete a contagem real no banco. O detalhamento (paginacao,
 * filtros) acontece dentro de cada modulo de origem - aqui e so visao +
 * atalho.
 *
 * Mapeamento coluna -> status conforme
 * docs/fase-0-home-operacional/02-contratos-home-operacional.md secao 5.
 *
 * Estado das colunas na primeira versao:
 * - `orcamentos`, `aprovados`, `revisao_tecnica`, `producao`, `prontos`:
 *   ativas com agregacoes reais.
 * - `a_receber`: OS finalizada cuja cobranca tem saldo aberto
 *   (status em {PREVISTA, PARCIAL_PAGO, VENCIDO}). Implementado na Fase 6.E.
 * - `concluidos`: OS finalizada cuja cobranca esta liquidada
 *   (status = LIQUIDADO). Implementado na Fase 6.E.
 *
 * Sobre o criterio de "prontos": permanece como
 * `status = FINALIZADA AND (sem cobranca OR cobranca em aberto)` — quando a
 * OS finalizada e quitada, ela sai de "prontos" e passa para "concluidos",
 * mantendo o fluxo coerente.
 */
@Injectable()
export class FluxoTrabalhoService {
  private readonly logger = new Logger(FluxoTrabalhoService.name);
  // 3 cards por coluna - manter o painel compacto e legivel em layout
  // de 3 colunas × 2 linhas. O `total` continua refletindo a contagem
  // real no banco, e o front mostra "+N no modulo" quando ha mais.
  private readonly LIMITE_CARDS = 3;

  constructor(private readonly prisma: PrismaService) {}

  async montarFluxo(lojaId: string): Promise<FluxoResponseData> {
    const [
      orcamentosColuna,
      aprovadosColuna,
      revisaoTecnicaColuna,
      producaoColuna,
      prontosColuna,
      aReceberColuna,
      concluidosColuna,
    ] = await Promise.all([
      this.montarColunaOrcamentos(lojaId),
      this.montarColunaAprovados(lojaId),
      this.montarColunaRevisaoTecnica(lojaId),
      this.montarColunaProducao(lojaId),
      this.montarColunaProntos(lojaId),
      this.montarColunaAReceber(lojaId),
      this.montarColunaConcluidos(lojaId),
    ]);

    return {
      colunas: [
        orcamentosColuna,
        aprovadosColuna,
        revisaoTecnicaColuna,
        producaoColuna,
        prontosColuna,
        aReceberColuna,
        concluidosColuna,
      ],
    };
  }

  // ============================================================
  // Colunas ativas
  // ============================================================

  /**
   * `orcamentos`: Orcamentos V2 em status rascunho ou em_analise.
   * Convencao de ordenacao: atualizacao mais recente primeiro
   * (`atualizado_em`).
   */
  private async montarColunaOrcamentos(lojaId: string): Promise<ColunaFluxo> {
    const statusAtivos: string[] = [
      OrcamentoStatus.RASCUNHO,
      OrcamentoStatus.EM_ANALISE,
    ];

    const [total, registros] = await Promise.all([
      this.prisma.orcamento.count({
        where: { loja_id: lojaId, status: { in: statusAtivos } },
      }),
      this.prisma.orcamento.findMany({
        where: { loja_id: lojaId, status: { in: statusAtivos } },
        orderBy: { atualizado_em: 'desc' },
        take: this.LIMITE_CARDS,
        include: { cliente: true },
      }),
    ]);

    const cards: CardFluxo[] = registros.map((orc) => {
      const acoes: AcaoCardFluxo[] = [
        {
          id: 'abrir',
          label: 'Abrir',
          href: `/orcamentos-v2/novo?id=${orc.id}`,
        },
      ];
      if (orc.status === OrcamentoStatus.RASCUNHO) {
        acoes.push({
          id: 'enviar',
          label: 'Enviar',
          endpoint: `POST /orcamentos-v2/${orc.id}/enviar`,
        });
      }
      return {
        id: orc.id,
        tipo: 'orcamento',
        titulo: this.formatarTituloOrcamento(orc),
        subtitulo: orc.cliente?.nome ?? undefined,
        status_label: this.labelStatusOrcamento(orc.status ?? 'rascunho'),
        valor: this.toNumberSeguro(orc.preco_final),
        atualizado_em: orc.atualizado_em.toISOString(),
        acoes,
      };
    });

    return {
      id: 'orcamentos',
      label: 'Orçamentos',
      total,
      cards,
      status: 'ativa',
    };
  }

  /**
   * `aprovados`: orcamentos aprovados que ainda nao geraram OS.
   *
   * Como o vinculo OS -> orcamento e via `OrdemServico.orcamento_id`,
   * uso um sub-select via `NOT IN (SELECT orcamento_id ... )` (Prisma
   * traduz para um SQL razoavel com `where NOT IN` + `orcamento_id IS
   * NOT NULL`).
   */
  private async montarColunaAprovados(lojaId: string): Promise<ColunaFluxo> {
    const orcamentosComOS = await this.prisma.ordemServico.findMany({
      where: { loja_id: lojaId, orcamento_id: { not: null } },
      select: { orcamento_id: true },
    });
    const idsComOS = orcamentosComOS
      .map((o) => o.orcamento_id)
      .filter((id): id is string => !!id);

    const where = {
      loja_id: lojaId,
      status: OrcamentoStatus.APROVADO,
      id: { notIn: idsComOS },
    };

    const [total, registros] = await Promise.all([
      this.prisma.orcamento.count({ where }),
      this.prisma.orcamento.findMany({
        where,
        orderBy: { atualizado_em: 'desc' },
        take: this.LIMITE_CARDS,
        include: { cliente: true },
      }),
    ]);

    const cards: CardFluxo[] = registros.map((orc) => ({
      id: orc.id,
      tipo: 'orcamento',
      titulo: this.formatarTituloOrcamento(orc),
      subtitulo: orc.cliente?.nome ?? undefined,
      status_label: 'Aprovado (sem OS)',
      valor: this.toNumberSeguro(orc.preco_final),
      atualizado_em: orc.atualizado_em.toISOString(),
      acoes: [
        {
          id: 'abrir',
          label: 'Abrir',
          href: `/orcamentos-v2/novo?id=${orc.id}`,
        },
        {
          id: 'gerar_os',
          label: 'Gerar OS',
          endpoint: `POST /orcamentos-v2/${orc.id}/fechar-pedido`,
        },
      ],
    }));

    return {
      id: 'aprovados',
      label: 'Aprovados',
      total,
      cards,
      status: 'ativa',
    };
  }

  /**
   * `revisao_tecnica`: OS com `aprovacao_tecnica_status = PENDENTE`.
   * Inclui qualquer OS que ainda nao recebeu aval tecnico, independente do
   * status principal (a OS pode estar em FILA, AGUARDANDO_MATERIAL, etc.).
   */
  private async montarColunaRevisaoTecnica(
    lojaId: string,
  ): Promise<ColunaFluxo> {
    const where = {
      loja_id: lojaId,
      aprovacao_tecnica_status: 'PENDENTE',
      status: { notIn: ['CANCELADA', 'FINALIZADA'] },
    };

    const [total, registros] = await Promise.all([
      this.prisma.ordemServico.count({ where }),
      this.prisma.ordemServico.findMany({
        where,
        orderBy: { atualizado_em: 'desc' },
        take: this.LIMITE_CARDS,
        include: { cliente: true },
      }),
    ]);

    const cards: CardFluxo[] = registros.map((os) =>
      this.montarCardOS(os, 'Aguardando revisão técnica', [
        { id: 'abrir', label: 'Abrir', href: `/os/${os.id}` },
      ]),
    );

    return {
      id: 'revisao_tecnica',
      label: 'Revisão técnica',
      total,
      cards,
      status: 'ativa',
    };
  }

  /**
   * `producao`: OS em PRODUCAO ou ACABAMENTO. Tambem cobre AGUARDANDO_MATERIAL
   * para nao "sumir" da Home OS que ja foram liberadas mas estao bloqueadas
   * por estoque (a Fase 5 vai gerar alertas para esse caso).
   */
  private async montarColunaProducao(lojaId: string): Promise<ColunaFluxo> {
    const where = {
      loja_id: lojaId,
      status: { in: ['PRODUCAO', 'ACABAMENTO', 'AGUARDANDO_MATERIAL', 'FILA'] },
      aprovacao_tecnica_status: 'APROVADA',
    };

    const [total, registros] = await Promise.all([
      this.prisma.ordemServico.count({ where }),
      this.prisma.ordemServico.findMany({
        where,
        orderBy: { atualizado_em: 'desc' },
        take: this.LIMITE_CARDS,
        include: { cliente: true },
      }),
    ]);

    const cards: CardFluxo[] = registros.map((os) =>
      this.montarCardOS(os, this.labelStatusOS(os.status), [
        { id: 'abrir', label: 'Abrir', href: `/os/${os.id}` },
        { id: 'pcp', label: 'Ver PCP', href: `/pcp/kanban` },
      ]),
    );

    return {
      id: 'producao',
      label: 'Produção',
      total,
      cards,
      status: 'ativa',
    };
  }

  /**
   * `prontos`: OS FINALIZADA SEM cobranca em aberto E SEM liquidacao.
   *
   * Regra detalhada (Fase 6.E):
   * - Mostra OS finalizada cujo orcamento NAO tem cobranca registrada
   *   (caso de lojas que aprovaram sem cobranca estruturada) OU
   * - cuja cobranca esta em PREVISTA com saldo > 0 e ainda nao foi
   *   movida para "a_receber" (transicao acontece tipicamente quando a OS
   *   e finalizada).
   *
   * Para nao duplicar com `a_receber` e `concluidos`, excluimos OS cujo
   * orcamento ja tem cobranca em PARCIAL_PAGO, VENCIDO ou LIQUIDADO.
   */
  private async montarColunaProntos(lojaId: string): Promise<ColunaFluxo> {
    // OS finalizadas cujo orcamento_id esta em uma cobranca "ja classificada"
    // (a_receber ou concluidos). Essas saem desta coluna.
    const orcamentosClassificados = await this.prisma.cobranca.findMany({
      where: {
        loja_id: lojaId,
        status: { in: ['PARCIAL_PAGO', 'VENCIDO', 'LIQUIDADO'] },
      },
      select: { orcamento_id: true },
    });
    const orcamentosFora = orcamentosClassificados.map((c) => c.orcamento_id);

    const where = {
      loja_id: lojaId,
      status: 'FINALIZADA',
      orcamento_id: { notIn: orcamentosFora },
    };

    const [total, registros] = await Promise.all([
      this.prisma.ordemServico.count({ where }),
      this.prisma.ordemServico.findMany({
        where,
        orderBy: { atualizado_em: 'desc' },
        take: this.LIMITE_CARDS,
        include: { cliente: true },
      }),
    ]);

    const cards: CardFluxo[] = registros.map((os) =>
      this.montarCardOS(os, 'Pronto para entrega', [
        { id: 'abrir', label: 'Abrir', href: `/os/${os.id}` },
      ]),
    );

    return {
      id: 'prontos',
      label: 'Prontos',
      total,
      cards,
      status: 'ativa',
    };
  }

  /**
   * `a_receber` (Fase 6.E): OS finalizada cuja cobranca tem saldo aberto.
   *
   * Regra: Cobranca com status em {PARCIAL_PAGO, VENCIDO} cujo orcamento tem
   * pelo menos uma OS finalizada. Cards listam a OS para o usuario
   * conseguir abrir auditoria direto.
   */
  private async montarColunaAReceber(lojaId: string): Promise<ColunaFluxo> {
    const cobrancas = await this.prisma.cobranca.findMany({
      where: {
        loja_id: lojaId,
        status: { in: ['PARCIAL_PAGO', 'VENCIDO'] },
      },
      select: {
        id: true,
        status: true,
        valor_saldo: true,
        atualizado_em: true,
        orcamento: {
          select: {
            id: true,
            numero: true,
            titulo: true,
            ordens_servico: {
              where: { status: 'FINALIZADA' },
              select: {
                id: true,
                numero: true,
                status: true,
                atualizado_em: true,
              },
              orderBy: { atualizado_em: 'desc' },
              take: 1,
            },
          },
        },
        cliente: { select: { nome: true } },
      },
      orderBy: { atualizado_em: 'desc' },
    });

    const validas = cobrancas.filter((c) => c.orcamento.ordens_servico.length > 0);
    const total = validas.length;

    const cards: CardFluxo[] = validas.slice(0, this.LIMITE_CARDS).map((c) => {
      const osFin = c.orcamento.ordens_servico[0];
      return {
        id: c.id,
        tipo: 'os',
        titulo: osFin.numero?.toString().startsWith('OS')
          ? String(osFin.numero)
          : `OS ${osFin.numero}`,
        subtitulo: c.cliente?.nome ?? 'Sem cliente vinculado',
        status_label:
          c.status === 'VENCIDO' ? 'Saldo vencido' : 'Saldo parcial',
        valor: this.toNumberSeguro(c.valor_saldo),
        atualizado_em: (c.atualizado_em ?? osFin.atualizado_em).toISOString(),
        acoes: [
          { id: 'abrir_os', label: 'Abrir OS', href: `/os/${osFin.id}` },
          {
            id: 'auditoria',
            label: 'Auditoria',
            href: `/financeiro/recebimentos?status=${c.status}`,
          },
        ],
      };
    });

    return {
      id: 'a_receber',
      label: 'A receber',
      total,
      cards,
      status: 'ativa',
    };
  }

  /**
   * `concluidos` (Fase 6.E): OS finalizada cuja cobranca esta LIQUIDADA.
   *
   * Regra: Cobranca com status LIQUIDADO cujo orcamento tem pelo menos uma OS
   * finalizada. Cards mostram a OS resolvida (trabalho + caixa fechados).
   */
  private async montarColunaConcluidos(lojaId: string): Promise<ColunaFluxo> {
    const cobrancas = await this.prisma.cobranca.findMany({
      where: {
        loja_id: lojaId,
        status: 'LIQUIDADO',
      },
      select: {
        id: true,
        valor_total: true,
        liquidado_em: true,
        atualizado_em: true,
        orcamento: {
          select: {
            id: true,
            numero: true,
            titulo: true,
            ordens_servico: {
              where: { status: 'FINALIZADA' },
              select: {
                id: true,
                numero: true,
                status: true,
                atualizado_em: true,
              },
              orderBy: { atualizado_em: 'desc' },
              take: 1,
            },
          },
        },
        cliente: { select: { nome: true } },
      },
      orderBy: { liquidado_em: 'desc' },
    });

    const validas = cobrancas.filter((c) => c.orcamento.ordens_servico.length > 0);
    const total = validas.length;

    const cards: CardFluxo[] = validas.slice(0, this.LIMITE_CARDS).map((c) => {
      const osFin = c.orcamento.ordens_servico[0];
      return {
        id: c.id,
        tipo: 'os',
        titulo: osFin.numero?.toString().startsWith('OS')
          ? String(osFin.numero)
          : `OS ${osFin.numero}`,
        subtitulo: c.cliente?.nome ?? 'Sem cliente vinculado',
        status_label: 'Concluído',
        valor: this.toNumberSeguro(c.valor_total),
        atualizado_em: (
          c.liquidado_em ??
          c.atualizado_em ??
          osFin.atualizado_em
        ).toISOString(),
        acoes: [
          { id: 'abrir_os', label: 'Abrir OS', href: `/os/${osFin.id}` },
        ],
      };
    });

    return {
      id: 'concluidos',
      label: 'Concluídos',
      total,
      cards,
      status: 'ativa',
    };
  }

  // ============================================================
  // Helpers de formatacao
  // ============================================================

  private montarCardOS(
    os: any,
    statusLabel: string,
    acoes: AcaoCardFluxo[],
  ): CardFluxo {
    // Numero da OS ja vem como "OS-2026-007"; nao prefixar "OS" denovo.
    const titulo = os.numero?.toString().startsWith('OS')
      ? String(os.numero)
      : `OS ${os.numero}`;
    return {
      id: os.id,
      tipo: 'os',
      titulo,
      subtitulo:
        os.cliente?.nome ??
        os.nome_servico ??
        'Sem cliente vinculado',
      status_label: statusLabel,
      valor: this.toNumberSeguro(os.valor_orcado),
      atualizado_em: (os.atualizado_em ?? os.criado_em).toISOString(),
      acoes,
    };
  }

  private formatarTituloOrcamento(orc: any): string {
    const numero = orc.numero ? `Orçamento ${orc.numero}` : 'Orçamento';
    return orc.titulo ? `${numero} — ${orc.titulo}` : numero;
  }

  private labelStatusOrcamento(status: string): string {
    const mapa: Record<string, string> = {
      rascunho: 'Rascunho',
      em_analise: 'Em análise',
      aprovado: 'Aprovado',
      rejeitado: 'Rejeitado',
      em_execucao: 'Em execução',
      concluido: 'Concluído',
      cancelado: 'Cancelado',
    };
    return mapa[status] ?? status;
  }

  private labelStatusOS(status: string): string {
    const mapa: Record<string, string> = {
      FILA: 'Em fila',
      AGUARDANDO_MATERIAL: 'Aguardando material',
      PRODUCAO: 'Em produção',
      ACABAMENTO: 'Em acabamento',
      PAUSADA: 'Pausada',
      FINALIZADA: 'Finalizada',
      CANCELADA: 'Cancelada',
    };
    return mapa[status] ?? status;
  }

  private toNumberSeguro(valor: unknown): number | undefined {
    if (valor === null || valor === undefined) return undefined;
    const n =
      typeof valor === 'number'
        ? valor
        : parseFloat(String((valor as any).toString?.() ?? valor));
    return Number.isFinite(n) ? n : undefined;
  }
}
