import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CentroCustoInfo {
  id: string;
  codigo: string;
  nome: string;
  departamento: string;
  loja_id: string;
  orcamento_total: number;
  orcamento_utilizado: number;
  orcamento_reservado: number;
  orcamento_livre: number;
  percentual_utilizado: number;
  status: 'ATIVO' | 'INATIVO' | 'BLOQUEADO';
}

export interface ValidacaoOrcamentoResult {
  centro_custo: string;
  orcamento_disponivel: number;
  orcamento_reservado: number;
  orcamento_livre: number;
  pode_aprovar: boolean;
  motivo_rejeicao?: string;
  alertas: Array<{
    tipo: 'LIMITE_PROXIMO' | 'LIMITE_ATINGIDO' | 'ORCAMENTO_INSUFICIENTE';
    mensagem: string;
    percentual?: number;
  }>;
}

export interface ReservaOrcamentoResult {
  sucesso: boolean;
  reserva_id?: string;
  valor_reservado: number;
  data_reserva: Date;
  motivo_rejeicao?: string;
}

export interface RelatorioConsumoDepartamento {
  departamento: string;
  centros_custo: Array<{
    codigo: string;
    nome: string;
    orcamento_total: number;
    orcamento_utilizado: number;
    orcamento_reservado: number;
    orcamento_livre: number;
    percentual_utilizado: number;
    status: string;
  }>;
  total_departamento: {
    orcamento_total: number;
    orcamento_utilizado: number;
    orcamento_reservado: number;
    orcamento_livre: number;
    percentual_utilizado: number;
  };
}

export interface AlertaLimiteGastos {
  centro_custo: string;
  tipo_alerta: 'LIMITE_PROXIMO' | 'LIMITE_ATINGIDO' | 'ORCAMENTO_ESGOTADO';
  percentual_utilizado: number;
  valor_restante: number;
  mensagem: string;
  prioridade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  data_alerta: Date;
}

