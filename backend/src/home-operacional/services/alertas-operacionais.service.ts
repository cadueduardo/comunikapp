import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  Alerta,
  AlertasPorNivel,
  AlertasResponseData,
  NivelAlerta,
} from '../interfaces/alerta.interface';

/**
 * Limiares de tempo para os alertas. Hoje hardcoded conforme decisao de
 * 2026-05-25; podem virar configuracao por loja em fase futura.
 */
const LIMITE_DIAS_ORCAMENTO_PARADO = 5;
const LIMITE_DIAS_APROVADO_SEM_OS = 1;

// Status terminais ou que ja decidiram aprovacao - ignorados pelo alerta de
// "OS aguardando aprovacao tecnica".
const STATUS_OS_IGNORAR_APROVACAO = new Set([
  'FINALIZADA',
  'CANCELADA',
  'REJEITADA',
  'APROVADA_TECNICA',
]);

// Status que indicam OS ja liberada para producao - usados nos alertas
// "liberada sem workflow" e "materiais insuficientes".
const STATUS_OS_LIBERADA = new Set([
  'APROVADA_TECNICA',
  'LIBERADA_PARA_PCP',
  'PRODUCAO',
  'ACABAMENTO',
  'AGUARDANDO_MATERIAL',
]);

@Injectable()
export class AlertasOperacionaisService {
  private readonly logger = new Logger(AlertasOperacionaisService.name);

  constructor(private readonly prisma: PrismaService) {}

  async listar(lojaId: string): Promise<AlertasResponseData> {
    // Roda os detectores em paralelo - cada um isolado para nao derrubar os
    // demais se uma query falhar (ex.: tabela ainda nao existente em ambiente
    // antigo). Cada detector retorna sempre um array (possivelmente vazio).
    const blocos = await Promise.all([
      this.detectarOrcamentosParados(lojaId),
      this.detectarOrcamentosAprovadosSemOS(lojaId),
      this.detectarOSsAguardandoAprovacaoTecnica(lojaId),
      this.detectarOSsLiberadasSemWorkflow(lojaId),
      this.detectarEstoqueAbaixoDoMinimo(lojaId),
      this.detectarOSsSemMateriais(lojaId),
      this.detectarTrabalhoProntoSemRecebimento(lojaId), // Fase 6.E - 7o alerta
    ]);

    const alertas = blocos.flat();

    // Ordenacao: critico > atencao > informativo; dentro do mesmo nivel,
    // mais recentes primeiro (criado_em desc).
    const ordemNivel: Record<NivelAlerta, number> = {
      critico: 0,
      atencao: 1,
      informativo: 2,
    };
    alertas.sort((a, b) => {
      const diff = ordemNivel[a.nivel] - ordemNivel[b.nivel];
      if (diff !== 0) return diff;
      return b.criado_em.localeCompare(a.criado_em);
    });

    const porNivel: AlertasPorNivel = { critico: 0, atencao: 0, informativo: 0 };
    for (const a of alertas) {
      porNivel[a.nivel] += 1;
    }

    return {
      total: alertas.length,
      por_nivel: porNivel,
      alertas,
    };
  }

  // -------------------------------------------------------------------
  // Detectores - cada um retorna [] em qualquer falha para nao derrubar.
  // -------------------------------------------------------------------

  private async detectarOrcamentosParados(lojaId: string): Promise<Alerta[]> {
    try {
      const limite = subtrairDias(new Date(), LIMITE_DIAS_ORCAMENTO_PARADO);
      const orcamentos = await this.prisma.orcamento.findMany({
        where: {
          loja_id: lojaId,
          // Considera "parado" qualquer orcamento ainda em fluxo comercial.
          status: { in: ['rascunho', 'em_analise'] },
          atualizado_em: { lt: limite },
        },
        select: {
          id: true,
          numero: true,
          atualizado_em: true,
          cliente: { select: { nome: true } },
        },
        orderBy: { atualizado_em: 'asc' },
        take: 20,
      });

      return orcamentos.map((o) => {
        const dias = Math.floor(
          (Date.now() - new Date(o.atualizado_em).getTime()) /
            (1000 * 60 * 60 * 24),
        );
        const clienteNome = o.cliente?.nome ?? 'Cliente nao informado';
        return {
          id: `orcamento_parado_${o.id}`,
          nivel: 'atencao',
          titulo: `Orçamento ${o.numero} parado há ${dias} dia${dias === 1 ? '' : 's'}`,
          descricao: `Cliente: ${clienteNome} — sem alteração há mais de ${LIMITE_DIAS_ORCAMENTO_PARADO} dias.`,
          origem: 'orcamentos',
          criado_em: new Date(o.atualizado_em).toISOString(),
          acao: {
            tipo: 'link',
            label: 'Abrir orçamento',
            href: `/orcamentos-v2/${o.id}`,
          },
        } satisfies Alerta;
      });
    } catch (error) {
      this.logger.warn(`detectarOrcamentosParados falhou: ${this.descreverErro(error)}`);
      return [];
    }
  }

