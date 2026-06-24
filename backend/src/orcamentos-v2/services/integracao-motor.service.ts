import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MotorCalculoV2Service } from '../../motor-calculo-v2/services/motor-calculo-v2.service';
import {
  isProdutoFinitoItem,
} from '../../produtos-finitos/utils/preco-produto-finito.util';
import {
  OrcamentoCompleto,
  ProdutoOrcamento,
  CustosOrcamento,
  ConfiguracaoCalculo,
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
    private readonly prisma: PrismaService,
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
      const produtos = dadosOrcamento.produtos || [];
      const produtosMotor = produtos.filter(
        (produto: any) => !isProdutoFinitoItem(produto),
      );
      const totaisPrateleira = this.somarTotaisProdutosPrateleira(produtos);

      if (produtosMotor.length === 0) {
        const custos: CustosOrcamento = {
          preco_final: totaisPrateleira.preco_total,
          custo_total: totaisPrateleira.custo_total,
          margem_lucro: 0,
          impostos: 0,
          custos_diretos: {
            insumos: 0,
            maquinas: 0,
            funcoes: 0,
            servicos_manuais: 0,
            subtotal: totaisPrateleira.custo_total,
          },
          custos_indiretos: 0,
          lucro_estimado:
            totaisPrateleira.preco_total - totaisPrateleira.custo_total,
        };

        return {
          orcamento: {
            ...dadosOrcamento,
            custos_calculados: custos,
            detalhamento: { produtos_prateleira: produtos.length },
            alertas: [],
          },
          custos,
          detalhamento: { produtos_prateleira: produtos.length },
          alertas: [],
        };
      }

      // 1. Preparar dados para o motor (somente SOB_DEMANDA)
      const dadosMotor = this.prepararDadosParaMotor(
        { ...dadosOrcamento, produtos: produtosMotor },
        lojaId,
      );

      // 2. Executar cálculo via motor V2 (já funcionando)
      const resultadoMotor =
        await this.motorCalculoV2Service.executarCalculo(dadosMotor);

      // 3. Processar resultado do motor
      const resultadoProcessado = this.processarResultadoMotor(
        resultadoMotor,
        dadosOrcamento,
        lojaId,
      );

      if (totaisPrateleira.preco_total > 0) {
        resultadoProcessado.custos.preco_final =
          Number(resultadoProcessado.custos.preco_final || 0) +
          totaisPrateleira.preco_total;
        resultadoProcessado.custos.valor_total =
          resultadoProcessado.custos.preco_final;
        resultadoProcessado.custos.custo_total =
          Number(resultadoProcessado.custos.custo_total || 0) +
          totaisPrateleira.custo_total;
        resultadoProcessado.orcamento.custos_calculados =
          resultadoProcessado.custos;
      }

      // 4. Validar e retornar
      const resultadoFinal = await this.validarResultadoFinal(
        resultadoProcessado,
        lojaId,
      );

      this.logger.log(`✅ Orçamento calculado com sucesso via motor V2`);
      return resultadoFinal;
    } catch (error) {
      this.logger.error(
        `❌ Erro ao calcular orçamento via motor V2: ${error.message}`,
      );
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
      if (isProdutoFinitoItem(produto)) {
        const precoTotal = Number(produto.preco_total || 0);
        const precoUnitario = Number(
          produto.preco_unitario ||
            precoTotal / Math.max(1, Number(produto.quantidade || 1)),
        );
        return {
          produto: {
            ...produto,
            preco_unitario: precoUnitario,
            preco_total: precoTotal,
            custo_total_producao: Number(produto.custo_total_producao || 0),
            margem_lucro: 0,
            impostos: 0,
          },
          custos: {
            preco_total: precoTotal,
            custo_total: Number(produto.custo_total_producao || 0),
          },
          alertas: [],
        };
      }

      // Usar motor V2 para cálculo de produto
      const resultadoProduto = await this.motorCalculoV2Service.calcularProduto(
        produto,
        lojaId,
      );

      return this.processarProdutoMotor(resultadoProduto, produto, lojaId);
    } catch (error) {
      this.logger.error(
        `❌ Erro ao calcular produto via motor V2: ${error.message}`,
      );
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
      // Usar sistema de validação do motor V2 (validar contexto)
      const dto = {
        lojaId,
        produtos: (orcamento?.produtos || []).filter(
          (produto: any) => !isProdutoFinitoItem(produto),
        ),
        configuracoes: orcamento?.configuracoes || {},
      } as any;
      const resultadoValidacao =
        await this.motorCalculoV2Service.validarContexto(dto);

      return {
        valido: resultadoValidacao.valido,
        erros: resultadoValidacao.erros || [],
        alertas: resultadoValidacao.avisos || [],
        recomendacoes: [],
      };
    } catch (error) {
      this.logger.error(
        `❌ Erro ao validar orçamento via motor V2: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Obtém configurações de cálculo da loja via motor V2
   */
  async obterConfiguracoesLoja(lojaId: string): Promise<ConfiguracaoCalculo> {
    this.logger.log(`⚙️ Obtendo configurações da loja ${lojaId} via motor V2`);

    try {
      // Motor não expõe configurações específicas: retornar defaults adequados
      const loja = await this.prisma.loja.findUnique({
        where: { id: lojaId },
        select: {
          margem_lucro_padrao: true,
          impostos_padrao: true,
          custos_indiretos_mensais: true,
          horas_produtivas_mensais: true,
          tipo_margem_lucro: true,
        },
      });

      return this.converterConfiguracoesMotor({
        margem_lucro_padrao: loja?.margem_lucro_padrao ?? 30,
        impostos_padrao: loja?.impostos_padrao ?? 18,
        custos_indiretos_padrao: 0,
        horas_produtivas_mensais: loja?.horas_produtivas_mensais ?? 160,
        custos_indiretos_mensais: loja?.custos_indiretos_mensais ?? 0,
        tipo_margem_lucro: loja?.tipo_margem_lucro ?? 'margem_por_dentro',
        regras_especiais: [],
      });
    } catch (error) {
      this.logger.error(
        `❌ Erro ao obter configurações via motor V2: ${error.message}`,
      );
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
    this.logger.log(
      `📦 Calculando ${orcamentos.length} orçamentos em lote via motor V2`,
    );

    try {
      // Motor não expõe cálculo em lote: processar sequencialmente
      const resultados: any[] = [];
      const erros: any[] = [];
      for (const orc of orcamentos) {
        try {
          const resultado = await this.motorCalculoV2Service.calcularOrcamento(
            orc,
            lojaId,
          );
          resultados.push({ sucesso: true, resultado });
        } catch (e) {
          erros.push({ erro: e?.message, orcamento: orc });
          resultados.push({ sucesso: false, erro: e?.message });
        }
      }
      return {
        resultados,
        estatisticas: { processados: resultados.length, erros: erros.length },
        erros,
      };
    } catch (error) {
      this.logger.error(
        `❌ Erro ao calcular lote via motor V2: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Obtém estatísticas de performance do motor V2
   */
  async obterEstatisticasMotor(lojaId: string): Promise<any> {
    this.logger.log(`📊 Obtendo estatísticas do motor V2`);

    try {
      // Usar endpoints de performance do motor V2
      const estatisticas =
        await this.motorCalculoV2Service.obterEstatisticas(lojaId);

      return {
        ...estatisticas,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `❌ Erro ao obter estatísticas do motor V2: ${error.message}`,
      );
      throw error;
    }
  }

  // Métodos privados de processamento

  private prepararDadosParaMotor(dadosOrcamento: any, lojaId: string): any {
    this.logger.log(`🔄 Preparando dados para motor V2`);

    // Debug: verificar estrutura dos dados recebidos
    this.logger.log(`🔍 Debug - Dados recebidos:`, {
      produtos_count: dadosOrcamento.produtos?.length || 0,
      primeiro_produto: dadosOrcamento.produtos?.[0]
        ? {
            id: dadosOrcamento.produtos[0].id,
            nome: dadosOrcamento.produtos[0].nome,
            insumos_count: dadosOrcamento.produtos[0].insumos?.length || 0,
            primeiro_insumo: dadosOrcamento.produtos[0].insumos?.[0]
              ? {
                  insumo_id: dadosOrcamento.produtos[0].insumos[0].insumo_id,
                  id: dadosOrcamento.produtos[0].insumos[0].id,
                }
              : null,
          }
        : null,
    });

    const toNumber = (value: unknown): number | undefined => {
      if (value == null) return undefined;
      const n = Number(value);
      return Number.isFinite(n) ? n : undefined;
    };

    // Obter configurações: podem vir como objeto (API) ou como JSON em configuracao_calculo (Prisma)
    let config = dadosOrcamento.configuracoes;
    if (!config && typeof dadosOrcamento.configuracao_calculo === 'string') {
      try {
        config = JSON.parse(dadosOrcamento.configuracao_calculo);
      } catch {
        config = {};
      }
    }

    // Percentuais do motor devem vir de campos de percentual/configuração.
    // Não usar campos monetários (impostos, margem_lucro) como fallback.
    const margemPercentual =
      toNumber(dadosOrcamento.margem_lucro_customizada) ??
      toNumber(config?.margem_lucro_padrao) ??
      30;
    const impostosPercentual =
      toNumber(dadosOrcamento.impostos_customizados) ??
      toNumber(config?.impostos_padrao) ??
      25;
    const comissaoPercentual =
      toNumber(dadosOrcamento.comissao_percentual) ??
      toNumber(config?.comissao_padrao) ??
      5;

    const tipoMargemRaw =
      dadosOrcamento.tipo_margem_lucro ??
      config?.tipo_margem_lucro;
    const tipoMargem =
      tipoMargemRaw != null && String(tipoMargemRaw).trim() !== ''
        ? String(tipoMargemRaw).trim().toLowerCase()
        : undefined;
    const tipoMargemLucro =
      tipoMargem === 'markup' || tipoMargem === 'margem_por_dentro'
        ? tipoMargem
        : undefined;

    // Estrutura básica compatível com DTOCalculo
    const configuracoesMotor: Record<string, unknown> = {
      margem_lucro_padrao: margemPercentual,
      impostos_padrao: impostosPercentual,
      comissao_padrao: comissaoPercentual,
      custos_indiretos_padrao:
        toNumber(config?.custos_indiretos_padrao) ?? 15,
      incluir_detalhamento: true,
      incluir_validacoes: true,
    };
    if (tipoMargemLucro) {
      configuracoesMotor.tipo_margem_lucro = tipoMargemLucro;
    }

    const dadosMotor = {
      lojaId: lojaId,
      produtos: this.prepararProdutosParaMotor(dadosOrcamento.produtos || []),
      configuracoes: configuracoesMotor,
      metadata: {
        orcamento_id: dadosOrcamento.id,
        usuario_id: 'sistema',
        timestamp: new Date(),
        versao: '2.0',
      },
    };

    this.logger.log(
      `✅ Dados preparados para motor V2: ${dadosMotor.produtos.length} produtos`,
    );
    return dadosMotor;
  }

  private processarResultadoMotor(
    resultadoMotor: any,
    dadosOriginais: any,
    lojaId: string,
  ): any {
    // O motor retorna "resumo" (com preco_final), não "custos".
    // Mapear resumo para custos para compatibilidade com atualizarCustosCalculados.
    const custos =
      resultadoMotor.custos ||
      (resultadoMotor.resumo
        ? {
            preco_final: resultadoMotor.resumo.preco_final,
            valor_total: resultadoMotor.resumo.preco_final,
            custo_total:
              resultadoMotor.resumo.custo_total_producao ||
              (resultadoMotor.resumo.custo_total_materiais || 0) +
                (resultadoMotor.resumo.custo_total_mao_obra || 0) +
                (resultadoMotor.resumo.custo_total_maquinaria || 0) +
                (resultadoMotor.resumo.custo_total_indiretos || 0),
            margem_lucro: resultadoMotor.resumo.margem_lucro_total,
            impostos: resultadoMotor.resumo.impostos_total,
          }
        : {});

    return {
      orcamento: {
        ...dadosOriginais,
        custos_calculados: custos,
        detalhamento: resultadoMotor.detalhamento,
        alertas: resultadoMotor.alertas || [],
      },
      custos,
      detalhamento: resultadoMotor.detalhamento,
      alertas: resultadoMotor.alertas || [],
    };
  }

  private async validarResultadoFinal(
    resultado: any,
    lojaId: string,
  ): Promise<any> {
    // Validação final do resultado
    const validacao = await this.validarOrcamento(resultado.orcamento, lojaId);

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

  private converterConfiguracoesMotor(
    configuracoesMotor: any,
  ): ConfiguracaoCalculo {
    const toNumber = (value: unknown, fallback = 0): number => {
      const n = Number(value);
      return Number.isFinite(n) ? n : fallback;
    };

    // Converter configurações do motor para formato do orçamento
    return {
      margem_lucro_padrao: toNumber(configuracoesMotor.margem_lucro_padrao),
      impostos_padrao: toNumber(configuracoesMotor.impostos_padrao),
      custos_indiretos_padrao: toNumber(configuracoesMotor.custos_indiretos_padrao),
      horas_produtivas_mensais:
        toNumber(configuracoesMotor.horas_produtivas_mensais),
      custos_indiretos_mensais: toNumber(configuracoesMotor.custos_indiretos_mensais),
      tipo_margem_lucro: configuracoesMotor.tipo_margem_lucro,
      regras_especiais: configuracoesMotor.regras_especiais || [],
    };
  }

  private processarResultadoLote(
    resultadoLote: any,
    orcamentosOriginais: any[],
  ): any {
    // Processar resultado de cálculo em lote
    return {
      resultados: resultadoLote.resultados.map(
        (resultado: any, index: number) => ({
          orcamento_id: orcamentosOriginais[index]?.id,
          resultado,
          sucesso: !resultado.erro,
          erro: resultado.erro,
        }),
      ),
      estatisticas: resultadoLote.estatisticas,
      erros: resultadoLote.erros || [],
    };
  }

  /**
   * Prepara produtos para o motor V2
   */
  private prepararProdutosParaMotor(produtos: any[]): any[] {
    return produtos
      .filter((produto) => !isProdutoFinitoItem(produto))
      .map((produto) => ({
      id: produto.id,
      nome: produto.nome || 'Produto sem nome',
      quantidade: parseFloat(produto.quantidade || '1'),
      largura: parseFloat(produto.largura || '0'),
      altura: parseFloat(produto.altura || '0'),
      area: parseFloat(produto.area || '0'),
      unidade_medida: produto.unidade_medida || 'un',

      // Insumos - usar insumo_id (ID real do insumo no banco). Prisma: preco_unitario; API: custo_unitario
      insumos: (produto.insumos || []).map((insumo: any) => ({
        id: insumo.insumo_id,
        nome: insumo.nome || 'Insumo sem nome',
        quantidade: parseFloat(insumo.quantidade || '0'),
        custo_unitario: parseFloat(
          insumo.custo_unitario ?? insumo.preco_unitario ?? '0',
        ),
      })),

      // Máquinas - Prisma usa tempo_horas; motor espera horas_utilizadas
      maquinas: (produto.maquinas || []).map((maquina: any) => ({
        id: maquina.maquina_id,
        nome: maquina.nome || 'Máquina sem nome',
        horas_utilizadas: parseFloat(
          maquina.horas_utilizadas ?? maquina.tempo_horas ?? '0',
        ),
        custo_hora: parseFloat(maquina.custo_hora || '0'),
      })),

      // Funções - Prisma usa tempo_horas; motor espera horas_trabalhadas e valor_hora (ou custo_hora)
      funcoes: (produto.funcoes || []).map((funcao: any) => ({
        id: funcao.funcao_id,
        nome: funcao.nome || 'Função sem nome',
        horas_trabalhadas: parseFloat(
          funcao.horas_trabalhadas ?? funcao.tempo_horas ?? '0',
        ),
        valor_hora: parseFloat(
          funcao.valor_hora ?? funcao.custo_hora ?? '0',
        ),
      })),

      // Serviços manuais - Prisma usa tempo_horas e custo_hora
      servicos: (produto.servicos_manuais || produto.servicos || []).map(
        (servico: any) => ({
          id: servico.servico_id,
          nome: servico.nome || 'Serviço sem nome',
          horas_trabalhadas: parseFloat(
            servico.horas_trabalhadas ?? servico.tempo_horas ?? '0',
          ),
          valor_hora: parseFloat(servico.valor_hora ?? servico.custo_hora ?? '0'),
        }),
      ),
    }));
  }

  private somarTotaisProdutosPrateleira(produtos: any[]): {
    preco_total: number;
    custo_total: number;
  } {
    return produtos
      .filter((produto) => isProdutoFinitoItem(produto))
      .reduce(
        (acc, produto) => {
          const precoTotal = Number(produto.preco_total || 0);
          const custoTotal = Number(produto.custo_total_producao || 0);
          return {
            preco_total: acc.preco_total + precoTotal,
            custo_total: acc.custo_total + custoTotal,
          };
        },
        { preco_total: 0, custo_total: 0 },
      );
  }
}