@Injectable()
export class CentroCustoService {
  private readonly logger = new Logger(CentroCustoService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ===== VALIDAÇÃO DE ORÇAMENTO =====

  /**
   * Valida orçamento disponível no centro de custo
   */
  async validarOrcamentoDisponivel(
    centroCusto: string,
    valorSolicitado: number,
    lojaId: string,
    excluirReservas?: string[]
  ): Promise<ValidacaoOrcamentoResult> {
    try {
      // TODO: Implementar validação real com banco de dados
      // Por enquanto, simular dados para desenvolvimento
      const centroCustoInfo = await this.obterInfoCentroCusto(centroCusto, lojaId);
      
      if (!centroCustoInfo) {
        return {
          centro_custo: centroCusto,
          orcamento_disponivel: 0,
          orcamento_reservado: 0,
          orcamento_livre: 0,
          pode_aprovar: false,
          motivo_rejeicao: 'Centro de custo não encontrado',
          alertas: []
        };
      }

      const orcamentoLivre = centroCustoInfo.orcamento_livre;
      const podeAprovar = valorSolicitado <= orcamentoLivre;
      
      const alertas = this.gerarAlertasOrcamento(centroCustoInfo, valorSolicitado);

      return {
        centro_custo: centroCusto,
        orcamento_disponivel: centroCustoInfo.orcamento_total,
        orcamento_reservado: centroCustoInfo.orcamento_reservado,
        orcamento_livre: orcamentoLivre,
        pode_aprovar: podeAprovar,
        motivo_rejeicao: podeAprovar ? undefined : 'Orçamento insuficiente no centro de custo',
        alertas
      };
    } catch (error) {
      this.logger.error('Erro ao validar orçamento:', error);
      return {
        centro_custo: centroCusto,
        orcamento_disponivel: 0,
        orcamento_reservado: 0,
        orcamento_livre: 0,
        pode_aprovar: false,
        motivo_rejeicao: 'Erro interno na validação de orçamento',
        alertas: []
      };
    }
  }

  /**
   * Obtém informações do centro de custo
   */
  private async obterInfoCentroCusto(centroCusto: string, lojaId: string): Promise<CentroCustoInfo | null> {
    try {
      // TODO: Implementar consulta real ao banco de dados
      // Por enquanto, retornar dados simulados
      return {
        id: `cc-${centroCusto}`,
        codigo: centroCusto,
        nome: `Centro de Custo ${centroCusto}`,
        departamento: 'TI',
        loja_id: lojaId,
        orcamento_total: 10000,
        orcamento_utilizado: 3000,
        orcamento_reservado: 2000,
        orcamento_livre: 5000,
        percentual_utilizado: 30,
        status: 'ATIVO'
      };
    } catch (error) {
      this.logger.error('Erro ao obter info do centro de custo:', error);
      return null;
    }
  }

  /**
   * Gera alertas baseados no uso do orçamento
   */
  private gerarAlertasOrcamento(centroCusto: CentroCustoInfo, valorSolicitado: number): Array<{
    tipo: 'LIMITE_PROXIMO' | 'LIMITE_ATINGIDO' | 'ORCAMENTO_INSUFICIENTE';
    mensagem: string;
    percentual?: number;
  }> {
    const alertas = [];
    const percentualAtual = centroCusto.percentual_utilizado;
    const percentualAposSolicitacao = ((centroCusto.orcamento_utilizado + valorSolicitado) / centroCusto.orcamento_total) * 100;

    // Alerta de limite próximo (80%)
    if (percentualAposSolicitacao >= 80 && percentualAposSolicitacao < 95) {
      alertas.push({
        tipo: 'LIMITE_PROXIMO',
        mensagem: `Centro de custo ${centroCusto.codigo} próximo do limite (${percentualAposSolicitacao.toFixed(1)}% utilizado)`,
        percentual: percentualAposSolicitacao
      });
    }

    // Alerta de limite atingido (95%)
    if (percentualAposSolicitacao >= 95 && percentualAposSolicitacao < 100) {
      alertas.push({
        tipo: 'LIMITE_ATINGIDO',
        mensagem: `Centro de custo ${centroCusto.codigo} próximo do esgotamento (${percentualAposSolicitacao.toFixed(1)}% utilizado)`,
        percentual: percentualAposSolicitacao
      });
    }

    // Alerta de orçamento insuficiente
    if (valorSolicitado > centroCusto.orcamento_livre) {
      alertas.push({
        tipo: 'ORCAMENTO_INSUFICIENTE',
        mensagem: `Valor solicitado (R$ ${valorSolicitado}) excede orçamento livre (R$ ${centroCusto.orcamento_livre})`
      });
    }

    return alertas;
  }

  // ===== RESERVA AUTOMÁTICA DE VALORES =====

  /**
   * Reserva orçamento no centro de custo
   */
  async reservarOrcamento(
    centroCusto: string,
    valor: number,
    lojaId: string,
    osId: string,
    usuarioId: string,
    observacoes?: string
  ): Promise<ReservaOrcamentoResult> {
    try {
      // Validar se orçamento está disponível
      const validacao = await this.validarOrcamentoDisponivel(centroCusto, valor, lojaId);
      
      if (!validacao.pode_aprovar) {
        return {
          sucesso: false,
          valor_reservado: 0,
          data_reserva: new Date(),
          motivo_rejeicao: validacao.motivo_rejeicao
        };
      }

      // TODO: Implementar reserva real no banco de dados
      const reservaId = `reserva-${Date.now()}`;
      
      this.logger.log(`Reservando R$ ${valor} no centro de custo ${centroCusto} para OS ${osId}`);
      
      // Simular reserva bem-sucedida
      return {
        sucesso: true,
        reserva_id: reservaId,
        valor_reservado: valor,
        data_reserva: new Date()
      };
    } catch (error) {
      this.logger.error('Erro ao reservar orçamento:', error);
      return {
        sucesso: false,
        valor_reservado: 0,
        data_reserva: new Date(),
        motivo_rejeicao: 'Erro interno na reserva de orçamento'
      };
    }
  }

  /**
   * Libera orçamento reservado
   */
  async liberarOrcamento(
    reservaId: string,
    centroCusto: string,
    valor: number,
    lojaId: string,
    osId: string,
    usuarioId: string,
    motivo?: string
  ): Promise<{ sucesso: boolean; motivo?: string }> {
    try {
      // TODO: Implementar liberação real no banco de dados
      this.logger.log(`Liberando R$ ${valor} do centro de custo ${centroCusto} para OS ${osId} - Motivo: ${motivo || 'Liberação automática'}`);
      
      return { sucesso: true };
    } catch (error) {
      this.logger.error('Erro ao liberar orçamento:', error);
      return {
        sucesso: false,
        motivo: 'Erro interno na liberação de orçamento'
      };
    }
  }

  // ===== RELATÓRIOS DE CONSUMO =====

  /**
   * Obtém relatório de consumo por departamento
   */
  async obterRelatorioConsumoDepartamento(
    lojaId: string,
    departamento?: string,
    periodoInicio?: Date,
    periodoFim?: Date
  ): Promise<RelatorioConsumoDepartamento[]> {
    try {
      // TODO: Implementar relatório real com banco de dados
      // Por enquanto, retornar dados simulados
      const relatorios: RelatorioConsumoDepartamento[] = [
        {
          departamento: 'TI',
          centros_custo: [
            {
              codigo: 'CC001',
              nome: 'Centro de Custo TI',
              orcamento_total: 10000,
              orcamento_utilizado: 3000,
              orcamento_reservado: 2000,
              orcamento_livre: 5000,
              percentual_utilizado: 30,
              status: 'ATIVO'
            }
          ],
          total_departamento: {
            orcamento_total: 10000,
            orcamento_utilizado: 3000,
            orcamento_reservado: 2000,
            orcamento_livre: 5000,
            percentual_utilizado: 30
          }
        }
      ];

      return relatorios;
    } catch (error) {
      this.logger.error('Erro ao obter relatório de consumo:', error);
      throw error;
    }
  }

  /**
   * Obtém relatório consolidado de todos os departamentos
   */
  async obterRelatorioConsolidado(
    lojaId: string,
    periodoInicio?: Date,
    periodoFim?: Date
  ): Promise<{
    departamentos: RelatorioConsumoDepartamento[];
    total_geral: {
      orcamento_total: number;
      orcamento_utilizado: number;
      orcamento_reservado: number;
      orcamento_livre: number;
      percentual_utilizado: number;
    };
  }> {
    try {
      const relatorios = await this.obterRelatorioConsumoDepartamento(lojaId, undefined, periodoInicio, periodoFim);
      
      const totalGeral = relatorios.reduce((acc, dept) => ({
        orcamento_total: acc.orcamento_total + dept.total_departamento.orcamento_total,
        orcamento_utilizado: acc.orcamento_utilizado + dept.total_departamento.orcamento_utilizado,
        orcamento_reservado: acc.orcamento_reservado + dept.total_departamento.orcamento_reservado,
        orcamento_livre: acc.orcamento_livre + dept.total_departamento.orcamento_livre,
        percentual_utilizado: 0 // Será calculado abaixo
      }), {
        orcamento_total: 0,
        orcamento_utilizado: 0,
        orcamento_reservado: 0,
        orcamento_livre: 0,
        percentual_utilizado: 0
      });

      totalGeral.percentual_utilizado = totalGeral.orcamento_total > 0 
        ? (totalGeral.orcamento_utilizado / totalGeral.orcamento_total) * 100 
        : 0;

      return {
        departamentos: relatorios,
        total_geral: totalGeral
      };
    } catch (error) {
      this.logger.error('Erro ao obter relatório consolidado:', error);
      throw error;
    }
  }

  // ===== ALERTAS DE LIMITE DE GASTOS =====

  /**
   * Obtém alertas de limite de gastos
   */
  async obterAlertasLimiteGastos(
    lojaId: string,
    departamento?: string,
    apenasCriticos?: boolean
  ): Promise<AlertaLimiteGastos[]> {
    try {
      // TODO: Implementar alertas reais com banco de dados
      // Por enquanto, retornar alertas simulados
      const alertas: AlertaLimiteGastos[] = [
        {
          centro_custo: 'CC001',
          tipo_alerta: 'LIMITE_PROXIMO',
          percentual_utilizado: 85,
          valor_restante: 1500,
          mensagem: 'Centro de custo CC001 próximo do limite (85% utilizado)',
          prioridade: 'MEDIA',
          data_alerta: new Date()
        }
      ];

      // Filtrar apenas críticos se solicitado
      if (apenasCriticos) {
        return alertas.filter(alerta => 
          alerta.tipo_alerta === 'LIMITE_ATINGIDO' || 
          alerta.tipo_alerta === 'ORCAMENTO_ESGOTADO'
        );
      }

      return alertas;
    } catch (error) {
      this.logger.error('Erro ao obter alertas de limite:', error);
      throw error;
    }
  }

  /**
   * Envia alertas de limite de gastos
   */
  async enviarAlertasLimiteGastos(
    lojaId: string,
    alertas: AlertaLimiteGastos[]
  ): Promise<void> {
    try {
      for (const alerta of alertas) {
        this.logger.warn(`ALERTA ${alerta.prioridade}: ${alerta.mensagem}`);
        
        // TODO: Implementar envio real de notificações (email, push, etc.)
        // Por enquanto, apenas log
      }
    } catch (error) {
      this.logger.error('Erro ao enviar alertas:', error);
    }
  }

  // ===== MÉTODOS AUXILIARES =====

  /**
   * Lista todos os centros de custo de uma loja
   */
  async listarCentrosCusto(lojaId: string): Promise<CentroCustoInfo[]> {
    try {
      // TODO: Implementar listagem real com banco de dados
      // Por enquanto, retornar dados simulados
      return [
        {
          id: 'cc-001',
          codigo: 'CC001',
          nome: 'Centro de Custo TI',
          departamento: 'TI',
          loja_id: lojaId,
          orcamento_total: 10000,
          orcamento_utilizado: 3000,
          orcamento_reservado: 2000,
          orcamento_livre: 5000,
          percentual_utilizado: 30,
          status: 'ATIVO'
        }
      ];
    } catch (error) {
      this.logger.error('Erro ao listar centros de custo:', error);
      throw error;
    }
  }

  /**
   * Obtém histórico de movimentações do centro de custo
   */
  async obterHistoricoMovimentacoes(
    centroCusto: string,
    lojaId: string,
    periodoInicio?: Date,
    periodoFim?: Date
  ): Promise<Array<{
    data: Date;
    tipo: 'RESERVA' | 'LIBERACAO' | 'APROVACAO' | 'REJEICAO';
    valor: number;
    os_id?: string;
    usuario_id: string;
    observacoes?: string;
  }>> {
    try {
      // TODO: Implementar histórico real com banco de dados
      // Por enquanto, retornar dados simulados
      return [
        {
          data: new Date(),
          tipo: 'RESERVA',
          valor: 1000,
          os_id: 'os-001',
          usuario_id: 'user-001',
          observacoes: 'Reserva para OS de teste'
        }
      ];
    } catch (error) {
      this.logger.error('Erro ao obter histórico:', error);
      throw error;
    }
  }
}