  private async detectarOrcamentosAprovadosSemOS(
    lojaId: string,
  ): Promise<Alerta[]> {
    try {
      const limite = subtrairDias(new Date(), LIMITE_DIAS_APROVADO_SEM_OS);
      const aprovados = await this.prisma.orcamento.findMany({
        where: {
          loja_id: lojaId,
          status: 'aprovado',
          atualizado_em: { lt: limite },
        },
        select: {
          id: true,
          numero: true,
          atualizado_em: true,
          cliente: { select: { nome: true } },
        },
        orderBy: { atualizado_em: 'asc' },
        take: 30,
      });
      if (aprovados.length === 0) return [];

      const orcamentoIds = aprovados.map((o) => o.id);
      const ossExistentes = await this.prisma.ordemServico.findMany({
        where: { loja_id: lojaId, orcamento_id: { in: orcamentoIds } },
        select: { orcamento_id: true },
      });
      const comOS = new Set(
        ossExistentes
          .map((os) => os.orcamento_id)
          .filter((v): v is string => !!v),
      );

      return aprovados
        .filter((o) => !comOS.has(o.id))
        .map((o) => {
          const dias = Math.floor(
            (Date.now() - new Date(o.atualizado_em).getTime()) /
              (1000 * 60 * 60 * 24),
          );
          const clienteNome = o.cliente?.nome ?? 'Cliente nao informado';
          return {
            id: `orcamento_aprovado_sem_os_${o.id}`,
            nivel: 'atencao',
            titulo: `Orçamento ${o.numero} aprovado sem OS gerada`,
            descricao: `Cliente: ${clienteNome} — aprovado há ${dias} dia${dias === 1 ? '' : 's'} sem OS correspondente.`,
            origem: 'orcamentos',
            criado_em: new Date(o.atualizado_em).toISOString(),
            acao: {
              tipo: 'link',
              label: 'Abrir orçamento',
              href: `/orcamentos-v2/${o.id}`,
            },
          } satisfies Alerta;
        });
    } catch (error) {
      this.logger.warn(
        `detectarOrcamentosAprovadosSemOS falhou: ${this.descreverErro(error)}`,
      );
      return [];
    }
  }

  private async detectarOSsAguardandoAprovacaoTecnica(
    lojaId: string,
  ): Promise<Alerta[]> {
    try {
      const ossPendentes = await this.prisma.ordemServico.findMany({
        where: {
          loja_id: lojaId,
          aprovacao_tecnica_status: 'PENDENTE',
          // Ignora OS ja decididas/terminais (vide STATUS_OS_IGNORAR_APROVACAO).
          status: { notIn: Array.from(STATUS_OS_IGNORAR_APROVACAO) },
        },
        select: {
          id: true,
          numero: true,
          criado_em: true,
          cliente: { select: { nome: true } },
        },
        orderBy: { criado_em: 'asc' },
        take: 20,
      });

      return ossPendentes.map((os) => {
        const clienteNome = os.cliente?.nome ?? 'Cliente nao informado';
        return {
          id: `os_aguardando_aprovacao_tecnica_${os.id}`,
          nivel: 'atencao',
          titulo: `OS ${os.numero} aguardando aprovação técnica`,
          descricao: `Cliente: ${clienteNome} — checkpoint técnico pendente antes de liberar para produção.`,
          origem: 'os',
          criado_em: new Date(os.criado_em).toISOString(),
          acao: {
            tipo: 'link',
            label: 'Abrir OS',
            href: `/os/${os.id}`,
          },
        } satisfies Alerta;
      });
    } catch (error) {
      this.logger.warn(
        `detectarOSsAguardandoAprovacaoTecnica falhou: ${this.descreverErro(error)}`,
      );
      return [];
    }
  }

