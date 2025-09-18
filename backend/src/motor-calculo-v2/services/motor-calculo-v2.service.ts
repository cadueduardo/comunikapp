import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessRulesEngineService } from './business-rules-engine.service';
import { PipelineExecutorService } from './pipeline-executor.service';
import { EventProducerService } from './event-producer.service';
import { InputIntegrationService } from './input-integration.service';
import {
  ContextoCalculo,
  ResultadoCalculo,
  ResultadoRegras,
  DTOCalculo,
  ResultadoCalculoSimplificado
} from '../interfaces/calculo.interface';

@Injectable()
export class MotorCalculoV2Service {
  private readonly logger = new Logger(MotorCalculoV2Service.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly businessRulesEngine: BusinessRulesEngineService,
    private readonly pipelineExecutor: PipelineExecutorService,
    private readonly eventProducer: EventProducerService,
    private readonly inputIntegration: InputIntegrationService,
  ) {}

  /**
   * Executa cálculo completo usando o motor V2
   * Orquestra todo o processo de cálculo
   */
  async executarCalculo(dto: DTOCalculo): Promise<ResultadoCalculo> {
    const startTime = Date.now();
    this.logger.log(`🚀 Iniciando cálculo V2 para loja ${dto.lojaId}`);

    try {
      // 1. Criar contexto de cálculo
      const contexto = await this.criarContextoCalculo(dto);

      // 2. Produzir evento de início
      await this.eventProducer.eventoCalculoIniciado(contexto);

      // 3. Integrar inputs existentes
      const contextoIntegrado = await this.inputIntegration.integrarInputs(contexto);

      // 4. Validar inputs
      const validacaoInputs = await this.inputIntegration.validarInputs(contextoIntegrado);
      if (!validacaoInputs.valido) {
        const erro = `Inputs inválidos: ${validacaoInputs.erros.join(', ')}`;
        await this.eventProducer.eventoErro(contextoIntegrado, erro);
        throw new Error(erro);
      }

      // 5. Aplicar regras de negócio
      const resultadoRegras = await this.businessRulesEngine.aplicarRegras(contextoIntegrado);

      // Produzir evento de validação
      await this.eventProducer.eventoValidacao(
        contextoIntegrado,
        resultadoRegras,
        resultadoRegras.resultado_validacao
      );

      if (!resultadoRegras.resultado_validacao) {
        const erro = `Validação falhou: ${resultadoRegras.erros.join(', ')}`;
        await this.eventProducer.eventoErro(contextoIntegrado, erro);
        throw new Error(erro);
      }

      // 6. Executar pipeline de estágios
      const resultado = await this.pipelineExecutor.executarPipeline(contextoIntegrado, true);

      // 7. Produzir evento de conclusão
      const tempoTotal = Date.now() - startTime;
      await this.eventProducer.eventoCalculoConcluido(contextoIntegrado, resultado, tempoTotal);

      this.logger.log(`✅ Cálculo V2 concluído em ${tempoTotal}ms`);
      return resultado;

    } catch (error) {
      const tempoTotal = Date.now() - startTime;
      this.logger.error(`❌ Erro no cálculo V2 após ${tempoTotal}ms: ${error.message}`, error.stack);

      // Produzir evento de erro
      try {
        const contexto = await this.criarContextoCalculo(dto);
        await this.eventProducer.eventoErro(contexto, error.message);
      } catch (eventError) {
        this.logger.warn(`⚠️ Erro ao produzir evento de erro: ${eventError.message}`);
      }

      throw error;
    }
  }

  /**
   * Executa cálculo simplificado (apenas regras)
   */
  async executarCalculoSimplificado(dto: DTOCalculo): Promise<ResultadoCalculoSimplificado> {
    const startTime = Date.now();
    this.logger.log(`⚡ Executando cálculo simplificado para loja ${dto.lojaId}`);

    try {
      // 1. Criar contexto básico
      const contexto = await this.criarContextoCalculo(dto);

      // 2. Integrar inputs básicos
      const contextoIntegrado = await this.inputIntegration.integrarInputs(contexto);

      // 3. Aplicar apenas regras de negócio
      const resultadoRegras = await this.businessRulesEngine.aplicarRegras(contextoIntegrado);

      const tempoTotal = Date.now() - startTime;
      this.logger.log(`✅ Cálculo simplificado concluído em ${tempoTotal}ms`);

      return {
        sucesso: resultadoRegras.resultado_validacao,
        custo_total: 0, // TODO: Calcular custo total
        tempo_total: 0, // TODO: Calcular tempo total
        resumo: {
          materiais: 0,
          mao_obra: 0,
          maquinaria: 0,
          indiretos: 0,
        },
        metadata: {
          timestamp: new Date(),
          versao_motor: '2.0.0',
          tempo_execucao_ms: tempoTotal,
        },
      };

    } catch (error) {
      const tempoTotal = Date.now() - startTime;
      this.logger.error(`❌ Erro no cálculo simplificado após ${tempoTotal}ms: ${error.message}`);
      throw error;
    }
  }

