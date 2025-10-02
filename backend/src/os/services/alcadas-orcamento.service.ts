import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CentroCustoService } from './centro-custo.service';

export interface ConfiguracaoAlcada {
  funcao: string;
  limite_maximo: number;
  pode_aprovar_automaticamente: boolean;
}

export interface ValidacaoOrcamento {
  centro_custo: string;
  orcamento_disponivel: number;
  orcamento_reservado: number;
  orcamento_livre: number;
  pode_aprovar: boolean;
  motivo_rejeicao?: string;
}

export interface NotificacaoAprovacao {
  os_id: string;
  aprovador_id: string;
  valor_estimado: number;
  centro_custo: string;
  tipo_notificacao: 'APROVACAO_AUTOMATICA' | 'SOLICITACAO_APROVACAO' | 'ORCAMENTO_INSUFICIENTE';
  mensagem: string;
}

@Injectable()
export class AlcadasOrcamentoService {
  private readonly logger = new Logger(AlcadasOrcamentoService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly centroCustoService: CentroCustoService,
  ) {}

  // ===== CONFIGURAÇÃO DE ALÇADAS =====

  /**
   * Configurações padrão de alçadas por função
   */
  private getConfiguracoesAlcada(): ConfiguracaoAlcada[] {
    return [
      {
        funcao: 'SUPERVISOR',
        limite_maximo: 500,
        pode_aprovar_automaticamente: true
      },
      {
        funcao: 'GERENTE',
        limite_maximo: 2000,
        pode_aprovar_automaticamente: true
      },
      {
        funcao: 'DIRETOR',
        limite_maximo: 10000,
        pode_aprovar_automaticamente: true
      },
      {
        funcao: 'ADMIN',
        limite_maximo: 50000,
        pode_aprovar_automaticamente: true
      }
    ];
  }

  /**
   * Verifica se usuário pode aprovar valor automaticamente
   */
  async podeAprovarAutomaticamente(
    funcaoUsuario: string,
    valorEstimado: number
  ): Promise<{ pode: boolean; motivo?: string }> {
    try {
      const configuracoes = this.getConfiguracoesAlcada();
      const config = configuracoes.find(c => c.funcao === funcaoUsuario);

      if (!config) {
        return {
          pode: false,
          motivo: 'Função não encontrada nas configurações de alçada'
        };
      }

      if (valorEstimado <= config.limite_maximo && config.pode_aprovar_automaticamente) {
        return { pode: true };
      }

      return {
        pode: false,
        motivo: `Valor R$ ${valorEstimado} excede limite de R$ ${config.limite_maximo} para ${funcaoUsuario}`
      };
    } catch (error) {
      this.logger.error('Erro ao verificar aprovação automática:', error);
      return {
        pode: false,
        motivo: 'Erro interno na validação de alçada'
      };
    }
  }

  /**
   * Identifica o aprovador necessário baseado no valor
   */
  async identificarAprovadorNecessario(valorEstimado: number): Promise<string> {
    const configuracoes = this.getConfiguracoesAlcada()
      .filter(c => c.pode_aprovar_automaticamente)
      .sort((a, b) => a.limite_maximo - b.limite_maximo);

    for (const config of configuracoes) {
      if (valorEstimado <= config.limite_maximo) {
        return config.funcao;
      }
    }

    return 'DIRETORIA'; // Valor muito alto, precisa de diretoria
  }

  // ===== VALIDAÇÃO DE ORÇAMENTO =====

  /**
   * Valida orçamento disponível no centro de custo
   */
  async validarOrcamentoDisponivel(
    centroCusto: string,
    valorSolicitado: number,
    lojaId: string
  ): Promise<ValidacaoOrcamento> {
    try {
      const validacao = await this.centroCustoService.validarOrcamentoDisponivel(
        centroCusto,
        valorSolicitado,
        lojaId
      );

      return {
        centro_custo: validacao.centro_custo,
        orcamento_disponivel: validacao.orcamento_disponivel,
        orcamento_reservado: validacao.orcamento_reservado,
        orcamento_livre: validacao.orcamento_livre,
        pode_aprovar: validacao.pode_aprovar,
        motivo_rejeicao: validacao.motivo_rejeicao
      };
    } catch (error) {
      this.logger.error('Erro ao validar orçamento:', error);
      return {
        centro_custo: centroCusto,
        orcamento_disponivel: 0,
        orcamento_reservado: 0,
        orcamento_livre: 0,
        pode_aprovar: false,
        motivo_rejeicao: 'Erro interno na validação de orçamento'
      };
    }
  }

  /**
   * Reserva orçamento no centro de custo
   */
  async reservarOrcamento(
    centroCusto: string,
    valor: number,
    lojaId: string,
    osId: string
  ): Promise<{ sucesso: boolean; motivo?: string }> {
    try {
      const resultado = await this.centroCustoService.reservarOrcamento(
        centroCusto,
        valor,
        lojaId,
        osId,
        'sistema', // Usuário sistema para reservas automáticas
        'Reserva automática para aprovação de OS'
      );
      
      return { 
        sucesso: resultado.sucesso,
        motivo: resultado.motivo_rejeicao
      };
    } catch (error) {
      this.logger.error('Erro ao reservar orçamento:', error);
      return {
        sucesso: false,
        motivo: 'Erro interno na reserva de orçamento'
      };
    }
  }

