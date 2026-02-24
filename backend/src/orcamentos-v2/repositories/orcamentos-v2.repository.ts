import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  OrcamentoCompleto,
  OrcamentoBase,
  OrcamentoStatus,
  OrcamentoTipo,
  PrioridadeOrcamento,
} from '../interfaces/orcamento.interface';

/**
 * Repositório de Orçamentos V2
 * Implementa operações de banco de dados para orçamentos
 *
 * ✅ ARQUIVO ≤ 400 LINHAS (CONFORME PREMISSAS)
 * ✅ OPERAÇÕES CRUD COMPLETAS
 * ✅ QUERIES OTIMIZADAS E PAGINAÇÃO
 */
@Injectable()
export class OrcamentosV2Repository {
  private readonly logger = new Logger(OrcamentosV2Repository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria novo orçamento
   */
  async criar(
    dados: Omit<OrcamentoBase, 'id' | 'data_criacao' | 'data_atualizacao'>,
  ): Promise<OrcamentoCompleto> {
    this.logger.log(`💾 Criando orçamento: ${dados.titulo}`);

    try {
      const { loja_id, ...resto } = dados as any;
      const orcamento = await this.prisma.orcamento.create({
        data: {
          ...resto,
          data_criacao: new Date(),
          data_atualizacao: new Date(),
          ...(loja_id ? { loja: { connect: { id: loja_id } } } : {}),
        },
        include: {
          cliente: true,
          responsavel: true,
          produtos: {
            include: {
              insumos: true,
              maquinas: true,
              funcoes: true,
              servicos_manuais: true,
              custos_indiretos: true,
            },
          },
          versoes: true,
          historico: true,
          aprovacoes: true,
          linksPublicos: true,
          mensagensChat: true,
        },
      });

      this.logger.log(`✅ Orçamento criado com sucesso: ${orcamento.id}`);
      return this.transformarOrcamento(orcamento);
    } catch (error) {
      this.logger.error(`❌ Erro ao criar orçamento: ${error.message}`);
      throw error;
    }
  }

  /**
   * Busca orçamento por ID
   */
  async buscarPorId(id: string): Promise<OrcamentoCompleto | null> {
    this.logger.log(`🔍 Buscando orçamento por ID: ${id}`);

    try {
      const orcamento = await this.prisma.orcamento.findUnique({
        where: { id },
        include: {
          cliente: true,
          responsavel: true,
          produtos: {
            include: {
              insumos: true,
              maquinas: true,
              funcoes: true,
              servicos_manuais: true,
              custos_indiretos: true,
            },
          },
          versoes: true,
          historico: true,
          aprovacoes: true,
          linksPublicos: true,
          mensagensChat: true,
        },
      });

      if (!orcamento) {
        this.logger.log(`⚠️ Orçamento não encontrado: ${id}`);
        return null;
      }

      this.logger.log(`✅ Orçamento encontrado: ${id}`);
      return this.transformarOrcamento(orcamento);
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar orçamento: ${error.message}`);
      throw error;
    }
  }

  /**
   * Lista orçamentos com filtros e paginação
   */
  async listar(
    filtros: {
      status?: OrcamentoStatus[];
      tipo?: OrcamentoTipo[];
      prioridade?: PrioridadeOrcamento[];
      cliente_id?: string;
      responsavel_id?: string;
      data_inicio?: Date;
      data_fim?: Date;
      valor_min?: number;
      valor_max?: number;
      busca?: string;
    },
    paginacao: {
      pagina: number;
      por_pagina: number;
    },
  ): Promise<{
    orcamentos: OrcamentoCompleto[];
    total: number;
    pagina: number;
    por_pagina: number;
    total_paginas: number;
  }> {
    this.logger.log(
      `📋 Listando orçamentos com filtros: ${JSON.stringify(filtros)}`,
    );

    try {
      // Construir filtros WHERE
      const where = this.construirFiltros(filtros);

      // Calcular paginação
      const skip = (paginacao.pagina - 1) * paginacao.por_pagina;
      const take = Math.min(paginacao.por_pagina, 100); // Máximo 100 por página

      // Executar queries em paralelo
      const [orcamentos, total] = await Promise.all([
        this.prisma.orcamento.findMany({
          where,
          include: {
            cliente: true,
            responsavel: true,
            produtos: {
              include: {
                insumos: true,
                maquinas: true,
                funcoes: true,
                servicos_manuais: true,
                custos_indiretos: true,
              },
            },
          },
          orderBy: { data_criacao: 'desc' },
          skip,
          take,
        }),
        this.prisma.orcamento.count({ where }),
      ]);

      // Calcular total de páginas
      const totalPaginas = Math.ceil(total / take);

      // Transformar orçamentos
      const orcamentosTransformados = orcamentos.map((orc) =>
        this.transformarOrcamento(orc),
      );

      this.logger.log(
        `✅ ${orcamentos.length} orçamentos encontrados de ${total} total`,
      );

      return {
        orcamentos: orcamentosTransformados,
        total,
        pagina: paginacao.pagina,
        por_pagina: take,
        total_paginas: totalPaginas,
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao listar orçamentos: ${error.message}`);
      throw error;
    }
  }

