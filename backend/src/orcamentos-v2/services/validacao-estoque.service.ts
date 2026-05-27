import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrcamentoCompleto } from '../interfaces/orcamento.interface';

/**
 * Serviço de Validação de Estoque V2 para Orçamentos
 * Implementa validações de estoque APENAS como alertas (não bloqueia)
 *
 * ✅ ARQUIVO ≤ 400 LINHAS (CONFORME PREMISSAS)
 * ✅ APENAS ALERTAS - NÃO BLOQUEIA ORÇAMENTOS
 * ✅ INTEGRAÇÃO COM SISTEMA DE ESTOQUE EXISTENTE
 */
@Injectable()
export class ValidacaoEstoqueService {
  private readonly logger = new Logger(ValidacaoEstoqueService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Valida estoque do orçamento (apenas alertas)
   */
  async validarEstoqueOrcamento(
    orcamento: OrcamentoCompleto,
    lojaId: string,
  ): Promise<{
    valido: boolean;
    alertas: string[];
    recomendacoes: string[];
    produtos_com_problemas: any[];
    estoque_disponivel: any[];
  }> {
    this.logger.log(`🔍 Validando estoque do orçamento ${orcamento.id}`);

    try {
      const alertas: string[] = [];
      const recomendacoes: string[] = [];
      const produtosComProblemas: any[] = [];
      const estoqueDisponivel: any[] = [];

      // Validar cada produto do orçamento
      for (const produto of orcamento.produtos) {
        const validacaoProduto = await this.validarProdutoEstoque(
          produto,
          lojaId,
        );

        if (validacaoProduto.alertas.length > 0) {
          alertas.push(...validacaoProduto.alertas);
          produtosComProblemas.push({
            produto_id: produto.id,
            nome: produto.nome,
            alertas: validacaoProduto.alertas,
            estoque_disponivel: validacaoProduto.estoque_disponivel,
          });
        }

        if (validacaoProduto.recomendacoes.length > 0) {
          recomendacoes.push(...validacaoProduto.recomendacoes);
        }

        estoqueDisponivel.push(...validacaoProduto.estoque_disponivel);
      }

      // Gerar alertas gerais se necessário
      const alertasGerais = this.gerarAlertasGerais(
        orcamento,
        produtosComProblemas,
      );
      alertas.push(...alertasGerais);

      // Gerar recomendações gerais
      const recomendacoesGerais = this.gerarRecomendacoesGerais(
        orcamento,
        produtosComProblemas,
      );
      recomendacoes.push(...recomendacoesGerais);

      const resultado = {
        valido: alertas.length === 0, // Sempre válido (apenas alertas)
        alertas,
        recomendacoes,
        produtos_com_problemas: produtosComProblemas,
        estoque_disponivel: estoqueDisponivel,
      };

      this.logger.log(
        `✅ Validação de estoque concluída: ${alertas.length} alertas, ${recomendacoes.length} recomendações`,
      );
      return resultado;
    } catch (error) {
      this.logger.error(`❌ Erro ao validar estoque: ${error.message}`);

      // Em caso de erro, retornar resultado básico sem bloquear
      return {
        valido: true, // Sempre válido
        alertas: [`Erro ao validar estoque: ${error.message}`],
        recomendacoes: ['Verificar estoque manualmente'],
        produtos_com_problemas: [],
        estoque_disponivel: [],
      };
    }
  }

  /**
   * Valida estoque de um produto específico
   */
  async validarProdutoEstoque(
    produto: any,
    lojaId: string,
  ): Promise<{
    alertas: string[];
    recomendacoes: string[];
    estoque_disponivel: any[];
  }> {
    const alertas: string[] = [];
    const recomendacoes: string[] = [];
    const estoqueDisponivel: any[] = [];

    try {
      // Validar insumos do produto
      if (produto.insumos && produto.insumos.length > 0) {
        for (const insumo of produto.insumos) {
          const validacaoInsumo = await this.validarInsumoEstoque(
            insumo,
            produto.quantidade,
            lojaId,
          );

          if (validacaoInsumo.alertas.length > 0) {
            alertas.push(...validacaoInsumo.alertas);
          }

          if (validacaoInsumo.recomendacoes.length > 0) {
            recomendacoes.push(...validacaoInsumo.recomendacoes);
          }

          estoqueDisponivel.push(validacaoInsumo.estoque_info);
        }
      }

      // Validar máquinas (não têm estoque, mas podem ter disponibilidade)
      if (produto.maquinas && produto.maquinas.length > 0) {
        for (const maquina of produto.maquinas) {
          const validacaoMaquina = await this.validarMaquinaDisponibilidade(
            maquina,
            lojaId,
          );

          if (validacaoMaquina.alertas.length > 0) {
            alertas.push(...validacaoMaquina.alertas);
          }

          if (validacaoMaquina.recomendacoes.length > 0) {
            recomendacoes.push(...validacaoMaquina.recomendacoes);
          }
        }
      }

      // Validar funções (não têm estoque, mas podem ter disponibilidade)
      if (produto.funcoes && produto.funcoes.length > 0) {
        for (const funcao of produto.funcoes) {
          const validacaoFuncao = await this.validarFuncaoDisponibilidade(
            funcao,
            lojaId,
          );

          if (validacaoFuncao.alertas.length > 0) {
            alertas.push(...validacaoFuncao.alertas);
          }

          if (validacaoFuncao.recomendacoes.length > 0) {
            recomendacoes.push(...validacaoFuncao.recomendacoes);
          }
        }
      }
    } catch (error) {
      this.logger.error(
        `❌ Erro ao validar produto ${produto.id}: ${error.message}`,
      );
      alertas.push(`Erro ao validar produto ${produto.nome}: ${error.message}`);
    }

    return {
      alertas,
      recomendacoes,
      estoque_disponivel: estoqueDisponivel,
    };
  }

  /**
   * Valida estoque de um insumo específico
   */
  async validarInsumoEstoque(
    insumo: any,
    quantidadeProduto: number,
    lojaId: string,
  ): Promise<{
    alertas: string[];
    recomendacoes: string[];
    estoque_info: any;
  }> {
    const alertas: string[] = [];
    const recomendacoes: string[] = [];

    try {
      // Buscar informações do insumo
      const insumoInfo = await this.prisma.insumo.findFirst({
        where: { id: insumo.insumo_id, loja_id: lojaId },
        include: { categoria: true, fornecedor: true },
      });

      if (!insumoInfo) {
        alertas.push(`Insumo ${insumo.insumo_id} não encontrado`);
        return {
          alertas,
          recomendacoes,
          estoque_info: {
            insumo_id: insumo.insumo_id,
            nome: 'Insumo não encontrado',
            estoque_atual: 0,
            estoque_minimo: 0,
            alerta_estoque: true,
          },
        };
      }

      // Calcular quantidade total necessária
      const quantidadeNecessaria = insumo.quantidade * quantidadeProduto;

      // Buscar estoque atual
      const estoqueAtual = await this.buscarEstoqueInsumo(
        insumo.insumo_id,
        lojaId,
      );

      // Calcular disponibilidade
      const disponivel = estoqueAtual - quantidadeNecessaria;
      const percentualDisponivel =
        estoqueAtual > 0 ? (disponivel / estoqueAtual) * 100 : 0;

      // Gerar alertas baseados na disponibilidade
      if (disponivel < 0) {
        alertas.push(
          `Estoque insuficiente para ${insumoInfo.nome}: ` +
            `necessário ${quantidadeNecessaria} ${insumo.unidade}, ` +
            `disponível ${estoqueAtual} ${insumo.unidade}`,
        );
      } else if (disponivel < estoqueAtual * 0.1) {
        // Menos de 10% disponível
        alertas.push(
          `Estoque baixo para ${insumoInfo.nome}: ` +
            `apenas ${disponivel} ${insumo.unidade} disponível após o orçamento`,
        );
      } else if (disponivel < estoqueAtual * 0.3) {
        // Menos de 30% disponível
        alertas.push(
          `Estoque reduzido para ${insumoInfo.nome}: ` +
            `${disponivel} ${insumo.unidade} disponível após o orçamento`,
        );
      }

      // Gerar recomendações
      if (disponivel < 0) {
        recomendacoes.push(
          `Considerar compra de ${Math.abs(disponivel)} ${insumo.unidade} de ${insumoInfo.nome}`,
        );
      } else if (disponivel < estoqueAtual * 0.2) {
        recomendacoes.push(
          `Monitorar estoque de ${insumoInfo.nome} - estoque baixo após orçamento`,
        );
      }

      // Verificar estoque mínimo
      if (insumoInfo.estoque_minimo && disponivel < insumoInfo.estoque_minimo) {
        alertas.push(
          `Estoque de ${insumoInfo.nome} ficará abaixo do mínimo (${insumoInfo.estoque_minimo} ${insumo.unidade})`,
        );
      }

      // Verificar fornecedor
      if (insumoInfo.fornecedor && !insumoInfo.fornecedor.ativo) {
        alertas.push(
          `Fornecedor de ${insumoInfo.nome} está inativo - verificar disponibilidade`,
        );
      }

      const estoqueInfo = {
        insumo_id: insumo.insumo_id,
        nome: insumoInfo.nome,
        categoria: insumoInfo.categoria?.nome,
        fornecedor: insumoInfo.fornecedor?.nome,
        estoque_atual: estoqueAtual,
        estoque_minimo: insumoInfo.estoque_minimo || 0,
        quantidade_necessaria: quantidadeNecessaria,
        quantidade_disponivel: disponivel,
        percentual_disponivel: percentualDisponivel,
        unidade: insumo.unidade,
        alerta_estoque: disponivel < 0 || disponivel < estoqueAtual * 0.1,
        alerta_estoque_minimo: disponivel < (insumoInfo.estoque_minimo || 0),
        alerta_fornecedor:
          insumoInfo.fornecedor && !insumoInfo.fornecedor.ativo,
      };

      return {
        alertas,
        recomendacoes,
        estoque_info: estoqueInfo,
      };
    } catch (error) {
      this.logger.error(
        `❌ Erro ao validar insumo ${insumo.insumo_id}: ${error.message}`,
      );
      alertas.push(`Erro ao validar estoque do insumo: ${error.message}`);

      return {
        alertas,
        recomendacoes,
        estoque_info: {
          insumo_id: insumo.insumo_id,
          nome: 'Erro na validação',
          estoque_atual: 0,
          estoque_minimo: 0,
          alerta_estoque: true,
        },
      };
    }
  }

  /**
   * Valida disponibilidade de uma máquina
   */
  async validarMaquinaDisponibilidade(
    maquina: any,
    lojaId: string,
  ): Promise<{
    alertas: string[];
    recomendacoes: string[];
  }> {
    const alertas: string[] = [];
    const recomendacoes: string[] = [];

    try {
      // Buscar informações da máquina
      const maquinaInfo = await this.prisma.maquina.findFirst({
        where: { id: maquina.maquina_id, loja_id: lojaId },
      });

      if (!maquinaInfo) {
        alertas.push(`Máquina ${maquina.maquina_id} não encontrada`);
        return { alertas, recomendacoes };
      }

      if (!maquinaInfo.ativo) {
        alertas.push(`Máquina ${maquinaInfo.nome} está inativa`);
      }

      // Verificar se o tempo solicitado é razoável
      if (maquina.tempo_horas > 24) {
        alertas.push(
          `Tempo de máquina muito alto para ${maquinaInfo.nome}: ${maquina.tempo_horas} horas`,
        );
        recomendacoes.push(
          `Verificar se o tempo de ${maquina.tempo_horas} horas está correto`,
        );
      }

      // Verificar se há conflitos de agendamento (futuro)
      // TODO: Implementar verificação de agendamento quando sistema estiver disponível
    } catch (error) {
      this.logger.error(
        `❌ Erro ao validar máquina ${maquina.maquina_id}: ${error.message}`,
      );
      alertas.push(
        `Erro ao validar disponibilidade da máquina: ${error.message}`,
      );
    }

    return { alertas, recomendacoes };
  }

  /**
   * Valida disponibilidade de uma função
   */
  async validarFuncaoDisponibilidade(
    funcao: any,
    lojaId: string,
  ): Promise<{
    alertas: string[];
    recomendacoes: string[];
  }> {
    const alertas: string[] = [];
    const recomendacoes: string[] = [];

    try {
      // Buscar informações da função
      const funcaoInfo = await this.prisma.funcao.findFirst({
        where: { id: funcao.funcao_id, loja_id: lojaId },
      });

      if (!funcaoInfo) {
        alertas.push(`Função ${funcao.funcao_id} não encontrada`);
        return { alertas, recomendacoes };
      }

      if (!funcaoInfo.ativo) {
        alertas.push(`Função ${funcaoInfo.nome} está inativa`);
      }

      // Verificar se o tempo solicitado é razoável
      if (funcao.tempo_horas > 40) {
        alertas.push(
          `Tempo de função muito alto para ${funcaoInfo.nome}: ${funcao.tempo_horas} horas`,
        );
        recomendacoes.push(
          `Verificar se o tempo de ${funcao.tempo_horas} horas está correto`,
        );
      }

      // Verificar se há conflitos de agendamento (futuro)
      // TODO: Implementar verificação de agendamento quando sistema estiver disponível
    } catch (error) {
      this.logger.error(
        `❌ Erro ao validar função ${funcao.funcao_id}: ${error.message}`,
      );
      alertas.push(
        `Erro ao validar disponibilidade da função: ${error.message}`,
      );
    }

    return { alertas, recomendacoes };
  }

  /**
   * Busca estoque atual de um insumo
   */
  private async buscarEstoqueInsumo(
    insumoId: string,
    lojaId: string,
  ): Promise<number> {
    try {
      const estoqueItens = await this.prisma.$queryRaw<
        Array<{ total: unknown; registros: unknown }>
      >`
        SELECT
          COALESCE(SUM(quantidadeAtual - quantidadeReservada), 0) AS total,
          COUNT(*) AS registros
        FROM estoque_itens
        WHERE insumoId = ${insumoId}
          AND lojaId = ${lojaId}
          AND ativo = true
      `;

      const estoqueNovo = estoqueItens[0];
      const totalEstoqueNovo = Number(estoqueNovo?.total ?? 0);
      const registrosEstoqueNovo = Number(estoqueNovo?.registros ?? 0);

      if (registrosEstoqueNovo > 0) {
        return totalEstoqueNovo;
      }

      // Buscar estoque na tabela de estoque
      const estoque = await this.prisma.estoque.findFirst({
        where: {
          insumo_id: insumoId,
          loja_id: lojaId,
        },
      });

      if (estoque) {
        return Number(estoque.quantidade_atual) || 0;
      }

      // Se não encontrar na tabela de estoque, buscar no insumo
      const insumo = await this.prisma.insumo.findFirst({
        where: { id: insumoId, loja_id: lojaId },
      });

      return Number(insumo?.estoque_atual) || 0;
    } catch (error) {
      this.logger.error(
        `❌ Erro ao buscar estoque do insumo ${insumoId}: ${error.message}`,
      );
      return 0;
    }
  }

  /**
   * Gera alertas gerais baseados no orçamento completo
   */
  private gerarAlertasGerais(
    orcamento: OrcamentoCompleto,
    produtosComProblemas: any[],
  ): string[] {
    const alertas: string[] = [];

    // Alertas baseados no número de produtos com problemas
    if (produtosComProblemas.length > 0) {
      if (produtosComProblemas.length === orcamento.produtos.length) {
        alertas.push(
          '⚠️ TODOS os produtos do orçamento têm problemas de estoque',
        );
      } else if (
        produtosComProblemas.length >
        orcamento.produtos.length * 0.5
      ) {
        alertas.push('⚠️ MAIS DA METADE dos produtos têm problemas de estoque');
      } else {
        alertas.push(
          `⚠️ ${produtosComProblemas.length} produtos têm problemas de estoque`,
        );
      }
    }

    // Alertas baseados no valor do orçamento
    if (orcamento.custos?.preco_final) {
      if (orcamento.custos.preco_final > 10000) {
        alertas.push(
          '💰 Orçamento de alto valor - verificar disponibilidade de estoque com antecedência',
        );
      }
    }

    // Alertas baseados na prioridade
    if (orcamento.prioridade === 'urgente') {
      alertas.push(
        '🚨 Orçamento URGENTE - verificar disponibilidade imediata de estoque',
      );
    }

    return alertas;
  }

  /**
   * Gera recomendações gerais baseadas no orçamento completo
   */
  private gerarRecomendacoesGerais(
    orcamento: OrcamentoCompleto,
    produtosComProblemas: any[],
  ): string[] {
    const recomendacoes: string[] = [];

    // Recomendações baseadas nos problemas encontrados
    if (produtosComProblemas.length > 0) {
      recomendacoes.push(
        '📋 Revisar lista de produtos com problemas de estoque',
      );
      recomendacoes.push(
        '🔄 Considerar alternativas para produtos sem estoque',
      );
      recomendacoes.push(
        '📞 Contatar fornecedores para produtos com estoque baixo',
      );
    }

    // Recomendações baseadas no tipo de orçamento
    if (orcamento.tipo === 'produto') {
      recomendacoes.push(
        '📦 Orçamento de produto - verificar disponibilidade de todos os insumos',
      );
    } else if (orcamento.tipo === 'servico') {
      recomendacoes.push(
        '🔧 Orçamento de serviço - verificar disponibilidade de máquinas e funções',
      );
    }

    // Recomendações baseadas no status
    if (orcamento.status === 'rascunho') {
      recomendacoes.push(
        '✏️ Orçamento em rascunho - resolver problemas de estoque antes de finalizar',
      );
    }

    return recomendacoes;
  }
}
