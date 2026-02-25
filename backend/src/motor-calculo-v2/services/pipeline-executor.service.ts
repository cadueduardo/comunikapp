import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ContextoCalculo,
  ResultadoCalculo,
  EstagioCalculo,
  ResultadoEstagio,
  ValidationResult,
} from '../interfaces/calculo.interface';

@Injectable()
export class PipelineExecutorService {
  private readonly logger = new Logger(PipelineExecutorService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Executa pipeline completo de estágios
   * Sistema configurável e extensível
   */
  async executarPipeline(
    contexto: ContextoCalculo,
    incluirDetalhes = true,
  ): Promise<ResultadoCalculo> {
    const startTime = Date.now();
    this.logger.log(`🏭 Executando pipeline para contexto ${contexto.id}`);

    try {
      // 1. Carregar estágios configurados
      const estagios = await this.carregarEstagios(contexto.lojaId);

      // 2. Executar estágios em sequência
      const resultados = await this.executarEstagios(estagios, contexto);

      // 3. Consolidar resultados
      const resultado = this.consolidarResultados(
        contexto,
        resultados,
        incluirDetalhes,
      );

      const tempoTotal = Date.now() - startTime;
      this.logger.log(
        `✅ Pipeline executado em ${tempoTotal}ms - ${estagios.length} estágios`,
      );

      return resultado;
    } catch (error: any) {
      this.logger.error(
        `❌ Erro na execução do pipeline: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Carrega estágios configurados para a loja
   */
  private carregarEstagios(lojaId: string): EstagioCalculo[] {
    // Estágios padrão do motor V2
    const estagiosPadrao: EstagioCalculo[] = [
      {
        id: 'estagio-001',
        nome: 'Validação de Entrada',
        ordem: 1,
        ativo: true,
        configuracao: {},
        executar: this.executarValidacaoEntrada.bind(this),
        validar: this.validarEstagio.bind(this),
      },
      {
        id: 'estagio-002',
        nome: 'Cálculo de Materiais',
        ordem: 2,
        ativo: true,
        configuracao: {},
        executar: this.executarCalculoMateriais.bind(this),
        validar: this.validarEstagio.bind(this),
      },
      {
        id: 'estagio-003',
        nome: 'Cálculo de Mão de Obra',
        ordem: 3,
        ativo: true,
        configuracao: {},
        executar: this.executarCalculoMaoObra.bind(this),
        validar: this.validarEstagio.bind(this),
      },
      {
        id: 'estagio-004',
        nome: 'Custos Indiretos',
        ordem: 4,
        ativo: true,
        configuracao: {},
        executar: this.executarCustosIndiretos.bind(this),
        validar: this.validarEstagio.bind(this),
      },
      {
        id: 'estagio-005',
        nome: 'Margem de Lucro',
        ordem: 5,
        ativo: true,
        configuracao: {},
        executar: this.executarMargemLucro.bind(this),
        validar: this.validarEstagio.bind(this),
      },
      {
        id: 'estagio-006',
        nome: 'Impostos',
        ordem: 6,
        ativo: true,
        configuracao: {},
        executar: this.executarImpostos.bind(this),
        validar: this.validarEstagio.bind(this),
      },
    ];

    this.logger.log(
      `📋 Carregados ${estagiosPadrao.length} estágios para loja ${lojaId}`,
    );
    return estagiosPadrao;
  }

  /**
   * Executa estágios em sequência
   */
  private async executarEstagios(
    estagios: EstagioCalculo[],
    contexto: ContextoCalculo,
  ): Promise<ResultadoEstagio[]> {
    const resultados: ResultadoEstagio[] = [];
    let resultadoAcumulado: any = {};

    for (const estagio of estagios) {
      const startTime = Date.now();
      this.logger.log(`⚡ Executando estágio: ${estagio.nome}`);

      try {
        const resultado = await estagio.executar(contexto, resultadoAcumulado);

        resultado.tempo_execucao = Date.now() - startTime;
        resultado.executado_em = new Date();
        resultado.versao = '2.0.0';

        resultados.push(resultado);

        // Acumular resultado para próximo estágio
        if (resultado.sucesso) {
          resultadoAcumulado = { ...resultadoAcumulado, ...resultado.dados };
          contexto.metadata.estagios_executados?.push(estagio.nome);
        }

        this.logger.log(
          `✅ Estágio ${estagio.nome} executado em ${resultado.tempo_execucao}ms`,
        );
      } catch (error: any) {
        const tempoExecucao = Date.now() - startTime;
        this.logger.error(
          `❌ Erro no estágio ${estagio.nome} após ${tempoExecucao}ms: ${error.message}`,
        );
        throw error;
      }
    }

    return resultados;
  }

  /**
   * Consolida resultados do pipeline
   */
  private consolidarResultados(
    contexto: ContextoCalculo,
    resultados: ResultadoEstagio[],
    incluirDetalhes: boolean,
  ): ResultadoCalculo {
    // Extrair dados dos resultados
    const dadosConsolidados = resultados.reduce((acc, resultado) => {
      if (resultado.sucesso) {
        return { ...acc, ...resultado.dados };
      }
      return acc;
    }, {});

    // Criar resultado consolidado
    const resultado: ResultadoCalculo = {
      id: `resultado_${contexto.id}`,
      contexto_id: contexto.id,
      produtos: this.processarProdutos(contexto.produtos, dadosConsolidados),
      resumo: this.calcularResumo(dadosConsolidados),
      recursos_compartilhados: this.processarRecursosCompartilhados(
        contexto.produtos,
      ),
      contexto_comercial: this.processarContextoComercial(
        contexto.configuracoes,
        dadosConsolidados,
      ),
      metadata: {
        timestamp_calculo: new Date(),
        versao_motor: '2.0.0',
        tempo_execucao_ms: resultados.reduce(
          (acc, r) => acc + r.tempo_execucao,
          0,
        ),
        estagios_executados: resultados
          .filter((r) => r.sucesso)
          .map((r) => r.estagio),
      },
    };

    // Incluir trace se solicitado
    if (incluirDetalhes) {
      resultado.trace = resultados.map((r) => ({
        estagio: r.estagio,
        timestamp: r.executado_em,
        entrada: {},
        saida: r.dados,
        tempo_execucao_ms: r.tempo_execucao,
        memoria_utilizada: r.memoria_utilizada,
        versao: r.versao,
      }));
    }

    return resultado;
  }

  // Implementações dos estágios específicos

  private async executarValidacaoEntrada(
    contexto: ContextoCalculo,
    _resultado: any,
  ): Promise<ResultadoEstagio> {
    const dados = {
      produtos_validos: contexto.produtos.length > 0,
      configuracoes_validas: !!contexto.configuracoes,
    };

    return {
      estagio: 'Validação de Entrada',
      sucesso: dados.produtos_validos && dados.configuracoes_validas,
      dados,
      deltas: {},
      tempo_execucao: 0,
      memoria_utilizada: 0,
      executado_em: new Date(),
      versao: '2.0.0',
    };
  }

  private async executarCalculoMateriais(
    contexto: ContextoCalculo,
    _resultado: any,
  ): Promise<ResultadoEstagio> {
    let custoTotalMateriais = 0;

    const materiaisDetalhados = contexto.produtos.map((produto) => {
      const custoMateriais = produto.insumos.reduce((acc, insumo) => {
        return acc + insumo.preco_unitario * insumo.quantidade;
      }, 0);

      custoTotalMateriais += custoMateriais;

      return {
        produto_id: produto.id,
        custo_materiais: custoMateriais,
        insumos: produto.insumos,
      };
    });

    const dados = {
      custo_total_materiais: custoTotalMateriais,
      materiais_detalhados: materiaisDetalhados,
    };

    return {
      estagio: 'Cálculo de Materiais',
      sucesso: true,
      dados,
      deltas: { custo_materiais: custoTotalMateriais },
      tempo_execucao: 0,
      memoria_utilizada: 0,
      executado_em: new Date(),
      versao: '2.0.0',
    };
  }

  private async executarCalculoMaoObra(
    contexto: ContextoCalculo,
    _resultado: any,
  ): Promise<ResultadoEstagio> {
    let custoTotalMaoObra = 0;

    const maoObraDetalhada = contexto.produtos.map((produto) => {
      const custoMaoObra = produto.funcoes.reduce((acc, funcao) => {
        return acc + funcao.custo_hora * funcao.tempo_estimado;
      }, 0);

      custoTotalMaoObra += custoMaoObra;

      return {
        produto_id: produto.id,
        custo_mao_obra: custoMaoObra,
        funcoes: produto.funcoes,
      };
    });

    const dados = {
      custo_total_mao_obra: custoTotalMaoObra,
      mao_obra_detalhada: maoObraDetalhada,
    };

    return {
      estagio: 'Cálculo de Mão de Obra',
      sucesso: true,
      dados,
      deltas: { custo_mao_obra: custoTotalMaoObra },
      tempo_execucao: 0,
      memoria_utilizada: 0,
      executado_em: new Date(),
      versao: '2.0.0',
    };
  }

  private async executarCustosIndiretos(
    contexto: ContextoCalculo,
    resultado: any,
  ): Promise<ResultadoEstagio> {
    const custoProducao =
      (resultado.custo_materiais || 0) + (resultado.custo_mao_obra || 0);

    // Só aplicar custos indiretos quando houver itens cadastrados na loja
    const countCustosIndiretos = await this.prisma.custoindireto.count({
      where: { loja_id: contexto.lojaId, ativo: true },
    });

    const percentualIndiretos =
      countCustosIndiretos > 0
        ? (contexto.configuracoes.custos_indiretos_padrao || 15)
        : 0;
    const custoIndiretos = custoProducao * (percentualIndiretos / 100);

    const dados = {
      custo_indiretos: custoIndiretos,
      percentual_aplicado: percentualIndiretos,
      base_calculo: custoProducao,
    };

    return {
      estagio: 'Custos Indiretos',
      sucesso: true,
      dados,
      deltas: { custo_indiretos: custoIndiretos },
      tempo_execucao: 0,
      memoria_utilizada: 0,
      executado_em: new Date(),
      versao: '2.0.0',
    };
  }

  private async executarMargemLucro(
    contexto: ContextoCalculo,
    resultado: any,
  ): Promise<ResultadoEstagio> {
    const custoTotal =
      (resultado.custo_materiais || 0) +
      (resultado.custo_mao_obra || 0) +
      (resultado.custo_indiretos || 0);

    const percentualMargem = contexto.configuracoes.margem_lucro_padrao || 30;
    const percentualImpostos = contexto.configuracoes.impostos_padrao || 18;
    const percentualComissao = contexto.configuracoes.comissao_padrao || 5;

    // Fórmula correta: Preço = Custo / (1 - %Imposto - %Comissão - %Lucro)
    // Isso garante que a margem de lucro seja aplicada APÓS impostos e comissão
    const percentualMargemDecimal = percentualMargem / 100;
    const percentualImpostosDecimal = percentualImpostos / 100;
    const percentualComissaoDecimal = percentualComissao / 100;
    const divisor =
      1 -
      percentualImpostosDecimal -
      percentualComissaoDecimal -
      percentualMargemDecimal;

    const precoFinal = divisor > 0 ? custoTotal / divisor : custoTotal;

    // Calcular valores para exibição
    const impostosValor = precoFinal * percentualImpostosDecimal;
    const comissaoValor = precoFinal * percentualComissaoDecimal;
    const margemLucro = precoFinal * percentualMargemDecimal;
    const subtotalComLucro = precoFinal - impostosValor - comissaoValor;

    const dados = {
      margem_lucro: margemLucro,
      percentual_aplicado: percentualMargem,
      base_calculo: custoTotal,
      subtotal_com_lucro: subtotalComLucro,
      preco_final: precoFinal,
      impostos_valor: impostosValor,
      comissao_valor: comissaoValor,
      comissao_percentual: percentualComissao,
    };

    return {
      estagio: 'Margem de Lucro',
      sucesso: true,
      dados,
      deltas: { margem_lucro: margemLucro },
      tempo_execucao: 0,
      memoria_utilizada: 0,
      executado_em: new Date(),
      versao: '2.0.0',
    };
  }

  private async executarImpostos(
    contexto: ContextoCalculo,
    resultado: any,
  ): Promise<ResultadoEstagio> {
    // Os impostos já foram calculados junto com a margem de lucro
    // Esta função agora apenas retorna os dados já calculados
    const impostos = resultado.impostos_valor || 0;
    const precoFinal = resultado.preco_final || 0;
    const percentualImpostos = contexto.configuracoes.impostos_padrao || 18;

    const dados = {
      impostos: impostos,
      percentual_aplicado: percentualImpostos,
      base_calculo: resultado.subtotal_com_lucro || 0,
      preco_final: precoFinal,
    };

    return {
      estagio: 'Impostos',
      sucesso: true,
      dados,
      deltas: { impostos: impostos, preco_final: precoFinal },
      tempo_execucao: 0,
      memoria_utilizada: 0,
      executado_em: new Date(),
      versao: '2.0.0',
    };
  }

  private validarEstagio(_contexto: ContextoCalculo): ValidationResult {
    return {
      valido: true,
      erros: [],
      avisos: [],
    };
  }

  // Métodos auxiliares

  private processarProdutos(produtos: any[], _dados: any): any[] {
    return produtos.map((produto) => ({
      produto_id: produto.id,
      nome_servico: produto.nome_servico,
      quantidade: produto.quantidade,
      custos: {
        custo_material: 0,
        custo_mao_obra: 0,
        custo_maquinaria: 0,
        custo_indireto: 0,
        custo_total_producao: 0,
        margem_lucro_valor: 0,
        subtotal_com_lucro: 0,
        impostos_valor: 0,
        preco_final: 0,
      },
      tempo_producao: 0,
      preco_unitario: 0,
      preco_total: 0,
    }));
  }

  private calcularResumo(dados: any): any {
    return {
      custo_total_materiais: dados.custo_total_materiais || 0,
      custo_total_mao_obra: dados.custo_total_mao_obra || 0,
      custo_total_maquinaria: dados.custo_total_maquinaria || 0,
      custo_total_indiretos: dados.custo_indiretos || 0,
      custo_total_producao:
        (dados.custo_total_materiais || 0) + (dados.custo_total_mao_obra || 0),
      margem_lucro_total: dados.margem_lucro || 0,
      subtotal_com_lucro: dados.subtotal_com_lucro || 0,
      impostos_total: dados.impostos || 0,
      preco_final: dados.preco_final || 0,
      tempo_total_producao: 0,
    };
  }

  private processarRecursosCompartilhados(_produtos: any[]): any {
    return {
      materiais_consolidados: [],
      maquinas_consolidadas: [],
      funcoes_consolidadas: [],
    };
  }

  private processarContextoComercial(configuracoes: any, dados: any): any {
    return {
      margem_lucro_aplicada:
        dados.percentual_aplicado || configuracoes.margem_lucro_padrao,
      impostos_aplicados:
        dados.percentual_aplicado || configuracoes.impostos_padrao,
    };
  }
}
