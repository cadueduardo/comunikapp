/**
 * Serviço de Validações Automáticas
 * Executa regras de validação em OSs
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RegrasValidacaoService } from './regras-validacao.service';
import { ExecucaoRegraService } from './execucao-regra.service';
import {
  ResultadoValidacao,
  DashboardValidacoes,
  RegraValidacao,
} from '../interfaces/validacao.interface';

@Injectable()
export class ValidacoesAutomaticasService {
  private readonly logger = new Logger(ValidacoesAutomaticasService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly regrasService: RegrasValidacaoService,
    private readonly execucaoService: ExecucaoRegraService,
  ) {}

  /**
   * Executa validações automáticas em uma OS
   */
  async validarOS(
    osId: string,
    lojaId: string,
    regraIds?: string[],
    modoTeste: boolean = false,
  ): Promise<ResultadoValidacao> {
    this.logger.log(
      `Iniciando validação da OS ${osId} (modo teste: ${modoTeste})`,
    );

    try {
      // Buscar OS com dados necessários
      const os = await this.prisma.ordemServico.findUnique({
        where: { id: osId },
        include: {
          cliente: { select: { id: true, nome: true } },
          orcamento: {
            include: {
              produtos: {
                include: {
                  insumos: {
                    include: { insumo: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!os) {
        throw new Error('OS não encontrada');
      }

      // Buscar regras ativas
      const regras = await this.regrasService.obterRegrasAtivas(
        lojaId,
        regraIds,
      );

      const resultados: ResultadoValidacao = {
        valida: true,
        pode_aprovar_automaticamente: true,
        correcoes_necessarias: [],
        alertas: [],
        acoes: [],
        execucoes: [],
      };

      // Executar cada regra
      for (const regra of regras) {
        const inicio = Date.now();

        try {
          const resultado = await this.executarRegra(regra, os);
          const tempoExecucao = Date.now() - inicio;

          // Salvar execução (se não for modo teste)
          if (!modoTeste) {
            await this.execucaoService.registrarExecucao({
              regra_id: regra.id,
              os_id: osId,
              resultado: resultado.tipo as
                | 'SUCESSO'
                | 'ERRO'
                | 'ALERTA'
                | 'BLOQUEIO',
              mensagem: resultado.mensagem,
              dados_execucao: resultado.dados,
              tempo_execucao: tempoExecucao,
            });
          }

          resultados.execucoes.push({
            regra_id: regra.id,
            regra_nome: regra.nome,
            resultado: resultado.tipo,
            mensagem: resultado.mensagem,
            tempo_execucao: tempoExecucao,
          });

          // Processar resultado
          if (resultado.tipo === 'ERRO' || resultado.tipo === 'BLOQUEIO') {
            resultados.valida = false;
            resultados.pode_aprovar_automaticamente = false;
            resultados.correcoes_necessarias.push(resultado.mensagem);
            resultados.acoes.push(resultado.acao);
          } else if (resultado.tipo === 'ALERTA') {
            resultados.alertas.push(resultado.mensagem);
            resultados.acoes.push(resultado.acao);
          }
        } catch (error) {
          this.logger.error(`Erro ao executar regra ${regra.nome}:`, error);

          resultados.valida = false;
          resultados.pode_aprovar_automaticamente = false;
          const mensagemErro = `Falha ao executar a regra: ${
            error instanceof Error ? error.message : 'erro desconhecido'
          }`;
          resultados.correcoes_necessarias.push(mensagemErro);
          resultados.execucoes.push({
            regra_id: regra.id,
            regra_nome: regra.nome,
            resultado: 'ERRO',
            mensagem: mensagemErro,
            tempo_execucao: Date.now() - inicio,
          });
        }
      }

      this.logger.log(
        `Validação concluída: ${resultados.valida ? 'VÁLIDA' : 'INVÁLIDA'}`,
      );
      return resultados;
    } catch (error) {
      this.logger.error(`Erro na validação da OS ${osId}:`, error);
      throw error;
    }
  }

  /**
   * Executa uma regra específica.
   *
   * Semântica das condições: descrevem o **problema** (ex.: `cliente_id is_null`).
   * Se a condição for verdadeira → aplica o tipo da regra (BLOQUEIO/ALERTA).
   * Se for falsa → SUCESSO.
   */
  private async executarRegra(regra: RegraValidacao, os: any) {
    const condicoes = this.normalizarCondicoes(regra.condicoes);
    const acoes = this.normalizarAcoes(regra.acoes);

    if (!condicoes.campo || !condicoes.operador) {
      throw new Error(
        `Regra "${regra.nome}" sem campo/operador nas condições`,
      );
    }

    const campo = this.obterValorCampo(os, condicoes.campo);
    const valor = this.calcularValor(condicoes.valor, os);

    const problemaDetectado = this.avaliarCondicao(
      campo,
      condicoes.operador,
      valor,
    );

    if (problemaDetectado) {
      const tipoFalha = this.mapearTipoFalha(regra.tipo);
      return {
        tipo: tipoFalha,
        mensagem:
          regra.mensagem ||
          condicoes.mensagem_erro ||
          condicoes.mensagem_alerta ||
          'Regra de validação não atendida',
        acao: acoes,
        dados: { campo, valor, operador: condicoes.operador },
      };
    }

    return {
      tipo: 'SUCESSO',
      mensagem: 'Regra atendida',
      dados: { campo, valor },
    };
  }

  private mapearTipoFalha(tipoRegra: string): string {
    const tipo = (tipoRegra || '').toUpperCase();
    if (tipo === 'BLOQUEIO') return 'BLOQUEIO';
    if (tipo === 'ALERTA' || tipo === 'INFO') return 'ALERTA';
    if (tipo === 'VALIDACAO') return 'ERRO';
    return 'ALERTA';
  }

  private normalizarCondicoes(raw: unknown): {
    campo?: string;
    operador?: string;
    valor?: unknown;
    mensagem_erro?: string;
    mensagem_alerta?: string;
  } {
    if (raw == null) return {};
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : {};
      } catch {
        return {};
      }
    }
    if (typeof raw === 'object') {
      return raw as Record<string, unknown>;
    }
    return {};
  }

  private normalizarAcoes(raw: unknown): unknown {
    if (raw == null) return null;
    if (typeof raw === 'string') {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    }
    return raw;
  }

  /**
   * Obtém valor de um campo na OS
   */
  private obterValorCampo(os: any, campo: string): any {
    if (!campo || typeof campo !== 'string') {
      return undefined;
    }

    // Aliases de caminhos legados / defaults do onboarding (antes dos calculados)
    const aliases: Record<string, string> = {
      'os.responsavel_id': 'responsavel_id',
      'os.cliente_id': 'cliente_id',
    };
    const caminho = aliases[campo] || campo;

    // Campos calculados dinamicamente (cliente, responsável efetivo, etc.)
    const camposCalculados = this.calcularCamposDinamicos(os);

    if (Object.prototype.hasOwnProperty.call(camposCalculados, caminho)) {
      return camposCalculados[caminho];
    }
    if (Object.prototype.hasOwnProperty.call(camposCalculados, campo)) {
      return camposCalculados[campo];
    }

    if (caminho === 'orcamento.cliente_id') {
      return os?.cliente_id ?? os?.orcamento?.cliente_id ?? null;
    }

    // Campos diretos da OS
    const partes = caminho.split('.');
    let valor = os;

    for (const c of partes) {
      valor = valor?.[c];
      if (valor === undefined) break;
    }

    return valor;
  }

  /**
   * Calcula campos dinâmicos baseados nos dados da OS
   */
  private calcularCamposDinamicos(os: any): Record<string, any> {
    const campos: Record<string, any> = {};

    // Status da arte
    campos['status_arte'] = os.arquivo_arte ? 'APROVADA' : 'PENDENTE';

    // Responsável operacional: titular da OS ou quem criou (não exige UI dedicada)
    const responsavelEfetivo = os.responsavel_id || os.criado_por || null;
    campos['responsavel_id'] = responsavelEfetivo;
    campos['tem_responsavel'] = responsavelEfetivo;

    // Cliente na OS ou no orçamento vinculado
    campos['cliente_id'] = os.cliente_id ?? os.orcamento?.cliente_id ?? null;

    // Estoque mínimo: null se algum insumo do orçamento não tiver mínimo cadastrado
    const insumosOrcamento =
      os.orcamento?.produtos?.flatMap((p: any) => p.insumos || []) || [];
    const algumSemMinimo = insumosOrcamento.some(
      (item: any) =>
        item?.insumo &&
        (item.insumo.estoque_minimo === null ||
          item.insumo.estoque_minimo === undefined),
    );
    campos['insumo.estoque_minimo'] = algumSemMinimo
      ? null
      : insumosOrcamento[0]?.insumo?.estoque_minimo ?? 0;

    // Dados completos
    campos['dados_completos'] = !!(
      os.nome_servico &&
      os.descricao &&
      os.quantidade &&
      Number(os.quantidade) > 0 &&
      os.parametros_tecnicos
    );

    // Especificações técnicas completas
    campos['especificacoes_tecnicas_completas'] = !!(
      os.parametros_tecnicos &&
      String(os.parametros_tecnicos).trim().length > 0
    );

    // Dias até entrega
    if (os.data_prazo) {
      const hoje = new Date();
      const dataPrazo = new Date(os.data_prazo);
      campos['dias_ate_entrega'] = Math.ceil(
        (dataPrazo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24),
      );
    } else {
      campos['dias_ate_entrega'] = null;
    }

    // Percentual de desconto
    const valorTotal = os.orcamento?.valor_total || 0;
    const valorOriginal = os.orcamento?.valor_original || valorTotal;
    campos['percentual_desconto'] =
      valorOriginal > 0
        ? ((valorOriginal - valorTotal) / valorOriginal) * 100
        : 0;

    return campos;
  }

  /**
   * Calcula valor de uma expressão
   */
  private calcularValor(expressao: any, os: any): any {
    if (typeof expressao === 'number' || typeof expressao === 'boolean') {
      return expressao;
    }

    if (typeof expressao === 'string') {
      // Se for uma string simples (não expressão), retornar como está
      // Expressões matemáticas têm operadores: +, -, *, /, ()
      // Expressões de função têm parênteses: now(), date()
      const temOperadorMatematico = /[+\-*/()]/.test(expressao);

      if (!temOperadorMatematico) {
        // String simples como "APROVADA", "INADIMPLENTE", etc.
        return expressao;
      }

      // Expressão matemática ou função - avaliar
      try {
        return this.avaliarExpressao(expressao, os);
      } catch (error) {
        this.logger.warn(
          `Não foi possível avaliar expressão: ${expressao}. Retornando como string.`,
        );
        return expressao;
      }
    }

    return expressao;
  }

  /**
   * Avalia condição baseada no operador
   */
  private avaliarCondicao(campo: any, operador: string, valor: any): boolean {
    switch (operador) {
      case 'equals':
        return campo === valor;
      case 'greater_than':
        return campo > valor;
      case 'greater_than_or_equal':
        return campo >= valor;
      case 'less_than':
        return campo < valor;
      case 'less_than_or_equal':
        return campo <= valor;
      case 'contains':
        return campo?.includes(valor);
      case 'not_equals':
        return campo !== valor;
      case 'in':
        return Array.isArray(valor) && valor.includes(campo);
      case 'not_in':
        return Array.isArray(valor) && !valor.includes(campo);
      case 'is_null':
        return campo === null || campo === undefined;
      case 'is_not_null':
        return campo !== null && campo !== undefined;
      default:
        return false;
    }
  }

  /**
   * Avalia expressão matemática
   */
  private avaliarExpressao(expressao: string, os: any): number {
    try {
      // Substituir campos por valores
      let expr = expressao;
      const campos = expressao.match(/\w+(?:\.\w+)*/g) || [];

      for (const campo of campos) {
        const valor = this.obterValorCampo(os, campo);
        if (valor !== undefined) {
          expr = expr.replace(new RegExp(campo, 'g'), valor);
        }
      }

      // Avaliar expressão (usar biblioteca como mathjs em produção)
      return eval(expr);
    } catch (error) {
      this.logger.error(`Erro ao avaliar expressão ${expressao}:`, error);
      return 0;
    }
  }

  /**
   * Obtém dashboard de validações
   */
  async obterDashboard(lojaId: string): Promise<DashboardValidacoes> {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const [totalRegras, regrasAtivas, execucoesHoje, execucoesRecentes] =
      await Promise.all([
        this.prisma.regraValidacao.count({
          where: {
            OR: [{ loja_id: lojaId }, { loja_id: null }],
          },
        }),
        this.prisma.regraValidacao.count({
          where: {
            ativo: true,
            OR: [{ loja_id: lojaId }, { loja_id: null }],
          },
        }),
        this.prisma.execucaoRegra.count({
          where: {
            criado_em: { gte: hoje },
          },
        }),
        this.prisma.execucaoRegra.findMany({
          where: {
            criado_em: { gte: hoje },
          },
          take: 10,
          orderBy: { criado_em: 'desc' },
          include: {
            regra: {
              select: { nome: true },
            },
          },
        }),
      ]);

    // Calcular taxa de sucesso
    const sucessos = execucoesRecentes.filter(
      (e) => e.resultado === 'SUCESSO',
    ).length;
    const taxaSucesso =
      execucoesRecentes.length > 0
        ? (sucessos / execucoesRecentes.length) * 100
        : 0;

    // Regras por categoria
    const regrasPorCategoria = await this.prisma.regraValidacao.groupBy({
      by: ['categoria'],
      where: {
        OR: [{ loja_id: lojaId }, { loja_id: null }],
      },
      _count: {
        id: true,
        ativo: true,
      },
    });

    return {
      totalRegras,
      regrasAtivas,
      execucoesHoje,
      taxaSucesso: Math.round(taxaSucesso * 100) / 100,
      regrasPorCategoria: regrasPorCategoria.map((item) => ({
        categoria: item.categoria,
        total: item._count.id,
        ativas: item._count.ativo,
      })),
      execucoesRecentes: execucoesRecentes.map((e) => ({
        id: e.id,
        regra_id: e.regra_id,
        os_id: e.os_id || undefined,
        orcamento_id: e.orcamento_id || undefined,
        resultado: e.resultado as any,
        mensagem: e.mensagem || undefined,
        dados_execucao: e.dados_execucao ? JSON.parse(e.dados_execucao) : {},
        tempo_execucao: e.tempo_execucao || 0,
        criado_em: e.criado_em,
      })),
    };
  }
}
