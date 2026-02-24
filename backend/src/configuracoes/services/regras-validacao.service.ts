/**
 * Serviço de Regras de Validação
 * CRUD para regras de validação
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateRegraValidacaoDto,
  UpdateRegraValidacaoDto,
  ListarRegrasDto,
  TestarRegraDto,
} from '../dto/regra-validacao.dto';
import {
  RegraValidacao,
  FiltrosRegras,
} from '../interfaces/validacao.interface';

@Injectable()
export class RegrasValidacaoService {
  private readonly logger = new Logger(RegrasValidacaoService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Criar nova regra de validação
   */
  async criar(dto: CreateRegraValidacaoDto, usuarioId: string): Promise<any> {
    this.logger.log(`Criando regra: ${dto.nome}`);

    const regra = await this.prisma.regraValidacao.create({
      data: {
        nome: dto.nome,
        descricao: dto.descricao,
        tipo: dto.tipo as any,
        categoria: dto.categoria as any,
        ativo: dto.ativo ?? true,
        prioridade: dto.prioridade ?? 1,
        loja_id: dto.loja_id || null,
        condicoes: JSON.stringify(dto.condicoes || {}),
        acoes: dto.acoes ? JSON.stringify(dto.acoes) : null,
        mensagem: dto.mensagem || 'Validação automática',
      },
    });

    this.logger.log(`Regra criada com ID: ${regra.id}`);
    return regra;
  }

  /**
   * Listar regras com filtros
   */
  async listar(filtros: ListarRegrasDto) {
    const where: any = {};

    if (filtros.loja_id) {
      where.OR = [
        { loja_id: filtros.loja_id },
        { loja_id: null }, // Regras globais
      ];
    }

    if (filtros.categoria) {
      where.categoria = filtros.categoria;
    }

    if (filtros.ativo !== undefined) {
      where.ativo = filtros.ativo;
    }

    if (filtros.busca) {
      where.OR = [
        { nome: { contains: filtros.busca, mode: 'insensitive' } },
        { descricao: { contains: filtros.busca, mode: 'insensitive' } },
      ];
    }

    const [regras, total] = await Promise.all([
      this.prisma.regraValidacao.findMany({
        where,
        include: {
          _count: {
            select: { execucoes: true },
          },
        },
        orderBy: [{ prioridade: 'asc' }, { nome: 'asc' }],
        skip: ((filtros.page || 1) - 1) * (filtros.limit || 10),
        take: filtros.limit || 10,
      }),
      this.prisma.regraValidacao.count({ where }),
    ]);

    return {
      data: regras,
      total,
      page: filtros.page || 1,
      limit: filtros.limit || 10,
      totalPages: Math.ceil(total / (filtros.limit || 10)),
    };
  }

  /**
   * Obter regra por ID
   */
  async obter(id: string): Promise<any> {
    const regra = await this.prisma.regraValidacao.findUnique({
      where: { id },
      include: {
        loja: {
          select: { nome: true },
        },
        execucoes: {
          take: 10,
          orderBy: { criado_em: 'desc' },
          select: {
            id: true,
            resultado: true,
            mensagem: true,
            criado_em: true,
          },
        },
      },
    });

    if (!regra) {
      throw new NotFoundException('Regra não encontrada');
    }

    return regra;
  }

  /**
   * Atualizar regra
   */
  async atualizar(
    id: string,
    dto: UpdateRegraValidacaoDto,
    usuarioId: string,
  ): Promise<any> {
    this.logger.log(`Atualizando regra: ${id}`);

    const updateData: any = {
      atualizado_por: usuarioId,
    };

    if (dto.nome !== undefined) updateData.nome = dto.nome;
    if (dto.descricao !== undefined) updateData.descricao = dto.descricao;
    if (dto.tipo !== undefined) updateData.tipo = dto.tipo;
    if (dto.categoria !== undefined) updateData.categoria = dto.categoria;
    if (dto.ativo !== undefined) updateData.ativo = dto.ativo;
    if (dto.prioridade !== undefined) updateData.prioridade = dto.prioridade;
    if (dto.loja_id !== undefined) updateData.loja_id = dto.loja_id || null;
    if (dto.condicoes !== undefined) updateData.condicoes = dto.condicoes;
    if (dto.acoes !== undefined) updateData.acoes = dto.acoes;

    const regra = await this.prisma.regraValidacao.update({
      where: { id },
      data: updateData,
    });

    this.logger.log(`Regra atualizada: ${id}`);
    return regra;
  }

  /**
   * Deletar regra
   */
  async deletar(id: string): Promise<void> {
    this.logger.log(`Deletando regra: ${id}`);

    await this.prisma.regraValidacao.delete({
      where: { id },
    });

    this.logger.log(`Regra deletada: ${id}`);
  }

  /**
   * Duplicar regra
   */
  async duplicar(id: string, usuarioId: string): Promise<any> {
    this.logger.log(`Duplicando regra: ${id}`);

    const regraOriginal = await this.obter(id);

    const regraDuplicada = await this.prisma.regraValidacao.create({
      data: {
        nome: `${regraOriginal.nome} (Cópia)`,
        descricao: regraOriginal.descricao,
        tipo: regraOriginal.tipo,
        categoria: regraOriginal.categoria,
        ativo: false, // Cópia inativa por padrão
        prioridade: regraOriginal.prioridade,
        loja_id: regraOriginal.loja_id || null,
        condicoes: regraOriginal.condicoes,
        acoes: regraOriginal.acoes,
        mensagem: regraOriginal.mensagem,
      },
    });

    this.logger.log(`Regra duplicada: ${regraDuplicada.id}`);
    return regraDuplicada;
  }

  /**
   * Testar regra específica
   */
  async testar(id: string, dto: TestarRegraDto, lojaId: string) {
    this.logger.log(`Testando regra: ${id}`);

    const regra = await this.obter(id);

    // Simular execução da regra
    const campo = this.obterValorCampo(dto.dados_os, regra.condicoes.campo);
    const valor = this.calcularValor(regra.condicoes.valor, dto.dados_os);

    const condicaoAtendida = this.avaliarCondicao(
      campo,
      regra.condicoes.operador,
      valor,
    );

    return {
      regra_id: id,
      regra_nome: regra.nome,
      dados_teste: dto.dados_os,
      campo_avaliado: regra.condicoes.campo,
      valor_campo: campo,
      valor_esperado: valor,
      operador: regra.condicoes.operador,
      condicao_atendida: condicaoAtendida,
      resultado: condicaoAtendida ? 'SUCESSO' : 'ERRO',
      mensagem: condicaoAtendida
        ? 'Regra atendida'
        : regra.condicoes.mensagem_erro || 'Regra não atendida',
      acao: condicaoAtendida ? null : regra.acoes,
    };
  }

  /**
   * Obter regras ativas para execução
   */
  async obterRegrasAtivas(lojaId: string, regraIds?: string[]): Promise<any[]> {
    const where: any = {
      ativo: true,
      OR: [
        { loja_id: lojaId },
        { loja_id: null }, // Regras globais
      ],
    };

    if (regraIds?.length) {
      where.id = { in: regraIds };
    }

    const regras = await this.prisma.regraValidacao.findMany({
      where,
      orderBy: { prioridade: 'asc' },
    });

    return regras;
  }

  /**
   * Obter categorias disponíveis
   */
  async obterCategorias() {
    return [
      { id: 'ESTOQUE', nome: 'Estoque', cor: '#ef4444', icone: 'package' },
      { id: 'ARTE', nome: 'Arte', cor: '#8b5cf6', icone: 'image' },
      { id: 'DADOS', nome: 'Dados', cor: '#06b6d4', icone: 'database' },
      { id: 'PRAZO', nome: 'Prazo', cor: '#f59e0b', icone: 'clock' },
      {
        id: 'FINANCEIRO',
        nome: 'Financeiro',
        cor: '#10b981',
        icone: 'dollar-sign',
      },
      { id: 'TECNICO', nome: 'Técnico', cor: '#6366f1', icone: 'settings' },
      { id: 'COMERCIAL', nome: 'Comercial', cor: '#ec4899', icone: 'users' },
    ];
  }

  // Métodos auxiliares para teste
  private obterValorCampo(os: any, campo: string): any {
    const campos = campo.split('.');
    let valor = os;

    for (const c of campos) {
      valor = valor?.[c];
      if (valor === undefined) break;
    }

    return valor;
  }

  private calcularValor(expressao: any, os: any): any {
    if (typeof expressao === 'number' || typeof expressao === 'boolean') {
      return expressao;
    }

    if (typeof expressao === 'string') {
      return this.avaliarExpressao(expressao, os);
    }

    return expressao;
  }

  private avaliarCondicao(campo: any, operador: string, valor: any): boolean {
    switch (operador) {
      case 'equals':
        return campo === valor;
      case 'greater_than':
        return campo > valor;
      case 'greater_than_or_equal':
        return campo >= valor;
      case 'less_than':
        return campo < valor;
      case 'less_than_or_equal':
        return campo <= valor;
      case 'contains':
        return campo?.includes(valor);
      case 'not_equals':
        return campo !== valor;
      case 'in':
        return Array.isArray(valor) && valor.includes(campo);
      case 'not_in':
        return Array.isArray(valor) && !valor.includes(campo);
      case 'is_null':
        return campo === null || campo === undefined;
      case 'is_not_null':
        return campo !== null && campo !== undefined;
      default:
        return false;
    }
  }

  private avaliarExpressao(expressao: string, os: any): number {
    try {
      let expr = expressao;
      const campos = expressao.match(/\w+(?:\.\w+)*/g) || [];

      for (const campo of campos) {
        const valor = this.obterValorCampo(os, campo);
        if (valor !== undefined) {
          expr = expr.replace(new RegExp(campo, 'g'), valor);
        }
      }

      return eval(expr);
    } catch (error) {
      this.logger.error(`Erro ao avaliar expressão ${expressao}:`, error);
      return 0;
    }
  }
}