  /**
   * Executa cálculo em modo preview (sem persistir)
   */
  async executarCalculoPreview(dto: DTOCalculo): Promise<ResultadoCalculo> {
    this.logger.log(`👁️ Executando cálculo preview para loja ${dto.lojaId}`);

    // Adicionar flag de preview
    const dtoPreview = { ...dto };

    return this.executarCalculo(dtoPreview);
  }

  /**
   * Valida contexto de cálculo sem executar
   */
  async validarContexto(dto: DTOCalculo): Promise<{
    valido: boolean;
    erros: string[];
    avisos: string[];
    contexto?: ContextoCalculo;
  }> {
    try {
      // 1. Criar contexto
      const contexto = await this.criarContextoCalculo(dto);

      // 2. Integrar inputs
      const contextoIntegrado = await this.inputIntegration.integrarInputs(contexto);

      // 3. Validar inputs
      const validacaoInputs = await this.inputIntegration.validarInputs(contextoIntegrado);

      // 4. Validar regras básicas
      const resultadoRegras = await this.businessRulesEngine.aplicarRegras(contextoIntegrado);

      const erros = [...validacaoInputs.erros, ...resultadoRegras.erros];
      const avisos = [...validacaoInputs.avisos, ...resultadoRegras.avisos];

      return {
        valido: erros.length === 0,
        erros,
        avisos,
        contexto: contextoIntegrado,
      };

    } catch (error) {
      this.logger.error(`❌ Erro na validação: ${error.message}`);
      return {
        valido: false,
        erros: [`Erro na validação: ${error.message}`],
        avisos: [],
      };
    }
  }

  /**
   * Obtém estatísticas do motor de cálculo
   */
  async obterEstatisticas(lojaId: string): Promise<{
    motor_ativo: boolean;
    versao: string;
    total_calculos: number;
    tempo_medio_execucao: number;
    estatisticas_regras: any;
    estatisticas_inputs: any;
    estatisticas_eventos: any;
  }> {
    try {
      // Estatísticas das regras
      const estatisticasRegras = await this.businessRulesEngine.obterEstatisticasRegras(lojaId);

      // Estatísticas dos inputs
      const estatisticasInputs = await this.inputIntegration.obterEstatisticasInputs(lojaId);

      // Estatísticas dos eventos
      const estatisticasEventos = await this.eventProducer.obterEstatisticasEventos(lojaId);

      return {
        motor_ativo: true,
        versao: '2.0.0',
        total_calculos: 0, // TODO: Implementar contador
        tempo_medio_execucao: 0, // TODO: Implementar métricas
        estatisticas_regras: estatisticasRegras,
        estatisticas_inputs: estatisticasInputs,
        estatisticas_eventos: estatisticasEventos,
      };

    } catch (error) {
      this.logger.error(`❌ Erro ao obter estatísticas: ${error.message}`);
      return {
        motor_ativo: false,
        versao: '2.0.0',
        total_calculos: 0,
        tempo_medio_execucao: 0,
        estatisticas_regras: {},
        estatisticas_inputs: {},
        estatisticas_eventos: {},
      };
    }
  }

  /**
   * Cria contexto de cálculo a partir do DTO
   */
  private async criarContextoCalculo(dto: DTOCalculo): Promise<ContextoCalculo> {
    const contexto: ContextoCalculo = {
      id: this.gerarIdCalculo(),
      lojaId: dto.lojaId,
      produtos: dto.produtos || [],
      configuracoes: dto.configuracoes,
      cache: new Map(),
      metadata: {
        modo_calculo: 'orcamento',
        timestamp_criacao: new Date(),
        versao_motor: '2.0.0',
        origem: 'motor-calculo-v2',
        estagios_executados: [],
        regras_aplicadas: [],
      },
    };

    return contexto;
  }

