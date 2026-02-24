/**
 * Service para integração de apontamentos com estoque
 * Limite: <= 400 linhas conforme premissas
 * Funcionalidades: reservas, baixas, validações de estoque
 */

import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ValidacaoEstoqueService } from '../../orcamentos-v2/services/validacao-estoque.service';
import { TipoApontamento } from '../interfaces/workflow-pcp.interfaces';

export interface OperacaoEstoque {
  insumo_id: string;
  quantidade: number;
  unidade: string;
  tipo: 'RESERVA' | 'BAIXA' | 'LIBERACAO';
  motivo: string;
  referencia_id: string; // ID da OS ou apontamento
}

export interface ResultadoOperacaoEstoque {
  sucesso: boolean;
  operacoes_realizadas: OperacaoEstoque[];
  erros: string[];
  alertas: string[];
}

@Injectable()
export class EstoqueApontamentoService {
  private readonly logger = new Logger(EstoqueApontamentoService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly validacaoEstoqueService: ValidacaoEstoqueService,
  ) {}

  /**
   * Processa operações de estoque baseadas no tipo de apontamento
   */
  async processarOperacaoEstoque(
    osId: string,
    tipoApontamento: TipoApontamento,
    quantidadeProduzida?: number,
    quantidadeRefugo?: number,
    observacoes?: string,
  ): Promise<ResultadoOperacaoEstoque> {
    try {
      this.logger.log(
        `Processando operação de estoque para OS ${osId} - Tipo: ${tipoApontamento}`,
      );

      // 1. Buscar OS e insumos necessários
      const os = await this.prisma.ordemServico.findUnique({
        where: { id: osId },
        include: {
          itens: true,
        },
      });

      if (!os) {
        throw new BadRequestException(`OS ${osId} não encontrada`);
      }

      // 2. Extrair insumos dos itens da OS
      const insumosNecessarios = await this.extrairInsumosOS(os);

      if (insumosNecessarios.length === 0) {
        this.logger.warn(
          `OS ${osId} não possui insumos para processar estoque`,
        );
        return {
          sucesso: true,
          operacoes_realizadas: [],
          erros: [],
          alertas: ['OS não possui insumos para processar estoque'],
        };
      }

      // 3. Determinar operações baseadas no tipo de apontamento
      const operacoes = this.determinarOperacoesEstoque(
        tipoApontamento,
        insumosNecessarios,
        quantidadeProduzida,
        quantidadeRefugo,
      );

      // 4. Executar operações de estoque
      const resultado = await this.executarOperacoesEstoque(operacoes, osId);

      this.logger.log(`[OK] Operações de estoque processadas para OS ${osId}`);
      return resultado;
    } catch (error) {
      this.logger.error(
        `Erro ao processar operação de estoque: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Extrai insumos necessários dos itens da OS
   */
  private async extrairInsumosOS(os: any): Promise<
    Array<{
      insumo_id: string;
      quantidade: number;
      unidade: string;
      nome: string;
    }>
  > {
    const insumos: Array<{
      insumo_id: string;
      quantidade: number;
      unidade: string;
      nome: string;
    }> = [];

    for (const item of os.itens) {
      if (item.insumos_necessarios) {
        try {
          const insumosItem = JSON.parse(item.insumos_necessarios);
          for (const insumo of insumosItem) {
            // Buscar nome do insumo
            const insumoCompleto = await this.prisma.insumo.findUnique({
              where: { id: insumo.insumo_id },
              select: { nome: true },
            });

            insumos.push({
              insumo_id: insumo.insumo_id,
              quantidade: Number(insumo.quantidade),
              unidade: insumo.unidade || 'un',
              nome: insumoCompleto?.nome || 'Insumo não encontrado',
            });
          }
        } catch (error) {
          this.logger.warn(
            `Erro ao processar insumos do item ${item.id}: ${error.message}`,
          );
        }
      }
    }

    return insumos;
  }

  /**
   * Determina as operações de estoque baseadas no tipo de apontamento
   */
  private determinarOperacoesEstoque(
    tipoApontamento: TipoApontamento,
    insumosNecessarios: Array<{
      insumo_id: string;
      quantidade: number;
      unidade: string;
      nome: string;
    }>,
    quantidadeProduzida?: number,
    quantidadeRefugo?: number,
  ): OperacaoEstoque[] {
    const operacoes: OperacaoEstoque[] = [];

    switch (tipoApontamento) {
      case TipoApontamento.INICIO:
        // Reservar insumos quando inicia a produção
        for (const insumo of insumosNecessarios) {
          operacoes.push({
            insumo_id: insumo.insumo_id,
            quantidade: insumo.quantidade,
            unidade: insumo.unidade,
            tipo: 'RESERVA',
            motivo: 'Início de produção - reserva de insumos',
            referencia_id: '', // Será preenchido depois
          });
        }
        break;

      case TipoApontamento.CONCLUSAO:
        // Baixar insumos quando conclui a produção
        for (const insumo of insumosNecessarios) {
          operacoes.push({
            insumo_id: insumo.insumo_id,
            quantidade: insumo.quantidade,
            unidade: insumo.unidade,
            tipo: 'BAIXA',
            motivo: 'Conclusão de produção - baixa de insumos',
            referencia_id: '', // Será preenchido depois
          });
        }
        break;

      case TipoApontamento.REFUGO:
        // Baixar insumos adicionais para refugo
        if (quantidadeRefugo && quantidadeRefugo > 0) {
          for (const insumo of insumosNecessarios) {
            const quantidadeRefugoInsumo =
              (insumo.quantidade * quantidadeRefugo) / 100; // Percentual
            operacoes.push({
              insumo_id: insumo.insumo_id,
              quantidade: quantidadeRefugoInsumo,
              unidade: insumo.unidade,
              tipo: 'BAIXA',
              motivo: `Refugo de produção - ${quantidadeRefugo}%`,
              referencia_id: '', // Será preenchido depois
            });
          }
        }
        break;

      case TipoApontamento.PAUSA:
        // Não faz operações de estoque na pausa
        break;

      case TipoApontamento.RETOMADA:
        // Não faz operações de estoque na retomada
        break;

      default:
        this.logger.warn(
          `Tipo de apontamento não reconhecido: ${tipoApontamento}`,
        );
    }

    return operacoes;
  }

  /**
   * Executa as operações de estoque
   */
  private async executarOperacoesEstoque(
    operacoes: OperacaoEstoque[],
    osId: string,
  ): Promise<ResultadoOperacaoEstoque> {
    const operacoesRealizadas: OperacaoEstoque[] = [];
    const erros: string[] = [];
    const alertas: string[] = [];

    for (const operacao of operacoes) {
      try {
        // Preencher referência
        operacao.referencia_id = osId;

        // Validar disponibilidade antes de reservar
        if (operacao.tipo === 'RESERVA') {
          const validacao = await this.validarDisponibilidadeEstoque(
            operacao.insumo_id,
            operacao.quantidade,
            operacao.unidade,
          );

          if (!validacao.disponivel) {
            erros.push(
              `Insumo ${operacao.insumo_id} não disponível: ${validacao.motivo}`,
            );
            continue;
          }

          if (validacao.alerta) {
            alertas.push(validacao.alerta);
          }
        }

        // Executar operação
        await this.executarOperacaoIndividual(operacao);
        operacoesRealizadas.push(operacao);

        this.logger.log(
          `[OK] Operação de estoque executada: ${operacao.tipo} - ${operacao.quantidade} ${operacao.unidade} do insumo ${operacao.insumo_id}`,
        );
      } catch (error) {
        const erro = `Erro ao executar operação de estoque para insumo ${operacao.insumo_id}: ${error.message}`;
        erros.push(erro);
        this.logger.error(erro);
      }
    }

    return {
      sucesso: erros.length === 0,
      operacoes_realizadas: operacoesRealizadas,
      erros,
      alertas,
    };
  }

  /**
   * Valida disponibilidade de estoque
   */
  private async validarDisponibilidadeEstoque(
    insumoId: string,
    quantidade: number,
    unidade: string,
  ): Promise<{
    disponivel: boolean;
    motivo?: string;
    alerta?: string;
  }> {
    try {
      // Buscar estoque atual do insumo
      const estoque = await this.prisma.insumo.findUnique({
        where: { id: insumoId },
        select: {
          estoque_atual: true,
          estoque_minimo: true,
          unidade_compra: true,
          fator_conversao: true,
        },
      });

      if (!estoque) {
        return {
          disponivel: false,
          motivo: 'Insumo não encontrado',
        };
      }

      // Converter quantidade se necessário
      const quantidadeNecessaria = quantidade;
      if (unidade !== estoque.unidade_compra) {
        // TODO: Implementar conversão de unidades
        this.logger.warn(
          `Conversão de unidades não implementada: ${unidade} -> ${estoque.unidade_compra}`,
        );
      }

      const estoqueAtual = Number(estoque.estoque_atual || 0);
      const estoqueMinimo = Number(estoque.estoque_minimo || 0);

      if (estoqueAtual < quantidadeNecessaria) {
        return {
          disponivel: false,
          motivo: `Estoque insuficiente. Disponível: ${estoqueAtual}, Necessário: ${quantidadeNecessaria}`,
        };
      }

      // Verificar se ficará abaixo do estoque mínimo
      const estoqueRestante = estoqueAtual - quantidadeNecessaria;
      if (estoqueRestante < estoqueMinimo) {
        return {
          disponivel: true,
          alerta: `Atenção: estoque ficará abaixo do mínimo após esta operação (${estoqueRestante} < ${estoqueMinimo})`,
        };
      }

      return { disponivel: true };
    } catch (error) {
      this.logger.error(
        `Erro ao validar disponibilidade de estoque: ${error.message}`,
      );
      return {
        disponivel: false,
        motivo: `Erro na validação: ${error.message}`,
      };
    }
  }

  /**
   * Executa uma operação individual de estoque
   */
  private async executarOperacaoIndividual(
    operacao: OperacaoEstoque,
  ): Promise<void> {
    // TODO: Implementar operações reais de estoque
    // Por enquanto, apenas registra no log
    this.logger.log(
      `Executando operação de estoque: ${JSON.stringify(operacao)}`,
    );

    // Em uma implementação real, aqui seria:
    // 1. Atualizar estoque_atual do insumo
    // 2. Registrar movimentação de estoque
    // 3. Atualizar reservas se necessário
    // 4. Gerar alertas se estoque ficar baixo
  }

  /**
   * Libera reservas de estoque (usado quando OS é cancelada)
   */
  async liberarReservasEstoque(
    osId: string,
  ): Promise<ResultadoOperacaoEstoque> {
    try {
      this.logger.log(`Liberando reservas de estoque para OS ${osId}`);

      // Buscar reservas ativas da OS
      const reservas = await this.buscarReservasAtivas(osId);

      const operacoes: OperacaoEstoque[] = reservas.map((reserva) => ({
        insumo_id: reserva.insumo_id,
        quantidade: reserva.quantidade,
        unidade: reserva.unidade,
        tipo: 'LIBERACAO',
        motivo: 'Cancelamento de OS - liberação de reservas',
        referencia_id: osId,
      }));

      const resultado = await this.executarOperacoesEstoque(operacoes, osId);

      this.logger.log(`[OK] Reservas de estoque liberadas para OS ${osId}`);
      return resultado;
    } catch (error) {
      this.logger.error(
        `Erro ao liberar reservas de estoque: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Busca reservas ativas de uma OS
   */
  private async buscarReservasAtivas(osId: string): Promise<
    Array<{
      insumo_id: string;
      quantidade: number;
      unidade: string;
    }>
  > {
    // TODO: Implementar busca de reservas ativas
    // Por enquanto, retorna array vazio
    return [];
  }
}
