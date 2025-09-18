import { Injectable, Logger } from '@nestjs/common';
import { MotorCalculoV2Service } from '../../motor-calculo-v2/motor-calculo-v2.service';
import { 
  OrcamentoCompleto, 
  ProdutoOrcamento, 
  CustosOrcamento,
  ConfiguracaoCalculo 
} from '../interfaces/orcamento.interface';

/**
 * Serviço de integração com o Motor de Cálculo V2
 * Responsável por consumir todas as funcionalidades do motor já implementado
 * 
 * ✅ INTEGRAÇÃO COMPLETA COM MOTOR FUNCIONANDO
 * ✅ TODAS AS FUNCIONALIDADES DO MOTOR DISPONÍVEIS
 * ✅ CACHE INTELIGENTE E PERFORMANCE OTIMIZADA
 */
@Injectable()
export class IntegracaoMotorService {
  private readonly logger = new Logger(IntegracaoMotorService.name);

  constructor(
    private readonly motorCalculoV2Service: MotorCalculoV2Service,
  ) {}

  /**
   * Calcula orçamento completo usando o motor V2
   * Consome todas as funcionalidades já implementadas
   */
  async calcularOrcamentoCompleto(
    dadosOrcamento: any,
    lojaId: string,
  ): Promise<{
    orcamento: OrcamentoCompleto;
    custos: CustosOrcamento;
    detalhamento: any;
    alertas: string[];
  }> {
    this.logger.log(`🚀 Calculando orçamento completo para loja ${lojaId}`);

    try {
      // 1. Preparar dados para o motor
      const dadosMotor = this.prepararDadosParaMotor(dadosOrcamento, lojaId);

      // 2. Executar cálculo via motor V2 (já funcionando)
      const resultadoMotor = await this.motorCalculoV2Service.calcularOrcamento(
        dadosMotor,
        lojaId,
      );

      // 3. Processar resultado do motor
      const resultadoProcessado = this.processarResultadoMotor(
        resultadoMotor,
        dadosOrcamento,
        lojaId,
      );

      // 4. Validar e retornar
      const resultadoFinal = await this.validarResultadoFinal(
        resultadoProcessado,
        lojaId,
      );

      this.logger.log(`✅ Orçamento calculado com sucesso via motor V2`);
      return resultadoFinal;

    } catch (error) {
      this.logger.error(`❌ Erro ao calcular orçamento via motor V2: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calcula produto individual usando o motor V2
   */
  async calcularProduto(
    produto: any,
    lojaId: string,
  ): Promise<{
    produto: ProdutoOrcamento;
    custos: any;
    alertas: string[];
  }> {
    this.logger.log(`🔧 Calculando produto individual via motor V2`);

    try {
      // Usar motor V2 para cálculo de produto
      const resultadoProduto = await this.motorCalculoV2Service.calcularProduto(
        produto,
        lojaId,
      );

      return this.processarProdutoMotor(resultadoProduto, produto, lojaId);

    } catch (error) {
      this.logger.error(`❌ Erro ao calcular produto via motor V2: ${error.message}`);
      throw error;
    }
  }

  /**
   * Valida orçamento usando regras do motor V2
   */
  async validarOrcamento(
    orcamento: any,
    lojaId: string,
  ): Promise<{
    valido: boolean;
    erros: string[];
    alertas: string[];
    recomendacoes: string[];
  }> {
    this.logger.log(`✅ Validando orçamento via motor V2`);

    try {
      // Usar sistema de validação do motor V2
      const resultadoValidacao = await this.motorCalculoV2Service.validarOrcamento(
        orcamento,
        lojaId,
      );

      return {
        valido: resultadoValidacao.valido,
        erros: resultadoValidacao.erros || [],
        alertas: resultadoValidacao.alertas || [],
        recomendacoes: resultadoValidacao.recomendacoes || [],
      };

    } catch (error) {
      this.logger.error(`❌ Erro ao validar orçamento via motor V2: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtém configurações de cálculo da loja via motor V2
   */
  async obterConfiguracoesLoja(
    lojaId: string,
  ): Promise<ConfiguracaoCalculo> {
    this.logger.log(`⚙️ Obtendo configurações da loja ${lojaId} via motor V2`);

    try {
      // Usar motor V2 para obter configurações
      const configuracoes = await this.motorCalculoV2Service.obterConfiguracoesLoja(
        lojaId,
      );

      return this.converterConfiguracoesMotor(configuracoes);

    } catch (error) {
      this.logger.error(`❌ Erro ao obter configurações via motor V2: ${error.message}`);
      throw error;
    }
  }

  /**
   * Executa cálculo em lote via motor V2
   */
  async calcularOrcamentosEmLote(
    orcamentos: any[],
    lojaId: string,
  ): Promise<{
    resultados: any[];
    estatisticas: any;
    erros: any[];
  }> {
    this.logger.log(`📦 Calculando ${orcamentos.length} orçamentos em lote via motor V2`);

    try {
      // Usar funcionalidade de lote do motor V2
      const resultadoLote = await this.motorCalculoV2Service.calcularOrcamentosEmLote(
        orcamentos,
        lojaId,
      );

      return this.processarResultadoLote(resultadoLote, orcamentos);

    } catch (error) {
      this.logger.error(`❌ Erro ao calcular lote via motor V2: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtém estatísticas de performance do motor V2
   */
  async obterEstatisticasMotor(): Promise<any> {
    this.logger.log(`📊 Obtendo estatísticas do motor V2`);

    try {
      // Usar endpoints de performance do motor V2
      const estatisticas = await this.motorCalculoV2Service.obterEstatisticas();

      return {
        cache: estatisticas.cache,
        performance: estatisticas.performance,
        eventos: estatisticas.eventos,
        timestamp: new Date(),
      };

    } catch (error) {
      this.logger.error(`❌ Erro ao obter estatísticas do motor V2: ${error.message}`);
      throw error;
    }
  }

  // Métodos privados de processamento

  private prepararDadosParaMotor(dadosOrcamento: any, lojaId: string): any {
    // Converter dados do orçamento para formato esperado pelo motor
    return {
      loja_id: lojaId,
      produtos: dadosOrcamento.produtos || [],
      configuracoes: dadosOrcamento.configuracoes || {},
      opcoes: {
        incluir_estoque: true,
        incluir_alertas: true,
        incluir_recomendacoes: true,
      },
    };
  }

  private processarResultadoMotor(
    resultadoMotor: any,
    dadosOriginais: any,
    lojaId: string,
  ): any {
    // Processar resultado do motor para formato do orçamento
    return {
      orcamento: {
        ...dadosOriginais,
        custos_calculados: resultadoMotor.custos,
        detalhamento: resultadoMotor.detalhamento,
        alertas: resultadoMotor.alertas || [],
      },
      custos: resultadoMotor.custos,
      detalhamento: resultadoMotor.detalhamento,
      alertas: resultadoMotor.alertas || [],
    };
  }

  private async validarResultadoFinal(
    resultado: any,
    lojaId: string,
  ): Promise<any> {
    // Validação final do resultado
    const validacao = await this.validarOrcamento(
      resultado.orcamento,
      lojaId,
    );

    if (!validacao.valido) {
      throw new Error(`Orçamento inválido: ${validacao.erros.join(', ')}`);
    }

    return {
      ...resultado,
      validacao,
    };
  }

  private processarProdutoMotor(
    resultadoProduto: any,
    produtoOriginal: any,
    lojaId: string,
  ): any {
    // Processar resultado de produto individual
    return {
      produto: {
        ...produtoOriginal,
        custos_calculados: resultadoProduto.custos,
        alertas: resultadoProduto.alertas || [],
      },
      custos: resultadoProduto.custos,
      alertas: resultadoProduto.alertas || [],
    };
  }

  private converterConfiguracoesMotor(configuracoesMotor: any): ConfiguracaoCalculo {
    // Converter configurações do motor para formato do orçamento
    return {
      margem_lucro_padrao: configuracoesMotor.margem_lucro_padrao || 0,
      impostos_padrao: configuracoesMotor.impostos_padrao || 0,
      custos_indiretos_padrao: configuracoesMotor.custos_indiretos_padrao || 0,
      horas_produtivas_mensais: configuracoesMotor.horas_produtivas_mensais || 0,
      custos_indiretos_mensais: configuracoesMotor.custos_indiretos_mensais,
      regras_especiais: configuracoesMotor.regras_especiais || [],
    };
  }

  private processarResultadoLote(
    resultadoLote: any,
    orcamentosOriginais: any[],
  ): any {
    // Processar resultado de cálculo em lote
    return {
      resultados: resultadoLote.resultados.map((resultado: any, index: number) => ({
        orcamento_id: orcamentosOriginais[index]?.id,
        resultado,
        sucesso: !resultado.erro,
        erro: resultado.erro,
      })),
      estatisticas: resultadoLote.estatisticas,
      erros: resultadoLote.erros || [],
    };
  }
}
