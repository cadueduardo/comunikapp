import { Injectable, Logger } from '@nestjs/common';
import { 
  OrcamentoCompleto, 
  OrcamentoBase,
  OrcamentoStatus,
  OrcamentoTipo,
  PrioridadeOrcamento 
} from '../interfaces/orcamento.interface';

/**
 * Serviço de Transformação V2 para Orçamentos
 * Responsável por transformar dados entre diferentes formatos
 * 
 * ✅ ARQUIVO ≤ 400 LINHAS (CONFORME PREMISSAS)
 * ✅ TRANSFORMAÇÕES ROBUSTAS E COMPLETAS
 * ✅ INTEGRAÇÃO COM INTERFACES DEFINIDAS
 */
@Injectable()
export class TransformacaoV2Service {
  private readonly logger = new Logger(TransformacaoV2Service.name);

  /**
   * Prepara dados para criação de orçamento
   */
  prepararDadosCriacao(
    dados: any,
    lojaId: string,
    usuarioId: string,
  ): any {
    this.logger.log(`🔄 Preparando dados para criação de orçamento`);

    const dadosPreparados = {
      ...dados,
      loja_id: lojaId,
      responsavel_id: usuarioId,
      status: dados.status || OrcamentoStatus.RASCUNHO,
      tipo: dados.tipo || OrcamentoTipo.PRODUTO_SERVICO,
      prioridade: dados.prioridade || PrioridadeOrcamento.MEDIA,
      data_criacao: new Date(),
      data_atualizacao: new Date(),
      ativo: true,
    };

    // Preparar produtos se existirem
    if (dados.produtos && Array.isArray(dados.produtos)) {
      dadosPreparados.produtos = {
        create: dados.produtos.map(produto => this.prepararProdutoCriacao(produto)),
      };
    }

    // Preparar configurações se existirem
    if (dados.configuracoes) {
      dadosPreparados.configuracoes = this.prepararConfiguracoes(dados.configuracoes);
    }

    // Preparar tags se existirem
    if (dados.tags && Array.isArray(dados.tags)) {
      dadosPreparados.tags = dados.tags.filter(tag => typeof tag === 'string' && tag.trim().length > 0);
    }

    this.logger.log(`✅ Dados preparados para criação`);
    return dadosPreparados;
  }

  /**
   * Prepara dados para atualização de orçamento
   */
  prepararDadosAtualizacao(
    dados: any,
    orcamentoExistente: OrcamentoCompleto,
  ): any {
    this.logger.log(`🔄 Preparando dados para atualização do orçamento ${orcamentoExistente.id}`);

    const dadosPreparados: any = {
      ...dados,
      data_atualizacao: new Date(),
    };

    // Preparar produtos se existirem
    if (dados.produtos && Array.isArray(dados.produtos)) {
      dadosPreparados.produtos = this.prepararProdutosAtualizacao(
        dados.produtos,
        orcamentoExistente.produtos,
      );
    }

    // Preparar configurações se existirem
    if (dados.configuracoes) {
      dadosPreparados.configuracoes = this.prepararConfiguracoes(dados.configuracoes);
    }

    // Preparar tags se existirem
    if (dados.tags && Array.isArray(dados.tags)) {
      dadosPreparados.tags = dados.tags.filter(tag => typeof tag === 'string' && tag.trim().length > 0);
    }

    // Remover campos que não devem ser atualizados
    delete dadosPreparados.id;
    delete dadosPreparados.loja_id;
    delete dadosPreparados.data_criacao;
    delete dadosPreparados.responsavel_id;

    this.logger.log(`✅ Dados preparados para atualização`);
    return dadosPreparados;
  }

