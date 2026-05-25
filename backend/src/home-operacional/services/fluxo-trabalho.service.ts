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
 * - `a_receber`, `concluidos`: ficam com `status: 'aguardando_modulo'` e
 *   payload vazio ate a Fase 6 introduzir a entidade Cobranca. Decisao
 *   confirmada com o dono do projeto em 2026-05-25.
 *
 * Sobre o criterio de "prontos": o contrato original diz
 * `status = FINALIZADA AND cobranca.status IN {PREVISTA_SALDO, PARCIAL_PAGO}`.
 * Enquanto Cobranca nao existe, simplifico para `status = FINALIZADA`,
 * que ainda devolve dado util e nao induz a Home a esconder OS finalizadas.
 * Quando a Fase 6 entrar, restringimos no mesmo lugar.
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
    ] = await Promise.all([
      this.montarColunaOrcamentos(lojaId),
      this.montarColunaAprovados(lojaId),
      this.montarColunaRevisaoTecnica(lojaId),
      this.montarColunaProducao(lojaId),
      this.montarColunaProntos(lojaId),
    ]);

    const aReceberColuna = this.montarColunaAguardandoModulo(
      'a_receber',
      'A receber',
      'Aguardando módulo financeiro (Fase 6).',
    );
    const concluidosColuna = this.montarColunaAguardandoModulo(
      'concluidos',
      'Concluídos',
      'Aguardando módulo financeiro (Fase 6).',
    );

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
   * `prontos`: OS FINALIZADA. Quando Cobranca existir (Fase 6),
   * restringimos para `cobranca.status IN {PREVISTA_SALDO, PARCIAL_PAGO}`.
   */
  private async montarColunaProntos(lojaId: string): Promise<ColunaFluxo> {
    const where = {
      loja_id: lojaId,
      status: 'FINALIZADA',
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

  // ============================================================
  // Coluna placeholder (aguardando_modulo)
  // ============================================================

  private montarColunaAguardandoModulo(
    id: ColunaFluxo['id'],
    label: string,
    aviso: string,
  ): ColunaFluxo {
    return {
      id,
      label,
      total: 0,
      cards: [],
      status: 'aguardando_modulo',
      aviso,
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
