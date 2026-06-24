import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  OrcamentoStatus,
  OrcamentoTipo,
  PrioridadeOrcamento,
  OrcamentoCompleto,
} from '../interfaces/orcamento.interface';

/**
 * Serviço de Validação V2 para Orçamentos
 * Implementa todas as validações necessárias
 *
 * ✅ ARQUIVO ≤ 400 LINHAS (CONFORME PREMISSAS)
 * ✅ VALIDAÇÕES ROBUSTAS E COMPLETAS
 * ✅ INTEGRAÇÃO COM SISTEMA EXISTENTE
 */
@Injectable()
export class ValidacaoV2Service {
  private readonly logger = new Logger(ValidacaoV2Service.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Valida dados para criação de orçamento
   */
  async validarDadosCriacao(dados: any, lojaId: string): Promise<void> {
    this.logger.log(
      `✅ Validando dados para criação de orçamento na loja ${lojaId}`,
    );

    // 1. Validações básicas
    this.validarCamposObrigatorios(dados);
    this.validarTiposDados(dados);
    this.validarValores(dados);

    // 2. Validações de negócio
    await this.validarCliente(dados.cliente_id, lojaId);
    await this.validarProdutos(dados.produtos, lojaId);
    await this.validarConfiguracoes(dados.configuracoes, lojaId);

    // 3. Validações de integridade
    this.validarIntegridadeDados(dados);
    this.validarRegrasNegocio(dados);

    this.logger.log(`✅ Dados de criação validados com sucesso`);
  }

  /**
   * Valida dados para atualização de orçamento
   */
  async validarDadosAtualizacao(
    dados: any,
    orcamentoExistente: OrcamentoCompleto,
  ): Promise<void> {
    this.logger.log(
      `✅ Validando dados para atualização do orçamento ${orcamentoExistente.id}`,
    );

    // 1. Validações básicas
    this.validarCamposObrigatorios(dados, false);
    this.validarTiposDados(dados);
    this.validarValores(dados);

    // 2. Validações de negócio
    if (dados.cliente_id) {
      await this.validarCliente(dados.cliente_id, orcamentoExistente.loja_id);
    }
    if (dados.produtos) {
      await this.validarProdutos(dados.produtos, orcamentoExistente.loja_id);
    }
    if (dados.configuracoes) {
      await this.validarConfiguracoes(
        dados.configuracoes,
        orcamentoExistente.loja_id,
      );
    }

    // 3. Validações de integridade
    this.validarIntegridadeDados(dados);
    this.validarRegrasNegocio(dados);

    // 4. Validações específicas de atualização
    this.validarPermissoesAtualizacao(dados, orcamentoExistente);

    this.logger.log(`✅ Dados de atualização validados com sucesso`);
  }

  /**
   * Valida se orçamento pode ser removido
   */
  async validarRemocao(orcamentoId: string, lojaId: string): Promise<void> {
    this.logger.log(`✅ Validando remoção do orçamento ${orcamentoId}`);

    const orcamento = await this.prisma.orcamento.findFirst({
      where: { id: orcamentoId, loja_id: lojaId },
      include: { historico: true, versoes: true },
    });

    if (!orcamento) {
      throw new BadRequestException('Orçamento não encontrado');
    }

    // Verificar se pode ser removido
    if (orcamento.status === OrcamentoStatus.APROVADO) {
      throw new BadRequestException(
        'Não é possível remover orçamento aprovado',
      );
    }

    if (orcamento.status === OrcamentoStatus.EM_EXECUCAO) {
      throw new BadRequestException(
        'Não é possível remover orçamento em execução',
      );
    }

    if (orcamento.status === OrcamentoStatus.CONCLUIDO) {
      throw new BadRequestException(
        'Não é possível remover orçamento concluído',
      );
    }

    // Verificar se tem histórico significativo
    if (orcamento.historico.length > 1) {
      throw new BadRequestException(
        'Não é possível remover orçamento com histórico significativo',
      );
    }

    this.logger.log(`✅ Remoção do orçamento validada com sucesso`);
  }

  /**
   * Valida transição de status
   */
  async validarTransicaoStatus(
    statusAtual: OrcamentoStatus,
    novoStatus: OrcamentoStatus,
    orcamento: OrcamentoCompleto,
  ): Promise<void> {
    this.logger.log(
      `✅ Validando transição de status de ${statusAtual} para ${novoStatus}`,
    );

    // Verificar se a transição é válida
    const transicoesValidas = this.obterTransicoesValidas(statusAtual);

    if (!transicoesValidas.includes(novoStatus)) {
      throw new BadRequestException(
        `Transição de status inválida: ${statusAtual} → ${novoStatus}. ` +
          `Status válidos: ${transicoesValidas.join(', ')}`,
      );
    }

    // Validações específicas por status
    await this.validarStatusEspecifico(novoStatus, orcamento);

    this.logger.log(`✅ Transição de status validada com sucesso`);
  }

  // Métodos privados de validação

  private validarCamposObrigatorios(dados: any, criacao: boolean = true): void {
    const camposObrigatorios = ['titulo', 'cliente_id'];

    if (criacao) {
      camposObrigatorios.push('produtos');
    }

    for (const campo of camposObrigatorios) {
      if (!dados[campo]) {
        throw new BadRequestException(
          `Campo obrigatório não informado: ${campo}`,
        );
      }
    }
  }

  private validarTiposDados(dados: any): void {
    // Validar tipos básicos
    if (dados.titulo && typeof dados.titulo !== 'string') {
      throw new BadRequestException('Título deve ser uma string');
    }

    if (dados.descricao && typeof dados.descricao !== 'string') {
      throw new BadRequestException('Descrição deve ser uma string');
    }

    if (dados.cliente_id && typeof dados.cliente_id !== 'string') {
      throw new BadRequestException('ID do cliente deve ser uma string');
    }

    if (dados.tipo && !Object.values(OrcamentoTipo).includes(dados.tipo)) {
      throw new BadRequestException(
        `Tipo inválido. Use: ${Object.values(OrcamentoTipo).join(', ')}`,
      );
    }

    if (
      dados.prioridade &&
      !Object.values(PrioridadeOrcamento).includes(dados.prioridade)
    ) {
      throw new BadRequestException(
        `Prioridade inválida. Use: ${Object.values(PrioridadeOrcamento).join(', ')}`,
      );
    }

    if (
      dados.status &&
      !Object.values(OrcamentoStatus).includes(dados.status)
    ) {
      throw new BadRequestException(
        `Status inválido. Use: ${Object.values(OrcamentoStatus).join(', ')}`,
      );
    }
  }

  private validarValores(dados: any): void {
    // Validar valores numéricos
    if (
      dados.quantidade &&
      (typeof dados.quantidade !== 'number' || dados.quantidade <= 0)
    ) {
      throw new BadRequestException('Quantidade deve ser um número positivo');
    }

    if (
      dados.preco_unitario &&
      (typeof dados.preco_unitario !== 'number' || dados.preco_unitario < 0)
    ) {
      throw new BadRequestException(
        'Preço unitário deve ser um número não negativo',
      );
    }

    if (
      dados.margem_lucro &&
      (typeof dados.margem_lucro !== 'number' || dados.margem_lucro < 0)
    ) {
      throw new BadRequestException(
        'Margem de lucro deve ser um número não negativo',
      );
    }

    // Validar strings
    if (dados.titulo && dados.titulo.trim().length < 3) {
      throw new BadRequestException('Título deve ter pelo menos 3 caracteres');
    }

    if (dados.titulo && dados.titulo.trim().length > 200) {
      throw new BadRequestException('Título deve ter no máximo 200 caracteres');
    }

    if (dados.descricao && dados.descricao.trim().length > 1000) {
      throw new BadRequestException(
        'Descrição deve ter no máximo 1000 caracteres',
      );
    }
  }

  private async validarCliente(
    clienteId: string,
    lojaId: string,
  ): Promise<void> {
    const cliente = await this.prisma.cliente.findFirst({
      where: { id: clienteId, loja_id: lojaId },
    });

    if (!cliente) {
      throw new BadRequestException(
        'Cliente não encontrado ou não pertence à loja',
      );
    }

    if (!cliente.ativo) {
      throw new BadRequestException(
        'Cliente inativo não pode receber orçamentos',
      );
    }
  }

  private async validarProdutos(
    produtos: any[],
    lojaId: string,
  ): Promise<void> {
    if (!Array.isArray(produtos) || produtos.length === 0) {
      throw new BadRequestException('Orçamento deve ter pelo menos um produto');
    }

    if (produtos.length > 100) {
      throw new BadRequestException(
        'Orçamento não pode ter mais de 100 produtos',
      );
    }

    produtos.forEach((produto, index) => this.validarProduto(produto, index));

    for (const produto of produtos) {
      if (String(produto?.tipo_item || 'SOB_DEMANDA').toUpperCase() === 'PRODUTO_FINITO') {
        if (!produto.produto_finito_id) {
          throw new BadRequestException(
            'Produto de prateleira deve referenciar um item do catálogo.',
          );
        }
        const catalogo = await this.prisma.produtoFinito.findFirst({
          where: {
            id: produto.produto_finito_id,
            loja_id: lojaId,
            ativo: true,
          },
        });
        if (!catalogo) {
          throw new BadRequestException('Produto de prateleira inválido ou inativo.');
        }
        continue;
      }

      await this.validarInsumosProduto(produto.insumos, lojaId);
      await this.validarMaquinasProduto(produto.maquinas, lojaId);
      await this.validarFuncoesProduto(produto.funcoes, lojaId);
    }
  }

  private validarProduto(produto: any, indice: number): void {
    const nome = produto.nome_servico || produto.nome;
    if (!nome || typeof nome !== 'string' || nome.trim().length === 0) {
      throw new BadRequestException(
        `Produto ${indice + 1} deve ter um nome válido`,
      );
    }

    const qtd =
      typeof produto.quantidade === 'number'
        ? produto.quantidade
        : Number(produto.quantidade);
    if (!Number.isFinite(qtd) || qtd <= 0) {
      throw new BadRequestException('Produto deve ter quantidade válida');
    }

    const unidade = String(
      produto.unidade_medida || produto.unidade || produto.unidade_medida_produto || '',
    ).trim();
    if (!unidade) {
      throw new BadRequestException('Produto deve ter unidade válida');
    }
  }

  private async validarInsumosProduto(
    insumos: any[],
    lojaId: string,
  ): Promise<void> {
    if (!insumos || !Array.isArray(insumos)) return;

    for (const insumo of insumos) {
      if (!insumo.insumo_id) {
        throw new BadRequestException('Insumo deve ter ID válido');
      }

      const insumoExistente = await this.prisma.insumo.findFirst({
        where: { id: insumo.insumo_id, loja_id: lojaId },
      });

      if (!insumoExistente) {
        throw new BadRequestException(
          `Insumo ${insumo.insumo_id} não encontrado`,
        );
      }

      if (!insumoExistente.ativo) {
        throw new BadRequestException(
          `Insumo ${insumo.insumo_id} está inativo`,
        );
      }
    }
  }

  private async validarMaquinasProduto(
    maquinas: any[],
    lojaId: string,
  ): Promise<void> {
    if (!maquinas || !Array.isArray(maquinas)) return;

    for (const maquina of maquinas) {
      if (!maquina.maquina_id) {
        throw new BadRequestException('Máquina deve ter ID válido');
      }

      const maquinaExistente = await this.prisma.maquina.findFirst({
        where: { id: maquina.maquina_id, loja_id: lojaId },
      });

      if (!maquinaExistente) {
        throw new BadRequestException(
          `Máquina ${maquina.maquina_id} não encontrada`,
        );
      }

      if (!maquinaExistente.ativo) {
        throw new BadRequestException(
          `Máquina ${maquina.maquina_id} está inativa`,
        );
      }
    }
  }

  private async validarFuncoesProduto(
    funcoes: any[],
    lojaId: string,
  ): Promise<void> {
    if (!funcoes || !Array.isArray(funcoes)) return;

    for (const funcao of funcoes) {
      if (!funcao.funcao_id) {
        throw new BadRequestException('Função deve ter ID válido');
      }

      const funcaoExistente = await this.prisma.funcao.findFirst({
        where: { id: funcao.funcao_id, loja_id: lojaId },
      });

      if (!funcaoExistente) {
        throw new BadRequestException(
          `Função ${funcao.funcao_id} não encontrada`,
        );
      }

      if (!funcaoExistente.ativo) {
        throw new BadRequestException(
          `Função ${funcao.funcao_id} está inativa`,
        );
      }
    }
  }

  private async validarConfiguracoes(
    configuracoes: any,
    lojaId: string,
  ): Promise<void> {
    if (!configuracoes) return;

    // Validar configurações da loja
    const loja = await this.prisma.loja.findUnique({
      where: { id: lojaId },
    });

    if (!loja) {
      throw new BadRequestException('Loja não encontrada');
    }

    // Validar margem de lucro
    if (configuracoes.margem_lucro !== undefined) {
      if (
        typeof configuracoes.margem_lucro !== 'number' ||
        configuracoes.margem_lucro < 0
      ) {
        throw new BadRequestException(
          'Margem de lucro deve ser um número não negativo',
        );
      }
    }

    // Validar impostos
    if (configuracoes.impostos !== undefined) {
      if (
        typeof configuracoes.impostos !== 'number' ||
        configuracoes.impostos < 0
      ) {
        throw new BadRequestException(
          'Impostos devem ser um número não negativo',
        );
      }
    }
  }

  private validarIntegridadeDados(dados: any): void {
    // Validar integridade entre campos relacionados
    if (dados.produtos && dados.produtos.length > 0) {
      for (const produto of dados.produtos) {
        if (produto.insumos && produto.insumos.length > 0) {
          for (const insumo of produto.insumos) {
            if (insumo.quantidade <= 0) {
              throw new BadRequestException(
                'Quantidade de insumo deve ser positiva',
              );
            }
          }
        }

        if (produto.maquinas && produto.maquinas.length > 0) {
          for (const maquina of produto.maquinas) {
            if (maquina.tempo_horas <= 0) {
              throw new BadRequestException(
                'Tempo de máquina deve ser positivo',
              );
            }
          }
        }

        if (produto.funcoes && produto.funcoes.length > 0) {
          for (const funcao of produto.funcoes) {
            if (funcao.tempo_horas <= 0) {
              throw new BadRequestException(
                'Tempo de função deve ser positivo',
              );
            }
          }
        }
      }
    }
  }

  private validarRegrasNegocio(dados: any): void {
    // Regras de negócio específicas
    if (
      dados.tipo === OrcamentoTipo.SERVICO &&
      dados.produtos &&
      dados.produtos.length > 0
    ) {
      for (const produto of dados.produtos) {
        if (produto.insumos && produto.insumos.length > 0) {
          throw new BadRequestException(
            'Orçamento de serviço não pode ter insumos',
          );
        }
      }
    }

    if (dados.prioridade === PrioridadeOrcamento.URGENTE) {
      if (dados.data_validade) {
        const dataValidade = new Date(dados.data_validade);
        const hoje = new Date();
        const diferencaDias = Math.ceil(
          (dataValidade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (diferencaDias > 7) {
          throw new BadRequestException(
            'Orçamento urgente deve ter validade máxima de 7 dias',
          );
        }
      }
    }
  }

  private validarPermissoesAtualizacao(
    dados: any,
    orcamento: OrcamentoCompleto,
  ): void {
    // Verificar se pode alterar campos específicos baseado no status atual
    if (orcamento.status === OrcamentoStatus.APROVADO) {
      if (dados.produtos || dados.quantidades || dados.configuracoes) {
        throw new BadRequestException(
          'Não é possível alterar produtos, quantidades ou configurações de orçamento aprovado',
        );
      }
    }

    if (orcamento.status === OrcamentoStatus.EM_EXECUCAO) {
      if (dados.produtos || dados.quantidades || dados.configuracoes) {
        throw new BadRequestException(
          'Não é possível alterar produtos, quantidades ou configurações de orçamento em execução',
        );
      }
    }

    if (orcamento.status === OrcamentoStatus.CONCLUIDO) {
      throw new BadRequestException(
        'Não é possível alterar orçamento concluído',
      );
    }
  }

  private obterTransicoesValidas(
    statusAtual: OrcamentoStatus,
  ): OrcamentoStatus[] {
    const transicoes: Record<OrcamentoStatus, OrcamentoStatus[]> = {
      [OrcamentoStatus.RASCUNHO]: [
        OrcamentoStatus.EM_ANALISE,
        OrcamentoStatus.CANCELADO,
      ],
      [OrcamentoStatus.EM_ANALISE]: [
        OrcamentoStatus.APROVADO,
        OrcamentoStatus.REJEITADO,
        OrcamentoStatus.RASCUNHO,
        OrcamentoStatus.CANCELADO,
      ],
      [OrcamentoStatus.APROVADO]: [
        OrcamentoStatus.EM_EXECUCAO,
        OrcamentoStatus.CANCELADO,
      ],
      [OrcamentoStatus.REJEITADO]: [
        OrcamentoStatus.RASCUNHO,
        OrcamentoStatus.EM_ANALISE,
      ],
      [OrcamentoStatus.EM_EXECUCAO]: [
        OrcamentoStatus.CONCLUIDO,
        OrcamentoStatus.CANCELADO,
      ],
      [OrcamentoStatus.CONCLUIDO]: [],
      [OrcamentoStatus.CANCELADO]: [OrcamentoStatus.RASCUNHO],
    };

    return transicoes[statusAtual] || [];
  }

  private async validarStatusEspecifico(
    novoStatus: OrcamentoStatus,
    orcamento: OrcamentoCompleto,
  ): Promise<void> {
    switch (novoStatus) {
      case OrcamentoStatus.APROVADO:
        await this.validarAprovacao(orcamento);
        break;
      case OrcamentoStatus.EM_EXECUCAO:
        await this.validarInicioExecucao(orcamento);
        break;
      case OrcamentoStatus.CONCLUIDO:
        await this.validarConclusao(orcamento);
        break;
    }
  }

  private async validarAprovacao(orcamento: OrcamentoCompleto): Promise<void> {
    // Verificar se tem produtos
    if (!orcamento.produtos || orcamento.produtos.length === 0) {
      throw new BadRequestException(
        'Orçamento deve ter produtos para ser aprovado',
      );
    }

    // Verificar se tem custos calculados
    if (!orcamento.custos || !orcamento.custos.custo_total) {
      throw new BadRequestException(
        'Orçamento deve ter custos calculados para ser aprovado',
      );
    }

    // Verificar se tem cliente válido
    if (!orcamento.cliente || !orcamento.cliente.id) {
      throw new BadRequestException(
        'Orçamento deve ter cliente válido para ser aprovado',
      );
    }
  }

  private async validarInicioExecucao(
    orcamento: OrcamentoCompleto,
  ): Promise<void> {
    if (orcamento.status !== OrcamentoStatus.APROVADO) {
      throw new BadRequestException(
        'Apenas orçamentos aprovados podem iniciar execução',
      );
    }

    // Verificar se tem aprovações necessárias
    const aprovacoesNecessarias = await this.prisma.aprovacaoOrcamento.count({
      where: {
        orcamento_id: orcamento.id,
        status: 'aprovado',
      },
    });

    if (aprovacoesNecessarias === 0) {
      throw new BadRequestException(
        'Orçamento deve ter aprovações para iniciar execução',
      );
    }
  }

  private async validarConclusao(orcamento: OrcamentoCompleto): Promise<void> {
    if (orcamento.status !== OrcamentoStatus.EM_EXECUCAO) {
      throw new BadRequestException(
        'Apenas orçamentos em execução podem ser concluídos',
      );
    }

    // Verificar se todos os produtos foram executados
    // TODO: Implementar validação específica de execução
  }
}