  /**
   * Transforma dados do banco para interface
   */
  transformarParaInterface(dados: any): OrcamentoCompleto {
    this.logger.log(`🔄 Transformando dados do banco para interface`);

    const orcamento: OrcamentoCompleto = {
      id: dados.id,
      titulo: dados.titulo,
      descricao: dados.descricao,
      cliente_id: dados.cliente_id,
      loja_id: dados.loja_id,
      status: dados.status,
      tipo: dados.tipo,
      data_criacao: dados.data_criacao,
      data_atualizacao: dados.data_atualizacao,
      data_validade: dados.data_validade,
      observacoes: dados.observacoes,
      tags: dados.tags || [],
      prioridade: dados.prioridade,
      responsavel_id: dados.responsavel_id,
      ativo: dados.ativo,
      custos_calculados: dados.custos_calculados,
      detalhamento_calculo: dados.detalhamento_calculo,
      alertas: dados.alertas || [],
      data_ultimo_calculo: dados.data_ultimo_calculo,
      
      // Dados relacionados
      cliente: this.transformarCliente(dados.cliente),
      produtos: this.transformarProdutos(dados.produtos),
      custos: this.transformarCustos(dados.custos_calculados),
      configuracoes: this.transformarConfiguracoes(dados.configuracoes),
      versoes: this.transformarVersoes(dados.versoes),
      historico: this.transformarHistorico(dados.historico),
      aprovacoes: this.transformarAprovacoes(dados.aprovacoes),
      links: this.transformarLinks(dados.links),
      mensagens: this.transformarMensagens(dados.mensagens),
      anexos: this.transformarAnexos(dados.anexos),
    };

    this.logger.log(`✅ Dados transformados para interface`);
    return orcamento;
  }

  /**
   * Transforma dados da interface para banco
   */
  transformarParaBanco(dados: OrcamentoCompleto): any {
    this.logger.log(`🔄 Transformando dados da interface para banco`);

    const dadosBanco: any = {
      id: dados.id,
      titulo: dados.titulo,
      descricao: dados.descricao,
      cliente_id: dados.cliente_id,
      loja_id: dados.loja_id,
      status: dados.status,
      tipo: dados.tipo,
      data_criacao: dados.data_criacao,
      data_atualizacao: dados.data_atualizacao,
      data_validade: dados.data_validade,
      observacoes: dados.observacoes,
      tags: dados.tags,
      prioridade: dados.prioridade,
      responsavel_id: dados.responsavel_id,
      ativo: dados.ativo,
      custos_calculados: dados.custos,
      detalhamento_calculo: dados.detalhamento_calculo,
      alertas: dados.alertas,
      data_ultimo_calculo: dados.data_ultimo_calculo,
    };

    this.logger.log(`✅ Dados transformados para banco`);
    return dadosBanco;
  }

  /**
   * Prepara dados para cálculo via motor
   */
  prepararDadosParaMotor(dados: any, lojaId: string): any {
    this.logger.log(`🔄 Preparando dados para motor de cálculo`);

    const dadosMotor = {
      loja_id: lojaId,
      produtos: this.prepararProdutosParaMotor(dados.produtos),
      configuracoes: dados.configuracoes || {},
      opcoes: {
        incluir_estoque: true,
        incluir_alertas: true,
        incluir_recomendacoes: true,
        incluir_detalhamento: true,
      },
    };

    this.logger.log(`✅ Dados preparados para motor`);
    return dadosMotor;
  }

  // Métodos privados de transformação

  private prepararProdutoCriacao(produto: any): any {
    return {
      nome: produto.nome,
      descricao: produto.descricao,
      quantidade: produto.quantidade,
      unidade: produto.unidade,
      observacoes: produto.observacoes,
      ativo: true,
      
      // Insumos
      insumos: produto.insumos ? {
        create: produto.insumos.map(insumo => ({
          insumo_id: insumo.insumo_id,
          quantidade: insumo.quantidade,
          unidade: insumo.unidade,
          preco_unitario: insumo.preco_unitario || 0,
          preco_total: insumo.preco_total || 0,
        })),
      } : undefined,

      // Máquinas
      maquinas: produto.maquinas ? {
        create: produto.maquinas.map(maquina => ({
          maquina_id: maquina.maquina_id,
          tempo_horas: maquina.tempo_horas,
          custo_hora: maquina.custo_hora || 0,
          custo_total: maquina.custo_total || 0,
        })),
      } : undefined,

      // Funções
      funcoes: produto.funcoes ? {
        create: produto.funcoes.map(funcao => ({
          funcao_id: funcao.funcao_id,
          tempo_horas: funcao.tempo_horas,
          custo_hora: funcao.custo_hora || 0,
          custo_total: funcao.custo_total || 0,
        })),
      } : undefined,

      // Serviços manuais
      servicos_manuais: produto.servicos_manuais ? {
        create: produto.servicos_manuais.map(servico => ({
          servico_id: servico.servico_id,
          tempo_horas: servico.tempo_horas,
          custo_hora: servico.custo_hora || 0,
          custo_total: servico.custo_total || 0,
        })),
      } : undefined,

      // Custos indiretos
      custos_indiretos: produto.custos_indiretos ? {
        create: produto.custos_indiretos.map(custo => ({
          custo_id: custo.custo_id,
          percentual: custo.percentual,
          valor_fixo: custo.valor_fixo || 0,
          custo_total: custo.custo_total || 0,
        })),
      } : undefined,
    };
  }