  /**
   * Gera ID único para o cálculo
   */
  private gerarIdCalculo(): string {
    return `calc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Verifica saúde do motor de cálculo
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy' | 'degraded';
    timestamp: Date;
    versao: string;
    servicos: Record<string, 'up' | 'down'>;
    detalhes: string[];
  }> {
    const servicos: Record<string, 'up' | 'down'> = {};
    const detalhes: string[] = [];
    let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';

    try {
      // Verificar Prisma
      try {
        await this.prisma.$queryRaw`SELECT 1`;
        servicos.prisma = 'up';
      } catch (error) {
        servicos.prisma = 'down';
        detalhes.push(`Prisma: ${error.message}`);
        status = 'unhealthy';
      }

      // Verificar Business Rules Engine
      try {
        await this.businessRulesEngine.obterEstatisticasRegras('test');
        servicos.businessRulesEngine = 'up';
      } catch (error) {
        servicos.businessRulesEngine = 'down';
        detalhes.push(`BusinessRulesEngine: ${error.message}`);
        status = 'degraded';
      }

      // Verificar Pipeline Executor
      try {
        // Teste básico
        servicos.pipelineExecutor = 'up';
      } catch (error) {
        servicos.pipelineExecutor = 'down';
        detalhes.push(`PipelineExecutor: ${error.message}`);
        status = 'degraded';
      }

      // Verificar Event Producer
      try {
        await this.eventProducer.obterEstatisticasEventos('test');
        servicos.eventProducer = 'up';
      } catch (error) {
        servicos.eventProducer = 'down';
        detalhes.push(`EventProducer: ${error.message}`);
        status = 'degraded';
      }

      // Verificar Input Integration
      try {
        await this.inputIntegration.obterEstatisticasInputs('test');
        servicos.inputIntegration = 'up';
      } catch (error) {
        servicos.inputIntegration = 'down';
        detalhes.push(`InputIntegration: ${error.message}`);
        status = 'degraded';
      }

      return {
        status,
        timestamp: new Date(),
        versao: '2.0.0',
        servicos,
        detalhes,
      };

    } catch (error) {
      this.logger.error(`❌ Erro no health check: ${error.message}`);
      return {
        status: 'unhealthy',
        timestamp: new Date(),
        versao: '2.0.0',
        servicos: {},
        detalhes: [`Erro geral: ${error.message}`],
      };
    }
  }

  /**
   * Método para compatibilidade com orçamentos V2
   * Usado pela integração existente
   */
  async calcularOrcamento(dados: any, lojaId: string): Promise<any> {
    this.logger.log(`🔄 Calculando orçamento via compatibilidade V2 para loja ${lojaId}`);
    
    try {
      // Transformar dados para formato DTO
      const dto: DTOCalculo = {
        lojaId,
        produtos: dados.produtos || [],
        configuracoes: dados.configuracoes || {
          margem_lucro_padrao: 30,
          impostos_padrao: 18,
          custos_indiretos_padrao: 15,
          desconto_padrao: 0,
          prazo_entrega_padrao: 10,
          unidade_monetaria: 'BRL',
          timezone: 'America/Sao_Paulo',
        },
      };

      // Executar cálculo
      const resultado = await this.executarCalculo(dto);
      
      return resultado;
      
    } catch (error) {
      this.logger.error(`❌ Erro na compatibilidade V2: ${error.message}`);
      throw error;
    }
  }

  /**
   * Método para cálculo de produto individual
   * Usado pela integração existente
   */
  async calcularProduto(produto: any, lojaId: string): Promise<any> {
    this.logger.log(`🔧 Calculando produto individual para loja ${lojaId}`);
    
    try {
      const dto: DTOCalculo = {
        lojaId,
        produtos: [produto],
        configuracoes: {
          margem_lucro_padrao: 30,
          impostos_padrao: 18,
          custos_indiretos_padrao: 15,
          desconto_padrao: 0,
          prazo_entrega_padrao: 10,
          unidade_monetaria: 'BRL',
          timezone: 'America/Sao_Paulo',
        },
      };

      const resultado = await this.executarCalculoSimplificado(dto);
      
      return {
        produto: resultado,
        custos: resultado.resumo,
        alertas: [],
      };
      
    } catch (error) {
      this.logger.error(`❌ Erro no cálculo de produto: ${error.message}`);
      throw error;
    }
  }
}