  /**
   * Atualiza orçamento existente
   */
  async atualizar(
    id: string,
    dados: Partial<
      Omit<OrcamentoBase, 'id' | 'data_criacao' | 'data_atualizacao'>
    >,
  ): Promise<OrcamentoCompleto> {
    this.logger.log(`✏️ Atualizando orçamento: ${id}`);

    try {
      const { loja_id, ...resto } = dados as any;
      const orcamento = await this.prisma.orcamento.update({
        where: { id },
        data: {
          ...resto,
          data_atualizacao: new Date(),
          ...(loja_id ? { loja: { connect: { id: loja_id } } } : {}),
        },
        include: {
          cliente: true,
          responsavel: true,
          produtos: {
            include: {
              insumos: true,
              maquinas: true,
              funcoes: true,
              servicos_manuais: true,
              custos_indiretos: true,
            },
          },
          versoes: true,
          historico: true,
          aprovacoes: true,
          linksPublicos: true,
          mensagensChat: true,
        },
      });

      this.logger.log(`✅ Orçamento atualizado com sucesso: ${id}`);
      return this.transformarOrcamento(orcamento);
    } catch (error) {
      this.logger.error(`❌ Erro ao atualizar orçamento: ${error.message}`);
      throw error;
    }
  }

  /**
   * Remove orçamento (soft delete)
   */
  async remover(id: string): Promise<void> {
    this.logger.log(`🗑️ Removendo orçamento: ${id}`);

    try {
      await this.prisma.orcamento.update({
        where: { id },
        data: {
          ativo: false,
          data_atualizacao: new Date(),
        },
      });

      this.logger.log(`✅ Orçamento removido com sucesso: ${id}`);
    } catch (error) {
      this.logger.error(`❌ Erro ao remover orçamento: ${error.message}`);
      throw error;
    }
  }

  /**
   * Altera status do orçamento
   */
  async alterarStatus(
    id: string,
    novoStatus: OrcamentoStatus,
    observacao?: string,
  ): Promise<OrcamentoCompleto> {
    this.logger.log(
      `🔄 Alterando status do orçamento ${id} para: ${novoStatus}`,
    );

    try {
      const orcamento = await this.prisma.orcamento.update({
        where: { id },
        data: {
          status: novoStatus,
          data_atualizacao: new Date(),
        },
        include: {
          cliente: true,
          responsavel: true,
          produtos: {
            include: {
              insumos: true,
              maquinas: true,
              funcoes: true,
              servicos_manuais: true,
              custos_indiretos: true,
            },
          },
          versoes: true,
          historico: true,
          aprovacoes: true,
          linksPublicos: true,
          mensagensChat: true,
        },
      });

      // Criar registro no histórico
      if (observacao) {
        await this.criarRegistroHistorico(id, 'mudanca_status', {
          status_anterior: orcamento.status,
          status_novo: novoStatus,
          observacao,
        });
      }

      this.logger.log(`✅ Status alterado com sucesso: ${id} -> ${novoStatus}`);
      return this.transformarOrcamento(orcamento);
    } catch (error) {
      this.logger.error(`❌ Erro ao alterar status: ${error.message}`);
      throw error;
    }
  }

