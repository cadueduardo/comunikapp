import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  RegraCalculo,
  ResultadoRegras,
  ContextoCalculo,
  ValidationResult,
} from '../interfaces/calculo.interface';

@Injectable()
export class BusinessRulesEngineService {
  private readonly logger = new Logger(BusinessRulesEngineService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Aplica regras de negócio configuráveis via banco de dados
   * Sistema extensível sem necessidade de refatoração
   */
  async aplicarRegras(contexto: ContextoCalculo): Promise<ResultadoRegras> {
    const startTime = Date.now();
    this.logger.log(`🔧 Aplicando regras para loja ${contexto.lojaId}`);

    try {
      // 1. Carregar regras ativas da loja
      const regras = await this.carregarRegras(contexto.lojaId);

      // 2. Validar regras
      const regrasValidas = await this.validarRegras(regras, contexto);

      // 3. Executar regras
      const resultado = await this.executarRegras(regrasValidas, contexto);

      const tempoExecucao = Date.now() - startTime;
      this.logger.log(`✅ Regras aplicadas em ${tempoExecucao}ms`);

      return resultado;
    } catch (error: any) {
      this.logger.error(
        `❌ Erro ao aplicar regras: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Carrega regras ativas do banco de dados
   * Sistema configurável sem deploy
   */
  private carregarRegras(lojaId: string): RegraCalculo[] {
    // TODO: Implementar quando tivermos tabela de regras
    // Por enquanto, retorna regras padrão
    const regrasPadrao: RegraCalculo[] = [
      {
        id: 'regra-001',
        nome: 'Validação de Insumos',
        tipo: 'validacao',
        condicao: 'insumos_obrigatorios',
        acao: 'validar_quantidade',
        parametros: { quantidade_minima: 1 },
        ordem: 1,
        ativo: true,
        loja_id: lojaId,
      },
      {
        id: 'regra-002',
        nome: 'Margem de Lucro Mínima',
        tipo: 'calculo',
        condicao: 'margem_lucro',
        acao: 'aplicar_margem_minima',
        parametros: { margem_minima: 15 },
        ordem: 2,
        ativo: false,
        loja_id: lojaId,
      },
    ];

    this.logger.log(
      `📋 Carregadas ${regrasPadrao.length} regras para loja ${lojaId}`,
    );
    return regrasPadrao;
  }

  /**
   * Valida regras antes da execução
   * Validação em tempo real
   */
  private async validarRegras(
    regras: RegraCalculo[],
    contexto: ContextoCalculo,
  ): Promise<RegraCalculo[]> {
    const regrasParaExecutar: RegraCalculo[] = [];

    for (const regra of regras) {
      try {
        const validacao = await this.validarRegra(regra, contexto);
        if (validacao.valido) {
          regrasParaExecutar.push(regra);
        } else {
          this.logger.warn(
            `⚠️ Regra ${regra.nome}: ${validacao.erros.join(', ')}`,
          );
        }
      } catch (error: any) {
        this.logger.error(`Erro na regra ${regra.nome}: ${error.message}`);
      }
    }

    this.logger.log(
      `✅ ${regrasParaExecutar.length}/${regras.length} regras para execução`,
    );
    return regrasParaExecutar;
  }

  /**
   * Valida uma regra específica
   */
  private validarRegra(
    regra: RegraCalculo,
    contexto: ContextoCalculo,
  ): ValidationResult {
    const erros: string[] = [];
    const avisos: string[] = [];

    // Validação básica da regra
    if (!regra.ativo) {
      return { valido: false, erros: ['Regra inativa'], avisos: [] };
    }

    if (!regra.condicao || !regra.acao) {
      erros.push('Regra mal configurada: condição ou ação vazia');
    }

    // Validação específica por tipo
    switch (regra.tipo) {
      case 'validacao': {
        const condicaoValida = this.validarCondicaoValidacao(regra, contexto);
        if (!condicaoValida) {
          erros.push('Condição de validação não atendida');
        }
        break;
      }
      case 'calculo': {
        const condicaoCalculo = this.validarCondicaoCalculo(regra, contexto);
        if (!condicaoCalculo) {
          erros.push('Condição de cálculo não atendida');
        }
        break;
      }
      case 'transformacao':
        if (!this.validarCondicaoTransformacao(regra, contexto)) {
          erros.push('Condição de transformação não atendida');
        }
        break;
      default:
        erros.push(`Tipo de regra inválido: ${regra.tipo}`);
    }

    return {
      valido: erros.length === 0,
      erros,
      avisos,
    };
  }

  /**
   * Valida condição de validação
   */
  private validarCondicaoValidacao(
    regra: RegraCalculo,
    contexto: ContextoCalculo,
  ): boolean {
    switch (regra.condicao) {
      case 'insumos_obrigatorios':
        if (!contexto.produtos || contexto.produtos.length === 0) {
          return false;
        }
        return contexto.produtos.every(
          (p) => p.insumos && p.insumos.length > 0,
        );
      case 'quantidade_valida':
        if (!contexto.produtos || contexto.produtos.length === 0) {
          return false;
        }
        return contexto.produtos.every((p) => p.quantidade > 0);
      default:
        return true;
    }
  }

  /**
   * Valida condição de cálculo
   */
  private validarCondicaoCalculo(
    regra: RegraCalculo,
    contexto: ContextoCalculo,
  ): boolean {
    switch (regra.condicao) {
      case 'margem_lucro':
        if (
          !contexto.configuracoes ||
          contexto.configuracoes.margem_lucro_padrao == null ||
          !Number.isFinite(
            Number(contexto.configuracoes.margem_lucro_padrao),
          ) ||
          contexto.configuracoes.margem_lucro_padrao < 0
        ) {
          return false;
        }
        return true;
      case 'impostos_configurados':
        if (
          !contexto.configuracoes ||
          contexto.configuracoes.impostos_padrao == null ||
          !Number.isFinite(Number(contexto.configuracoes.impostos_padrao)) ||
          contexto.configuracoes.impostos_padrao < 0
        ) {
          return false;
        }
        return true;
      default:
        return true;
    }
  }

  /**
   * Valida condição de transformação
   */
  private validarCondicaoTransformacao(
    _regra: RegraCalculo,
    _contexto: ContextoCalculo,
  ): boolean {
    // Por enquanto, sempre válido
    return true;
  }

  /**
   * Executa regras validadas
   * Auditoria completa de todas as regras aplicadas
   */
  private async executarRegras(
    regras: RegraCalculo[],
    contexto: ContextoCalculo,
  ): Promise<ResultadoRegras> {
    const regrasAplicadas: RegraCalculo[] = [];
    const erros: string[] = [];
    const avisos: string[] = [];
    let dadosTransformados = { ...contexto };

    // Ordenar regras por ordem
    const regrasOrdenadas = regras.sort((a, b) => a.ordem - b.ordem);

    for (const regra of regrasOrdenadas) {
      try {
        this.logger.log(`⚡ Executando regra: ${regra.nome}`);

        // Aplicar regra
        const resultado = await this.aplicarRegra(regra, dadosTransformados);

        if (resultado.sucesso) {
          regrasAplicadas.push(regra);
          dadosTransformados = resultado.dados;
          this.logger.log(`✅ Regra ${regra.nome} aplicada com sucesso`);
        } else {
          avisos.push(`Falha na regra ${regra.nome}: ${resultado.erro}`);
        }
      } catch (error: any) {
        const erroMsg = `Erro na execução da regra ${regra.nome}: ${error.message}`;
        erros.push(erroMsg);
        this.logger.error(erroMsg, error.stack);
      }
    }

    return {
      regras_aplicadas: regrasAplicadas,
      resultado_validacao: erros.length === 0,
      erros,
      avisos,
      dados_transformados: dadosTransformados,
    };
  }

  /**
   * Aplica uma regra específica
   */
  private async aplicarRegra(
    regra: RegraCalculo,
    dados: any,
  ): Promise<{
    sucesso: boolean;
    dados: any;
    erro?: string;
  }> {
    try {
      switch (regra.acao) {
        case 'validar_quantidade':
          return this.validarQuantidade(regra, dados);
        case 'aplicar_margem_minima':
          return this.aplicarMargemMinima(regra, dados);
        default:
          return {
            sucesso: false,
            dados,
            erro: `Ação não implementada: ${regra.acao}`,
          };
      }
    } catch (error: any) {
      return {
        sucesso: false,
        dados,
        erro: error.message,
      };
    }
  }

  /**
   * Valida quantidade mínima
   */
  private validarQuantidade(
    regra: RegraCalculo,
    dados: any,
  ): {
    sucesso: boolean;
    dados: any;
    erro?: string;
  } {
    const quantidadeMinima = regra.parametros.quantidade_minima || 1;

    // Verificar se há produtos
    if (!dados.produtos || dados.produtos.length === 0) {
      return {
        sucesso: false,
        dados,
        erro: 'Nenhum produto informado',
      };
    }

    // Verificar se algum produto tem quantidade menor que o mínimo
    if (dados.produtos.some((p: any) => p.quantidade < quantidadeMinima)) {
      return {
        sucesso: false,
        dados,
        erro: `Quantidade mínima não atendida: ${quantidadeMinima}`,
      };
    }

    return { sucesso: true, dados };
  }

  /**
   * Aplica margem mínima
   */
  private aplicarMargemMinima(
    regra: RegraCalculo,
    dados: any,
  ): {
    sucesso: boolean;
    dados: any;
    erro?: string;
  } {
    const margemMinima = regra.parametros.margem_minima || 15;

    // Verificar se há configurações
    if (!dados.configuracoes) {
      return {
        sucesso: false,
        dados,
        erro: 'Configurações não informadas',
      };
    }

    // Aplicar margem mínima se necessário
    if (dados.configuracoes.margem_lucro_padrao < margemMinima) {
      dados.configuracoes.margem_lucro_padrao = margemMinima;
    }

    return { sucesso: true, dados };
  }

  /**
   * Obtém estatísticas das regras
   */
  async obterEstatisticasRegras(lojaId: string): Promise<{
    total_regras: number;
    regras_ativas: number;
    regras_por_tipo: Record<string, number>;
  }> {
    try {
      const regras = this.carregarRegras(lojaId);

      const regrasAtivas = regras.filter((r) => r.ativo);
      const regrasPorTipo = regras.reduce(
        (acc, regra) => {
          acc[regra.tipo] = (acc[regra.tipo] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      return {
        total_regras: regras.length,
        regras_ativas: regrasAtivas.length,
        regras_por_tipo: regrasPorTipo,
      };
    } catch (error: any) {
      this.logger.error(`❌ Erro ao obter estatísticas: ${error.message}`);
      return {
        total_regras: 0,
        regras_ativas: 0,
        regras_por_tipo: {},
      };
    }
  }
}