  private async detectarOSsLiberadasSemWorkflow(
    lojaId: string,
  ): Promise<Alerta[]> {
    try {
      const oss = await this.prisma.ordemServico.findMany({
        where: {
          loja_id: lojaId,
          status: { in: Array.from(STATUS_OS_LIBERADA) },
          workflow_instancia: null,
        },
        select: {
          id: true,
          numero: true,
          atualizado_em: true,
          status: true,
          cliente: { select: { nome: true } },
        },
        orderBy: { atualizado_em: 'asc' },
        take: 20,
      });

      return oss.map((os) => {
        const clienteNome = os.cliente?.nome ?? 'Cliente nao informado';
        return {
          id: `os_liberada_sem_workflow_${os.id}`,
          nivel: 'critico',
          titulo: `OS ${os.numero} sem workflow atribuído`,
          descricao: `Cliente: ${clienteNome} — OS em ${os.status} sem instância de workflow.`,
          origem: 'pcp',
          criado_em: new Date(os.atualizado_em).toISOString(),
          acao: {
            tipo: 'link',
            label: 'Abrir OS',
            href: `/os/${os.id}`,
          },
        } satisfies Alerta;
      });
    } catch (error) {
      this.logger.warn(
        `detectarOSsLiberadasSemWorkflow falhou: ${this.descreverErro(error)}`,
      );
      return [];
    }
  }

  private async detectarEstoqueAbaixoDoMinimo(
    lojaId: string,
  ): Promise<Alerta[]> {
    try {
      // estoque_minimo e Int e estoque_atual e Decimal: o filtro de comparacao
      // direta nao funciona em Prisma sem $queryRaw. Buscamos os candidatos
      // com estoque_minimo > 0 e fazemos o filtro em memoria.
      const candidatos = await this.prisma.insumo.findMany({
        where: {
          loja_id: lojaId,
          ativo: true,
          estoque_minimo: { gt: 0 },
        },
        select: {
          id: true,
          nome: true,
          estoque_atual: true,
          estoque_minimo: true,
          unidade_uso: true,
        },
        take: 50,
      });

      const filtrados = candidatos.filter((i) => {
        const atual = numeroSeguro(i.estoque_atual);
        const minimo = numeroSeguro(i.estoque_minimo);
        return atual < minimo;
      });

      return filtrados.slice(0, 20).map((i) => {
        const atual = numeroSeguro(i.estoque_atual);
        const minimo = numeroSeguro(i.estoque_minimo);
        const unidade = i.unidade_uso || '';
        return {
          id: `estoque_abaixo_minimo_${i.id}`,
          nivel: 'atencao',
          titulo: `${i.nome} abaixo do estoque mínimo`,
          descricao: `Atual: ${atual.toLocaleString('pt-BR')} ${unidade} | Mínimo: ${minimo.toLocaleString('pt-BR')} ${unidade}`,
          origem: 'estoque',
          // Sem coluna de data nessa entidade - usa instante atual como criado_em
          // para ordenacao estavel dentro do nivel.
          criado_em: new Date().toISOString(),
          acao: {
            tipo: 'link',
            label: 'Abrir insumo',
            href: `/insumos`,
          },
        } satisfies Alerta;
      });
    } catch (error) {
      this.logger.warn(
        `detectarEstoqueAbaixoDoMinimo falhou: ${this.descreverErro(error)}`,
      );
      return [];
    }
  }

  private async detectarOSsSemMateriais(lojaId: string): Promise<Alerta[]> {
    try {
      // OS liberada para producao mas com flag materiais_disponivel = false
      // representa um caso critico: a producao pode ja ter iniciado sem ter
      // todos os materiais reservados/disponiveis.
      const oss = await this.prisma.ordemServico.findMany({
        where: {
          loja_id: lojaId,
          status: { in: Array.from(STATUS_OS_LIBERADA) },
          materiais_disponivel: false,
        },
        select: {
          id: true,
          numero: true,
          atualizado_em: true,
          status: true,
          cliente: { select: { nome: true } },
        },
        orderBy: { atualizado_em: 'asc' },
        take: 20,
      });

      return oss.map((os) => {
        const clienteNome = os.cliente?.nome ?? 'Cliente nao informado';
        return {
          id: `os_sem_materiais_${os.id}`,
          nivel: 'critico',
          titulo: `OS ${os.numero} sem materiais confirmados`,
          descricao: `Cliente: ${clienteNome} — OS em ${os.status} e materiais ainda não confirmados como disponíveis.`,
          origem: 'estoque',
          criado_em: new Date(os.atualizado_em).toISOString(),
          acao: {
            tipo: 'link',
            label: 'Abrir OS',
            href: `/os/${os.id}`,
          },
        } satisfies Alerta;
      });
    } catch (error) {
      this.logger.warn(
        `detectarOSsSemMateriais falhou: ${this.descreverErro(error)}`,
      );
      return [];
    }
  }

