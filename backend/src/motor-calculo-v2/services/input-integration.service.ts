import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ContextoCalculo,
  ValidationResult,
  EventoCalculo,
} from '../interfaces/calculo.interface';

@Injectable()
export class InputIntegrationService {
  private readonly logger = new Logger(InputIntegrationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Integra inputs existentes com o contexto de cálculo
   * Enriquece dados com informações do banco
   */
  async integrarInputs(contexto: ContextoCalculo): Promise<ContextoCalculo> {
    const startTime = Date.now();
    this.logger.log(`🔗 Integrando inputs para loja ${contexto.lojaId}`);

    try {
      // 1. Enriquecer dados de insumos
      const contextoComInsumos = await this.integrarInsumos(contexto);

      // 2. Enriquecer dados de máquinas
      const contextoComMaquinas = await this.integrarMaquinas(contextoComInsumos);

      // 3. Enriquecer dados de funções
      const contextoComFuncoes = await this.integrarFuncoes(contextoComMaquinas);

      // 4. Atualizar metadata
      contextoComFuncoes.metadata.inputs_integrados = true;
      contextoComFuncoes.metadata.timestamp_integracao = new Date();

      const tempoExecucao = Date.now() - startTime;
      this.logger.log(`✅ Inputs integrados em ${tempoExecucao}ms`);

      return contextoComFuncoes;

    } catch (error) {
      this.logger.error(`❌ Erro na integração de inputs: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Valida inputs integrados
   */
  async validarInputs(contexto: ContextoCalculo): Promise<ValidationResult> {
    const erros: string[] = [];
    const avisos: string[] = [];

    try {
      // Validar se há produtos
      if (!contexto.produtos || contexto.produtos.length === 0) {
        erros.push('Nenhum produto informado');
      }

      // Validar cada produto
      for (const produto of contexto.produtos) {
        // Validar insumos
        if (!produto.insumos || produto.insumos.length === 0) {
          erros.push(`Produto ${produto.nome}: nenhum insumo informado`);
        } else {
          for (const insumo of produto.insumos) {
            if (!insumo.id || !insumo.preco_unitario || insumo.quantidade <= 0) {
              erros.push(`Produto ${produto.nome}: insumo inválido (${insumo.nome || 'sem nome'})`);
            }
          }
        }

        // Validar quantidade do produto
        if (produto.quantidade <= 0) {
          erros.push(`Produto ${produto.nome}: quantidade inválida (${produto.quantidade})`);
        }
      }

      // Validar configurações
      if (!contexto.configuracoes) {
        erros.push('Configurações não informadas');
      } else {
        if (!contexto.configuracoes.margem_lucro_padrao || contexto.configuracoes.margem_lucro_padrao <= 0) {
          avisos.push('Margem de lucro não configurada - usando padrão (30%)');
        }
        if (!contexto.configuracoes.impostos_padrao || contexto.configuracoes.impostos_padrao <= 0) {
          avisos.push('Impostos não configurados - usando padrão (18%)');
        }
      }

      return {
        valido: erros.length === 0,
        erros,
        avisos,
      };

    } catch (error) {
      this.logger.error(`❌ Erro na validação de inputs: ${error.message}`);
      return {
        valido: false,
        erros: [`Erro na validação: ${error.message}`],
        avisos: [],
      };
    }
  }

  /**
   * Obtém estatísticas de integração
   */
  async obterEstatisticasInputs(lojaId: string): Promise<{
    total_insumos: number;
    total_maquinas: number;
    total_funcoes: number;
    ultima_integracao: Date | null;
  }> {
    try {
      // Buscar estatísticas do banco
      const [insumos, maquinas, funcoes] = await Promise.all([
        this.prisma.insumo.count({ where: { loja_id: lojaId, ativo: true } }),
        this.prisma.maquina.count({ where: { loja_id: lojaId } }),
        this.prisma.funcao.count({ where: { loja_id: lojaId } }),
      ]);

      return {
        total_insumos: insumos,
        total_maquinas: maquinas,
        total_funcoes: funcoes,
        ultima_integracao: new Date(),
      };

    } catch (error) {
      this.logger.error(`❌ Erro ao obter estatísticas de inputs: ${error.message}`);
      return {
        total_insumos: 0,
        total_maquinas: 0,
        total_funcoes: 0,
        ultima_integracao: null,
      };
    }
  }

  // Métodos privados de integração

  /**
   * Integra dados de insumos do banco
   */
  private async integrarInsumos(contexto: ContextoCalculo): Promise<ContextoCalculo> {
    for (const produto of contexto.produtos) {
      for (const insumo of produto.insumos) {
        try {
          // Buscar dados completos do insumo
          const insumoBanco = await this.prisma.insumo.findFirst({
            where: {
              id: insumo.id,
              loja_id: contexto.lojaId,
              ativo: true,
            },
            include: {
              categoria: true,
              fornecedor: true,
            },
          });

          if (insumoBanco) {
            // Enriquecer dados do insumo
            insumo.nome = insumoBanco.nome;
            insumo.unidade = insumoBanco.unidade_uso;
            insumo.preco_unitario = Number(insumoBanco.custo_unitario);
            insumo.categoria = insumoBanco.categoria?.nome || 'Sem categoria';
            insumo.fornecedor = insumoBanco.fornecedor?.nome || 'Sem fornecedor';
            insumo.estoque_disponivel = 0; // TODO: Integrar com estoque
          } else {
            this.logger.warn(`⚠️ Insumo não encontrado: ${insumo.id}`);
          }

        } catch (error) {
          this.logger.error(`❌ Erro ao integrar insumo ${insumo.id}: ${error.message}`);
        }
      }
    }

    return contexto;
  }

  /**
   * Integra dados de máquinas do banco
   */
  private async integrarMaquinas(contexto: ContextoCalculo): Promise<ContextoCalculo> {
    for (const produto of contexto.produtos) {
      for (const maquina of produto.maquinas) {
        try {
          // Buscar dados completos da máquina
          const maquinaBanco = await this.prisma.maquina.findFirst({
            where: {
              id: maquina.id,
              loja_id: contexto.lojaId,
            },
          });

          if (maquinaBanco) {
            // Enriquecer dados da máquina
            maquina.nome = maquinaBanco.nome;
            maquina.tipo = maquinaBanco.tipo;
            maquina.custo_hora = Number(maquinaBanco.custo_hora);
            maquina.tempo_setup = 0; // TODO: Implementar setup
            maquina.eficiencia = 100; // TODO: Implementar eficiência
            maquina.disponivel = maquinaBanco.status === 'ATIVA';
          } else {
            this.logger.warn(`⚠️ Máquina não encontrada: ${maquina.id}`);
          }

        } catch (error) {
          this.logger.error(`❌ Erro ao integrar máquina ${maquina.id}: ${error.message}`);
        }
      }
    }

    return contexto;
  }

  /**
   * Integra dados de funções do banco
   */
  private async integrarFuncoes(contexto: ContextoCalculo): Promise<ContextoCalculo> {
    for (const produto of contexto.produtos) {
      for (const funcao of produto.funcoes) {
        try {
          // Buscar dados completos da função
          const funcaoBanco = await this.prisma.funcao.findFirst({
            where: {
              id: funcao.id,
              loja_id: contexto.lojaId,
            },
            include: {
              maquina: true,
            },
          });

          if (funcaoBanco) {
            // Enriquecer dados da função
            funcao.nome = funcaoBanco.nome;
            funcao.categoria = 'Operacional'; // TODO: Implementar categorias
            funcao.custo_hora = Number(funcaoBanco.custo_hora);
            funcao.tempo_estimado = 1; // TODO: Implementar tempo estimado
            funcao.nivel_experiencia = 'Intermediário'; // TODO: Implementar níveis
            funcao.disponivel = true;
          } else {
            this.logger.warn(`⚠️ Função não encontrada: ${funcao.id}`);
          }

        } catch (error) {
          this.logger.error(`❌ Erro ao integrar função ${funcao.id}: ${error.message}`);
        }
      }
    }

    return contexto;
  }

  /**
   * Gera ID único para evento
   */
  private gerarIdEvento(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Publica evento no sistema
   * Por enquanto apenas log, futuramente WebSocket/Redis
   */
  private async publicarEvento(evento: EventoCalculo): Promise<void> {
    try {
      // Log estruturado
      this.logger.log(`📡 [EVENT] ${evento.tipo} | Contexto: ${evento.contexto.id} | Loja: ${evento.contexto.lojaId}`);

      // TODO: Implementar publicação real
      // await this.websocketGateway.emitirEvento(evento);
      // await this.redisPublisher.publish('motor_eventos', evento);

    } catch (error) {
      this.logger.error(`❌ Erro ao publicar evento: ${error.message}`);
      // Não propagar erro para não quebrar o cálculo
    }
  }
}