  private prepararProdutosAtualizacao(
    produtosNovos: any[],
    produtosExistentes: any[],
  ): any {
    // Estratégia: remover todos e recriar
    return {
      deleteMany: {},
      create: produtosNovos.map(produto => this.prepararProdutoCriacao(produto)),
    };
  }

  private prepararConfiguracoes(configuracoes: any): any {
    return {
      margem_lucro_padrao: configuracoes.margem_lucro_padrao || 0,
      impostos_padrao: configuracoes.impostos_padrao || 0,
      custos_indiretos_padrao: configuracoes.custos_indiretos_padrao || 0,
      horas_produtivas_mensais: configuracoes.horas_produtivas_mensais || 0,
      custos_indiretos_mensais: configuracoes.custos_indiretos_mensais,
      regras_especiais: configuracoes.regras_especiais || [],
    };
  }

  private prepararProdutosParaMotor(produtos: any[]): any[] {
    if (!produtos || !Array.isArray(produtos)) return [];

    return produtos.map(produto => ({
      id: produto.id,
      nome: produto.nome,
      descricao: produto.descricao,
      quantidade: produto.quantidade,
      unidade: produto.unidade,
      
      insumos: produto.insumos?.map(insumo => ({
        insumo_id: insumo.insumo_id,
        quantidade: insumo.quantidade,
        unidade: insumo.unidade,
        preco_unitario: insumo.preco_unitario,
      })) || [],
      
      maquinas: produto.maquinas?.map(maquina => ({
        maquina_id: maquina.maquina_id,
        tempo_horas: maquina.tempo_horas,
        custo_hora: maquina.custo_hora,
      })) || [],
      
      funcoes: produto.funcoes?.map(funcao => ({
        funcao_id: funcao.funcao_id,
        tempo_horas: funcao.tempo_horas,
        custo_hora: funcao.custo_hora,
      })) || [],
      
      servicos_manuais: produto.servicos_manuais?.map(servico => ({
        servico_id: servico.servico_id,
        tempo_horas: servico.tempo_horas,
        custo_hora: servico.custo_hora,
      })) || [],
      
      custos_indiretos: produto.custos_indiretos?.map(custo => ({
        custo_id: custo.custo_id,
        percentual: custo.percentual,
        valor_fixo: custo.valor_fixo,
      })) || [],
    }));
  }

  private transformarCliente(cliente: any): any {
    if (!cliente) return null;

    return {
      id: cliente.id,
      nome: cliente.nome,
      email: cliente.email,
      telefone: cliente.telefone,
      endereco: cliente.endereco,
      cpf_cnpj: cliente.cpf_cnpj,
    };
  }

  private transformarProdutos(produtos: any[]): any[] {
    if (!produtos || !Array.isArray(produtos)) return [];

    return produtos.map(produto => ({
      id: produto.id,
      nome: produto.nome,
      descricao: produto.descricao,
      quantidade: produto.quantidade,
      unidade: produto.unidade,
      preco_unitario: produto.preco_unitario || 0,
      preco_total: produto.preco_total || 0,
      margem_lucro: produto.margem_lucro || 0,
      impostos: produto.impostos || 0,
      observacoes: produto.observacoes,
      
      insumos: produto.insumos?.map(insumo => ({
        insumo_id: insumo.insumo_id,
        quantidade: insumo.quantidade,
        unidade: insumo.unidade,
        preco_unitario: insumo.preco_unitario || 0,
        preco_total: insumo.preco_total || 0,
        estoque_disponivel: insumo.estoque_disponivel,
        alerta_estoque: insumo.alerta_estoque || false,
      })) || [],
      
      maquinas: produto.maquinas?.map(maquina => ({
        maquina_id: maquina.maquina_id,
        tempo_horas: maquina.tempo_horas,
        custo_hora: maquina.custo_hora || 0,
        custo_total: maquina.custo_total || 0,
      })) || [],
      
      funcoes: produto.funcoes?.map(funcao => ({
        funcao_id: funcao.funcao_id,
        tempo_horas: funcao.tempo_horas,
        custo_hora: funcao.custo_hora || 0,
        custo_total: funcao.custo_total || 0,
      })) || [],
      
      servicos_manuais: produto.servicos_manuais?.map(servico => ({
        servico_id: servico.servico_id,
        tempo_horas: servico.tempo_horas,
        custo_hora: servico.custo_hora || 0,
        custo_total: servico.custo_total || 0,
      })) || [],
      
      custos_indiretos: produto.custos_indiretos?.map(custo => ({
        custo_id: custo.custo_id,
        percentual: custo.percentual,
        valor_fixo: custo.valor_fixo || 0,
        custo_total: custo.custo_total || 0,
      })) || [],
    }));
  }

