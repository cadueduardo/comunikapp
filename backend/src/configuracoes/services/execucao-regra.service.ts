/**
 * Serviço de Execução de Regras
 * Gerencia execuções e histórico de validações
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ExecucaoRegra } from '../interfaces/validacao.interface';

@Injectable()
export class ExecucaoRegraService {
  private readonly logger = new Logger(ExecucaoRegraService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registrar execução de uma regra
   */
  async registrarExecucao(dados: {
    regra_id: string;
    os_id: string;
    resultado: 'SUCESSO' | 'ERRO' | 'ALERTA' | 'BLOQUEIO';
    mensagem?: string;
    dados_execucao?: Record<string, any>;
    tempo_execucao: number;
  }): Promise<ExecucaoRegra> {
    this.logger.debug(`Registrando execução da regra ${dados.regra_id} para OS ${dados.os_id}`);

    const execucao = await this.prisma.execucaoRegra.create({
      data: {
        regra_id: dados.regra_id,
        os_id: dados.os_id,
        resultado: dados.resultado,
        mensagem: dados.mensagem,
        dados_execucao: dados.dados_execucao,
        tempo_execucao: dados.tempo_execucao,
      },
    });

    return execucao as ExecucaoRegra;
  }

  /**
   * Listar execuções com filtros
   */
  async listarExecucoes(filtros: {
    regra_id?: string;
    os_id?: string;
    resultado?: string;
    data_inicio?: Date;
    data_fim?: Date;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};
    
    if (filtros.regra_id) {
      where.regra_id = filtros.regra_id;
    }
    
    if (filtros.os_id) {
      where.os_id = filtros.os_id;
    }
    
    if (filtros.resultado) {
      where.resultado = filtros.resultado;
    }
    
    if (filtros.data_inicio || filtros.data_fim) {
      where.criado_em = {};
      if (filtros.data_inicio) {
        where.criado_em.gte = filtros.data_inicio;
      }
      if (filtros.data_fim) {
        where.criado_em.lte = filtros.data_fim;
      }
    }

    const [execucoes, total] = await Promise.all([
      this.prisma.execucaoRegra.findMany({
        where,
        include: {
          regra: {
            select: { 
              nome: true, 
              categoria: true,
              tipo: true
            }
          },
          os: {
            select: { 
              numero: true,
              nome_servico: true
            }
          }
        },
        orderBy: { criado_em: 'desc' },
        skip: ((filtros.page || 1) - 1) * (filtros.limit || 20),
        take: filtros.limit || 20
      }),
      this.prisma.execucaoRegra.count({ where })
    ]);

    return {
      data: execucoes,
      total,
      page: filtros.page || 1,
      limit: filtros.limit || 20,
      totalPages: Math.ceil(total / (filtros.limit || 20))
    };
  }

  /**
   * Obter estatísticas de execução
   */
  async obterEstatisticas(filtros: {
    regra_id?: string;
    data_inicio?: Date;
    data_fim?: Date;
  }) {
    const where: any = {};
    
    if (filtros.regra_id) {
      where.regra_id = filtros.regra_id;
    }
    
    if (filtros.data_inicio || filtros.data_fim) {
      where.criado_em = {};
      if (filtros.data_inicio) {
        where.criado_em.gte = filtros.data_inicio;
      }
      if (filtros.data_fim) {
        where.criado_em.lte = filtros.data_fim;
      }
    }

    const [
      totalExecucoes,
      execucoesPorResultado,
      tempoMedioExecucao,
      regrasMaisExecutadas
    ] = await Promise.all([
      this.prisma.execucaoRegra.count({ where }),
      this.prisma.execucaoRegra.groupBy({
        by: ['resultado'],
        where,
        _count: { id: true }
      }),
      this.prisma.execucaoRegra.aggregate({
        where,
        _avg: { tempo_execucao: true }
      }),
      this.prisma.execucaoRegra.groupBy({
        by: ['regra_id'],
        where,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5
      })
    ]);

    // Buscar nomes das regras mais executadas
    const regrasIds = regrasMaisExecutadas.map(r => r.regra_id);
    const regras = await this.prisma.regraValidacao.findMany({
      where: { id: { in: regrasIds } },
      select: { id: true, nome: true, categoria: true }
    });

    const regrasComNomes = regrasMaisExecutadas.map(regra => {
      const regraInfo = regras.find(r => r.id === regra.regra_id);
      return {
        regra_id: regra.regra_id,
        regra_nome: regraInfo?.nome || 'Regra não encontrada',
        categoria: regraInfo?.categoria || 'DESCONHECIDA',
        execucoes: regra._count.id
      };
    });

    return {
      total_execucoes: totalExecucoes,
      execucoes_por_resultado: execucoesPorResultado.reduce((acc, item) => {
        acc[item.resultado] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
      tempo_medio_execucao: Math.round((tempoMedioExecucao._avg.tempo_execucao || 0) * 100) / 100,
      regras_mais_executadas: regrasComNomes
    };
  }

  /**
   * Limpar execuções antigas (manutenção)
   */
  async limparExecucoesAntigas(diasParaManter: number = 90): Promise<number> {
    this.logger.log(`Limpando execuções mais antigas que ${diasParaManter} dias`);

    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - diasParaManter);

    const resultado = await this.prisma.execucaoRegra.deleteMany({
      where: {
        criado_em: { lt: dataLimite }
      }
    });

    this.logger.log(`${resultado.count} execuções antigas removidas`);
    return resultado.count;
  }

  /**
   * Obter execuções de uma OS específica
   */
  async obterExecucoesOS(osId: string) {
    return await this.prisma.execucaoRegra.findMany({
      where: { os_id: osId },
      include: {
        regra: {
          select: { 
            nome: true, 
            categoria: true,
            tipo: true
          }
        }
      },
      orderBy: { criado_em: 'desc' }
    });
  }

  /**
   * Obter execuções de uma regra específica
   */
  async obterExecucoesRegra(regraId: string, limit: number = 50) {
    return await this.prisma.execucaoRegra.findMany({
      where: { regra_id: regraId },
      include: {
        os: {
          select: { 
            numero: true,
            nome_servico: true
          }
        }
      },
      orderBy: { criado_em: 'desc' },
      take: limit
    });
  }
}




