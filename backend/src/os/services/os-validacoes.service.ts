/**
 * Serviço de integração entre OS e Validações Automáticas
 * Executa validações configuradas quando OS é criada/atualizada
 */

import { Injectable, Logger } from '@nestjs/common';
import { ValidacoesAutomaticasService } from '../../configuracoes/services/validacoes-automaticas.service';
import { PrismaService } from '../../prisma/prisma.service';

export interface ResultadoValidacaoOS {
  valida: boolean;
  pode_aprovar_automaticamente: boolean;
  correcoes_necessarias: string[];
  alertas: string[];
  acoes: any[];
  execucoes: Array<{
    regra_id: string;
    regra_nome: string;
    resultado: string;
    mensagem?: string;
    tempo_execucao: number;
  }>;
}

@Injectable()
export class OSValidacoesService {
  private readonly logger = new Logger(OSValidacoesService.name);

  constructor(
    private readonly validacoesService: ValidacoesAutomaticasService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Executa todas as validações automáticas para uma OS
   */
  async validarOS(osId: string, lojaId: string): Promise<ResultadoValidacaoOS> {
    this.logger.log(`Iniciando validações automáticas para OS ${osId}`);

    try {
      const resultado = await this.validacoesService.validarOS(osId, lojaId);

      this.logger.log(`Validações concluídas para OS ${osId}:`, {
        valida: resultado.valida,
        correcoes: resultado.correcoes_necessarias.length,
        alertas: resultado.alertas.length,
      });

      return resultado;
    } catch (error) {
      this.logger.error(`Erro ao validar OS ${osId}:`, error);
      throw error;
    }
  }

  /**
   * Executa validações específicas por categoria
   */
  async validarOSPorCategoria(
    osId: string,
    lojaId: string,
    categoria: string,
  ): Promise<ResultadoValidacaoOS> {
    this.logger.log(`Validando OS ${osId} para categoria ${categoria}`);

    // Buscar regras da categoria específica
    const regras = await this.prisma.regraValidacao.findMany({
      where: {
        ativo: true,
        categoria: categoria as any, // Cast para resolver problema de tipo
        OR: [{ loja_id: lojaId }, { loja_id: null }],
      },
      select: { id: true },
    });

    const regraIds = regras.map((r) => r.id);

    return await this.validacoesService.validarOS(osId, lojaId, regraIds);
  }

  /**
   * Aplica ações automáticas baseadas nas validações
   */
  async aplicarAcoesAutomaticas(
    osId: string,
    resultado: ResultadoValidacaoOS,
  ): Promise<void> {
    this.logger.log(`Aplicando ações automáticas para OS ${osId}`);

    for (const acao of resultado.acoes) {
      try {
        await this.executarAcao(osId, acao);
      } catch (error) {
        this.logger.error(`Erro ao executar ação para OS ${osId}:`, error);
      }
    }
  }

  /**
   * Executa uma ação específica
   */
  private async executarAcao(osId: string, acao: any): Promise<void> {
    switch (acao.tipo) {
      case 'bloquear':
        await this.bloquearOS(osId, acao);
        break;
      case 'aprovar':
        await this.aprovarOS(osId, acao);
        break;
      case 'notificar':
        await this.notificarUsuarios(osId, acao);
        break;
      case 'corrigir':
        await this.corrigirOS(osId, acao);
        break;
      case 'alertar':
        await this.alertarOS(osId, acao);
        break;
      default:
        this.logger.warn(`Tipo de ação não reconhecido: ${acao.tipo}`);
    }
  }

  /**
   * Bloqueia a OS
   */
  private async bloquearOS(osId: string, acao: any): Promise<void> {
    await this.prisma.ordemServico.update({
      where: { id: osId },
      data: {
        status: acao.status_os || 'BLOQUEADA',
        observacoes: `OS bloqueada por validação automática: ${acao.mensagem || 'Regra de validação não atendida'}`,
      },
    });

    this.logger.log(`OS ${osId} bloqueada por validação automática`);
  }

  /**
   * Aprova a OS automaticamente
   */
  private async aprovarOS(osId: string, acao: any): Promise<void> {
    await this.prisma.ordemServico.update({
      where: { id: osId },
      data: {
        status: acao.status_os || 'APROVADA',
        observacoes: `OS aprovada automaticamente: ${acao.mensagem || 'Todas as validações atendidas'}`,
      },
    });

    this.logger.log(`OS ${osId} aprovada automaticamente`);
  }

  /**
   * Notifica usuários específicos
   */
  private async notificarUsuarios(osId: string, acao: any): Promise<void> {
    // TODO: Implementar sistema de notificações
    this.logger.log(`Notificando usuários para OS ${osId}:`, acao.notificar);
  }

  /**
   * Aplica correções automáticas
   */
  private async corrigirOS(osId: string, acao: any): Promise<void> {
    // TODO: Implementar correções automáticas baseadas nos parâmetros
    this.logger.log(`Aplicando correções para OS ${osId}:`, acao.parametros);
  }

  /**
   * Registra alerta na OS
   */
  private async alertarOS(osId: string, acao: any): Promise<void> {
    await this.prisma.ordemServico.update({
      where: { id: osId },
      data: {
        observacoes: `ALERTA: ${acao.mensagem || 'Validação gerou alerta'}`,
      },
    });

    this.logger.log(`Alerta registrado para OS ${osId}`);
  }

  /**
   * Obtém histórico de validações de uma OS
   */
  async obterHistoricoValidacoes(osId: string): Promise<any[]> {
    return await this.prisma.execucaoRegra.findMany({
      where: { os_id: osId },
      include: {
        regra: {
          select: {
            id: true,
            nome: true,
            categoria: true,
            tipo: true,
          },
        },
      },
      orderBy: { criado_em: 'desc' },
      take: 50,
    });
  }

  /**
   * Valida se uma OS pode ser aprovada
   */
  async podeAprovarOS(osId: string, lojaId: string): Promise<boolean> {
    const resultado = await this.validarOS(osId, lojaId);
    return resultado.pode_aprovar_automaticamente;
  }
}