  /**
   * Libera orçamento reservado
   */
  async liberarOrcamento(
    centroCusto: string,
    valor: number,
    lojaId: string,
    osId: string
  ): Promise<{ sucesso: boolean; motivo?: string }> {
    try {
      const resultado = await this.centroCustoService.liberarOrcamento(
        `reserva-${osId}`, // ID da reserva baseado na OS
        centroCusto,
        valor,
        lojaId,
        osId,
        'sistema', // Usuário sistema para liberações automáticas
        'Liberação automática de reserva de OS'
      );
      
      return { 
        sucesso: resultado.sucesso,
        motivo: resultado.motivo
      };
    } catch (error) {
      this.logger.error('Erro ao liberar orçamento:', error);
      return {
        sucesso: false,
        motivo: 'Erro interno na liberação de orçamento'
      };
    }
  }

  // ===== NOTIFICAÇÕES =====

  /**
   * Envia notificação para aprovador
   */
  async enviarNotificacaoAprovacao(notificacao: NotificacaoAprovacao): Promise<void> {
    try {
      this.logger.log(`Notificação enviada para ${notificacao.aprovador_id}: ${notificacao.mensagem}`);
      
      // TODO: Implementar sistema real de notificações (email, push, etc.)
      // Por enquanto, apenas log
    } catch (error) {
      this.logger.error('Erro ao enviar notificação:', error);
    }
  }

  /**
   * Processa aprovação automática se possível
   */
  async processarAprovacaoAutomatica(
    osId: string,
    valorEstimado: number,
    centroCusto: string,
    lojaId: string,
    usuarioId: string
  ): Promise<{ aprovada_automaticamente: boolean; motivo?: string }> {
    try {
      // 1. Verificar se pode aprovar automaticamente
      const usuario = await this.prisma.usuario.findUnique({
        where: { id: usuarioId }
      });

      if (!usuario) {
        return {
          aprovada_automaticamente: false,
          motivo: 'Usuário não encontrado'
        };
      }

      const podeAprovar = await this.podeAprovarAutomaticamente(usuario.funcao, valorEstimado);
      if (!podeAprovar.pode) {
        return {
          aprovada_automaticamente: false,
          motivo: podeAprovar.motivo
        };
      }

      // 2. Validar orçamento disponível
      const validacaoOrcamento = await this.validarOrcamentoDisponivel(centroCusto, valorEstimado, lojaId);
      if (!validacaoOrcamento.pode_aprovar) {
        return {
          aprovada_automaticamente: false,
          motivo: validacaoOrcamento.motivo_rejeicao
        };
      }

      // 3. Reservar orçamento
      const reserva = await this.reservarOrcamento(centroCusto, valorEstimado, lojaId, osId);
      if (!reserva.sucesso) {
        return {
          aprovada_automaticamente: false,
          motivo: reserva.motivo
        };
      }

      // 4. Enviar notificação de aprovação automática
      await this.enviarNotificacaoAprovacao({
        os_id: osId,
        aprovador_id: usuarioId,
        valor_estimado: valorEstimado,
        centro_custo: centroCusto,
        tipo_notificacao: 'APROVACAO_AUTOMATICA',
        mensagem: `OS ${osId} aprovada automaticamente por ${usuario.funcao} - Valor: R$ ${valorEstimado}`
      });

      this.logger.log(`OS ${osId} aprovada automaticamente por ${usuario.funcao}`);
      return { aprovada_automaticamente: true };
    } catch (error) {
      this.logger.error('Erro ao processar aprovação automática:', error);
      return {
        aprovada_automaticamente: false,
        motivo: 'Erro interno no processamento de aprovação automática'
      };
    }
  }

  // ===== RELATÓRIOS =====

  /**
   * Obtém relatório de consumo por departamento
   */
  async obterRelatorioConsumoDepartamento(
    lojaId: string,
    periodoInicio?: Date,
    periodoFim?: Date
  ): Promise<{
    departamentos: Array<{
      centro_custo: string;
      orcamento_total: number;
      orcamento_utilizado: number;
      orcamento_disponivel: number;
      percentual_utilizado: number;
    }>;
    total_geral: {
      orcamento_total: number;
      orcamento_utilizado: number;
      orcamento_disponivel: number;
    };
  }> {
    try {
      // TODO: Implementar relatório real
      // Por enquanto, retornar dados simulados
      return {
        departamentos: [
          {
            centro_custo: 'CC001',
            orcamento_total: 10000,
            orcamento_utilizado: 3000,
            orcamento_disponivel: 7000,
            percentual_utilizado: 30
          }
        ],
        total_geral: {
          orcamento_total: 10000,
          orcamento_utilizado: 3000,
          orcamento_disponivel: 7000
        }
      };
    } catch (error) {
      this.logger.error('Erro ao obter relatório de consumo:', error);
      throw error;
    }
  }
}