  /**
   * 7o alerta (Fase 6.E): trabalho pronto sem recebimento.
   *
   * Definicao operacional (alinhada ao plano):
   * - Existe uma OS com `status = FINALIZADA` AND
   * - A cobranca associada ao orcamento dessa OS tem `valor_saldo > 0` AND
   *   `status IN (PREVISTA, PARCIAL_PAGO, VENCIDO)`.
   *
   * Como funciona em SQL via Prisma:
   * - Partimos das cobrancas com saldo aberto e status nao-terminal,
   *   incluindo o orcamento e a OS associada (via relation `orcamento.os`).
   * - Filtramos em memoria por OS finalizada (a relacao 1:N de OS pode ter
   *   varias entradas; consideramos qualquer uma com status FINALIZADA).
   *
   * Nivel `atencao` - alinhado ao catalogo da Fase 0 (doc
   * 02-contratos-home-operacional.md). O dono do projeto pode promover para
   * `critico` se a operacao mostrar necessidade.
   */
  private async detectarTrabalhoProntoSemRecebimento(
    lojaId: string,
  ): Promise<Alerta[]> {
    try {
      const cobrancas = await this.prisma.cobranca.findMany({
        where: {
          loja_id: lojaId,
          status: { in: ['PREVISTA', 'PARCIAL_PAGO', 'VENCIDO'] },
          // valor_saldo > 0: Prisma com Decimal aceita .gt(0)
          valor_saldo: { gt: 0 },
        },
        select: {
          id: true,
          status: true,
          valor_saldo: true,
          orcamento_id: true,
          orcamento: {
            select: {
              id: true,
              numero: true,
              titulo: true,
              ordens_servico: {
                select: {
                  id: true,
                  numero: true,
                  status: true,
                  atualizado_em: true,
                },
              },
            },
          },
          cliente: { select: { nome: true } },
        },
        take: 50,
      });

      const alertas: Alerta[] = [];
      for (const cob of cobrancas) {
        const osFinalizada = cob.orcamento.ordens_servico.find(
          (o) => o.status === 'FINALIZADA',
        );
        if (!osFinalizada) continue;

        const saldo = numeroSeguro(cob.valor_saldo);
        const clienteNome = cob.cliente?.nome ?? 'Cliente nao informado';
        const valorFormatado = saldo.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        });

        alertas.push({
          id: `trabalho_pronto_sem_recebimento_${cob.id}`,
          nivel: 'atencao',
          titulo: `OS ${osFinalizada.numero} finalizada com saldo aberto`,
          descricao: `Cliente: ${clienteNome} — ${valorFormatado} pendente de recebimento (cobranca ${cob.status}).`,
          origem: 'financeiro',
          criado_em: new Date(osFinalizada.atualizado_em).toISOString(),
          acao: {
            tipo: 'link',
            label: 'Abrir auditoria',
            href: `/financeiro/recebimentos?status=${cob.status}`,
          },
        });

        if (alertas.length >= 20) break;
      }

      return alertas;
    } catch (error) {
      this.logger.warn(
        `detectarTrabalhoProntoSemRecebimento falhou: ${this.descreverErro(error)}`,
      );
      return [];
    }
  }

  private descreverErro(error: unknown): string {
    if (error instanceof Error) return error.message;
    return String(error);
  }
}

function subtrairDias(base: Date, dias: number): Date {
  const novo = new Date(base);
  novo.setDate(novo.getDate() - dias);
  return novo;
}

function numeroSeguro(valor: unknown): number {
  if (valor === null || valor === undefined) return 0;
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : 0;
  if (typeof valor === 'string') {
    const n = Number(valor);
    return Number.isFinite(n) ? n : 0;
  }
  // Prisma Decimal: tem toNumber()
  const maybeDecimal = valor as { toNumber?: () => number };
  if (typeof maybeDecimal.toNumber === 'function') {
    const n = maybeDecimal.toNumber();
    return Number.isFinite(n) ? n : 0;
  }
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
}