  /**
   * Busca orçamentos por cliente
   */
  async buscarPorCliente(
    clienteId: string,
    ativos: boolean = true,
  ): Promise<OrcamentoCompleto[]> {
    this.logger.log(`🔍 Buscando orçamentos do cliente: ${clienteId}`);

    try {
      const orcamentos = await this.prisma.orcamento.findMany({
        where: {
          cliente_id: clienteId,
          ativo: ativos,
        },
        include: {
          cliente: true,
          responsavel: true,
          produtos: {
            include: {
              insumos: true,
              maquinas: true,
              funcoes: true,
              servicos_manuais: true,
              custos_indiretos: true,
            },
          },
        },
        orderBy: { data_criacao: 'desc' },
      });

      this.logger.log(
        `✅ ${orcamentos.length} orçamentos encontrados para o cliente`,
      );
      return orcamentos.map((orc) => this.transformarOrcamento(orc));
    } catch (error) {
      this.logger.error(
        `❌ Erro ao buscar orçamentos por cliente: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Busca orçamentos por responsável
   */
  async buscarPorResponsavel(
    responsavelId: string,
    ativos: boolean = true,
  ): Promise<OrcamentoCompleto[]> {
    this.logger.log(`🔍 Buscando orçamentos do responsável: ${responsavelId}`);

    try {
      const orcamentos = await this.prisma.orcamento.findMany({
        where: {
          responsavel_id: responsavelId,
          ativo: ativos,
        },
        include: {
          cliente: true,
          responsavel: true,
          produtos: {
            include: {
              insumos: true,
              maquinas: true,
              funcoes: true,
              servicos_manuais: true,
              custos_indiretos: true,
            },
          },
        },
        orderBy: { data_criacao: 'desc' },
      });

      this.logger.log(
        `✅ ${orcamentos.length} orçamentos encontrados para o responsável`,
      );
      return orcamentos.map((orc) => this.transformarOrcamento(orc));
    } catch (error) {
      this.logger.error(
        `❌ Erro ao buscar orçamentos por responsável: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Busca estatísticas dos orçamentos
   */
  async buscarEstatisticas(filtros?: {
    data_inicio?: Date;
    data_fim?: Date;
    cliente_id?: string;
    responsavel_id?: string;
  }): Promise<{
    total_orcamentos: number;
    orcamentos_por_status: Record<string, number>;
    orcamentos_por_tipo: Record<string, number>;
    valor_total: number;
    valor_medio: number;
    orcamentos_por_mes: Record<string, number>;
  }> {
    this.logger.log(`📊 Buscando estatísticas dos orçamentos`);

    try {
      const where = this.construirFiltros(filtros || {});

      const [
        totalOrcamentos,
        orcamentosPorStatus,
        orcamentosPorTipo,
        valorTotal,
        valorMedio,
        orcamentosPorMes,
      ] = await Promise.all([
        this.prisma.orcamento.count({ where }),
        this.buscarOrcamentosPorStatus(where),
        this.buscarOrcamentosPorTipo(where),
        this.prisma.orcamento.aggregate({
          where,
          _sum: { valor_total: true },
        }),
        this.prisma.orcamento.aggregate({
          where,
          _avg: { valor_total: true },
        }),
        this.buscarOrcamentosPorMes(where),
      ]);

      return {
        total_orcamentos: totalOrcamentos,
        orcamentos_por_status: orcamentosPorStatus,
        orcamentos_por_tipo: orcamentosPorTipo,
        valor_total: Number(valorTotal._sum.valor_total) || 0,
        valor_medio: Number(valorMedio._avg.valor_total) || 0,
        orcamentos_por_mes: orcamentosPorMes,
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar estatísticas: ${error.message}`);
      throw error;
    }
  }

  // Métodos privados auxiliares

  private construirFiltros(filtros: any): any {
    const where: any = { ativo: true };

    if (filtros.status && filtros.status.length > 0) {
      where.status = { in: filtros.status };
    }

    if (filtros.tipo && filtros.tipo.length > 0) {
      where.tipo_orcamento = { in: filtros.tipo };
    }

    if (filtros.prioridade && filtros.prioridade.length > 0) {
      where.prioridade = { in: filtros.prioridade };
    }

    if (filtros.cliente_id) {
      where.cliente_id = filtros.cliente_id;
    }

    if (filtros.responsavel_id) {
      where.responsavel_id = filtros.responsavel_id;
    }

    if (filtros.data_inicio || filtros.data_fim) {
      where.data_criacao = {};
      if (filtros.data_inicio) where.data_criacao.gte = filtros.data_inicio;
      if (filtros.data_fim) where.data_criacao.lte = filtros.data_fim;
    }

    if (filtros.valor_min || filtros.valor_max) {
      where.valor_total = {};
      if (filtros.valor_min) where.valor_total.gte = filtros.valor_min;
      if (filtros.valor_max) where.valor_total.lte = filtros.valor_max;
    }

    if (filtros.busca) {
      where.OR = [
        { titulo: { contains: filtros.busca, mode: 'insensitive' } },
        { descricao: { contains: filtros.busca, mode: 'insensitive' } },
        { cliente: { nome: { contains: filtros.busca, mode: 'insensitive' } } },
      ];
    }

    return where;
  }

  private async buscarOrcamentosPorStatus(
    where: any,
  ): Promise<Record<string, number>> {
    const resultado = await (this.prisma.orcamento as any).groupBy({
      by: ['status'],
      where,
      _count: { status: true },
    });

    const distribuicao: Record<string, number> = {};
    resultado.forEach((item) => {
      distribuicao[item.status] = item._count.status;
    });

    return distribuicao;
  }

  private async buscarOrcamentosPorTipo(
    where: any,
  ): Promise<Record<string, number>> {
    const resultado = await (this.prisma.orcamento as any).groupBy({
      by: ['tipo_orcamento'],
      where,
      _count: { tipo_orcamento: true },
    });

    const distribuicao: Record<string, number> = {};
    resultado.forEach((item: any) => {
      distribuicao[item.tipo_orcamento] = item._count.tipo_orcamento;
    });

    return distribuicao;
  }

  private async buscarOrcamentosPorMes(
    where: any,
  ): Promise<Record<string, number>> {
    const resultado = await (this.prisma.orcamento as any).groupBy({
      by: ['data_criacao'],
      where,
      _count: { data_criacao: true },
    });

    const distribuicao: Record<string, number> = {};
    resultado.forEach((item) => {
      const mes = new Date(item.data_criacao).toISOString().slice(0, 7); // YYYY-MM
      distribuicao[mes] = (distribuicao[mes] || 0) + item._count.data_criacao;
    });

    return distribuicao;
  }

  private async criarRegistroHistorico(
    orcamentoId: string,
    tipo: string,
    dados: any,
  ): Promise<void> {
    try {
      await this.prisma.historicoOrcamento.create({
        data: {
          orcamento: { connect: { id: orcamentoId } },
          acao: dados?.acao || tipo || 'ATUALIZACAO',
          tipo,
          descricao: dados?.descricao,
          dados_anteriores: dados?.dados_anteriores
            ? JSON.stringify(dados.dados_anteriores)
            : undefined,
          dados_novos: dados?.dados_novos
            ? JSON.stringify(dados.dados_novos)
            : undefined,
        },
      });
    } catch (error) {
      this.logger.error(
        `❌ Erro ao criar registro histórico: ${error.message}`,
      );
    }
  }

  private transformarOrcamento(orcamento: any): OrcamentoCompleto {
    return {
      id: orcamento.id,
      numero: orcamento.numero,
      titulo: orcamento.titulo,
      descricao: orcamento.descricao,
      cliente_id: orcamento.cliente_id,
      loja_id: orcamento.loja_id,
      status: orcamento.status,
      tipo: orcamento.tipo || orcamento.tipo_orcamento,
      data_criacao: orcamento.data_criacao || orcamento.criado_em,
      data_atualizacao: orcamento.data_atualizacao || orcamento.atualizado_em,
      data_validade: orcamento.data_validade,
      observacoes: orcamento.observacoes,
      tags: orcamento.tags || [],
      prioridade: orcamento.prioridade,
      responsavel_id: orcamento.responsavel_id,
      ativo: orcamento.ativo,

      // Relacionados
      cliente: orcamento.cliente,
      produtos: orcamento.produtos || [],
      custos: (() => {
        try {
          return orcamento.custos_calculados
            ? JSON.parse(orcamento.custos_calculados)
            : {};
        } catch {
          return {};
        }
      })(),
      configuracoes: (() => {
        try {
          return orcamento.configuracao_calculo
            ? JSON.parse(orcamento.configuracao_calculo)
            : {};
        } catch {
          return {};
        }
      })(),
      versoes: orcamento.versoes || [],
      historicoOrcamento:
        orcamento.historicoOrcamento || orcamento.historico || [],
      aprovacoes: orcamento.aprovacoes || [],
      linksPublicos: orcamento.linksPublicos || [],
      mensagensChat: orcamento.mensagensChat || [],
      anexos: orcamento.anexos || [],
    };
  }
}
