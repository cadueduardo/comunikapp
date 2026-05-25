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