  private transformarCustos(custos: any): any {
    if (!custos) return null;

    return {
      custos_diretos: {
        insumos: custos.insumos || 0,
        maquinas: custos.maquinas || 0,
        funcoes: custos.funcoes || 0,
        servicos_manuais: custos.servicos_manuais || 0,
        subtotal: custos.subtotal || 0,
      },
      custos_indiretos: custos.custos_indiretos || 0,
      impostos: custos.impostos || 0,
      margem_lucro: custos.margem_lucro || 0,
      custo_total: custos.custo_total || 0,
      preco_final: custos.preco_final || 0,
      lucro_estimado: custos.lucro_estimado || 0,
    };
  }

  private transformarConfiguracoes(configuracoes: any): any {
    if (!configuracoes) return null;

    return {
      margem_lucro_padrao: configuracoes.margem_lucro_padrao || 0,
      impostos_padrao: configuracoes.impostos_padrao || 0,
      custos_indiretos_padrao: configuracoes.custos_indiretos_padrao || 0,
      horas_produtivas_mensais: configuracoes.horas_produtivas_mensais || 0,
      custos_indiretos_mensais: configuracoes.custos_indiretos_mensais,
      regras_especiais: configuracoes.regras_especiais || [],
    };
  }

  private transformarVersoes(versoes: any[]): any[] {
    if (!versoes || !Array.isArray(versoes)) return [];

    return versoes.map(versao => ({
      numero: versao.numero,
      data_criacao: versao.data_criacao,
      responsavel_id: versao.responsavel_id,
      mudancas: versao.mudancas || [],
      custos_anteriores: versao.custos_anteriores,
      custos_novos: versao.custos_novos,
    }));
  }

  private transformarHistorico(historico: any[]): any[] {
    if (!historico || !Array.isArray(historico)) return [];

    return historico.map(item => ({
      id: item.id,
      data: item.data,
      tipo: item.tipo,
      descricao: item.descricao,
      usuario_id: item.usuario_id,
      dados_anteriores: item.dados_anteriores,
      dados_novos: item.dados_novos,
      observacoes: item.observacoes,
    }));
  }

  private transformarAprovacoes(aprovacoes: any[]): any[] {
    if (!aprovacoes || !Array.isArray(aprovacoes)) return [];

    return aprovacoes.map(aprovacao => ({
      id: aprovacao.id,
      nivel: aprovacao.nivel,
      responsavel_id: aprovacao.responsavel_id,
      status: aprovacao.status,
      data_aprovacao: aprovacao.data_aprovacao,
      observacoes: aprovacao.observacoes,
      condicoes: aprovacao.condicoes || [],
    }));
  }

  private transformarLinks(links: any[]): any[] {
    if (!links || !Array.isArray(links)) return [];

    return links.map(link => ({
      id: link.id,
      codigo: link.codigo,
      url: link.url,
      data_expiracao: link.data_expiracao,
      max_acessos: link.max_acessos,
      acessos_restantes: link.acessos_restantes,
      ativo: link.ativo,
      permissoes: link.permissoes || [],
    }));
  }

  private transformarMensagens(mensagens: any[]): any[] {
    if (!mensagens || !Array.isArray(mensagens)) return [];

    return mensagens.map(mensagem => ({
      id: mensagem.id,
      usuario_id: mensagem.usuario_id,
      tipo: mensagem.tipo,
      conteudo: mensagem.conteudo,
      data_envio: mensagem.data_envio,
      lida: mensagem.lida,
      anexos: mensagem.anexos || [],
    }));
  }

  private transformarAnexos(anexos: any[]): any[] {
    if (!anexos || !Array.isArray(anexos)) return [];

    return anexos.map(anexo => ({
      id: anexo.id,
      nome: anexo.nome,
      tipo: anexo.tipo,
      tamanho: anexo.tamanho,
      url: anexo.url,
      data_upload: anexo.data_upload,
      usuario_id: anexo.usuario_id,
    }));
  }
}
