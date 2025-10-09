/**
 * Service para gerenciamento de prazo de produtos da OS
 * Implementa regras de negócio para prazos individuais por produto
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { 
  DefinirPrazoProdutoDTO, 
  StatusPrazoProdutoResponse, 
  ValidarPrazoProdutoResponse 
} from '../dto/os-produto-prazo.dto';

interface DefinirPrazoProdutoRequest {
  itemId: string;
  osId: string;
  lojaId: string;
  usuarioId: string;
  dataPrazo: Date;
  dataInicio?: Date;
  prioridade?: string;
  ordemProducao?: number;
  motivo?: string;
  ipOrigem?: string;
  userAgent?: string;
  confirmarRetroativa?: boolean;
}

@Injectable()
export class OSProdutoPrazoService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Define ou atualiza o prazo de um produto específico
   */
  async definirPrazoProduto(request: DefinirPrazoProdutoRequest) {
    const {
      itemId,
      osId,
      lojaId,
      usuarioId,
      dataPrazo,
      dataInicio,
      prioridade,
      ordemProducao,
      motivo,
      ipOrigem,
      userAgent,
      confirmarRetroativa = false
    } = request;

    // 1. Verificar se o item existe e pertence à OS/loja
    const item = await this.prisma.itemOS.findFirst({
      where: {
        id: itemId,
        os: {
          id: osId,
          loja_id: lojaId
        }
      },
      include: {
        os: {
          select: {
            id: true,
            numero: true,
            data_prazo: true,
            status: true
          }
        }
      }
    });

    if (!item) {
      throw new NotFoundException('Produto não encontrado ou não pertence à OS');
    }

    // 2. Validar se prazo do produto <= prazo final da OS
    if (item.os.data_prazo) {
      const prazoFinal = new Date(item.os.data_prazo);
      prazoFinal.setHours(0, 0, 0, 0);
      
      const prazoProduto = new Date(dataPrazo);
      prazoProduto.setHours(0, 0, 0, 0);

      if (prazoProduto > prazoFinal) {
        throw new BadRequestException(
          'O prazo do produto não pode ser maior que o prazo final da OS. ' +
          `Prazo final da OS: ${prazoFinal.toLocaleDateString('pt-BR')}`
        );
      }
    }

    // 3. Validar data
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const dataComparacao = new Date(dataPrazo);
    dataComparacao.setHours(0, 0, 0, 0);

    const isRetroativa = dataComparacao < hoje;

    // 4. Verificar se é data retroativa e se precisa de confirmação
    if (isRetroativa && !confirmarRetroativa) {
      const diasAtras = Math.ceil((hoje.getTime() - dataComparacao.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        requires_confirmation: true,
        is_retroativa: true,
        dias_atras: diasAtras,
        message: `A data informada é ${diasAtras} dia(s) anterior à data atual. Deseja continuar?`,
        data_original: dataPrazo,
        data_atual: hoje
      };
    }

    // 5. Atualizar o produto
    const itemAtualizado = await this.prisma.itemOS.update({
      where: { id: itemId },
      data: {
        data_prazo_produto: dataPrazo,
        data_inicio_producao: dataInicio,
        prioridade_produto: prioridade || 'NORMAL',
        ordem_producao: ordemProducao
      }
    });

    // 6. Se for data retroativa, criar log de auditoria
    if (isRetroativa) {
      await this.criarLogPrazoRetroativo({
        os_id: osId,
        item_id: itemId,
        usuario_id: usuarioId,
        data_definida: dataPrazo.toISOString(),
        data_atual: hoje.toISOString(),
        motivo: motivo,
        ip_origem: ipOrigem,
        user_agent: userAgent
      });
    }

    // 7. Calcular dias restantes
    const diasRestantes = Math.ceil((dataComparacao.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

    return {
      success: true,
      item_id: itemId,
      produto_servico: item.produto_servico,
      data_prazo_produto: dataPrazo,
      data_inicio_producao: dataInicio,
      prioridade_produto: prioridade || 'NORMAL',
      dias_restantes: diasRestantes > 0 ? diasRestantes : 0,
      is_retroativo: isRetroativa,
      mensagem: isRetroativa 
        ? 'Prazo retroativo definido com sucesso' 
        : `Prazo definido: ${diasRestantes} dias restantes`
    };
  }

  /**
   * Consulta o status do prazo de um produto
   */
  async consultarStatusPrazoProduto(itemId: string, osId: string, lojaId: string): Promise<StatusPrazoProdutoResponse> {
    const item = await this.prisma.itemOS.findFirst({
      where: {
        id: itemId,
        os: {
          id: osId,
          loja_id: lojaId
        }
      },
      include: {
        os: {
          select: {
            data_prazo: true
          }
        }
      }
    });

    if (!item) {
      throw new NotFoundException('Produto não encontrado ou não pertence à OS');
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    let diasRestantes: number | undefined;
    let isRetroativo = false;
    let excedePrazoFinal = false;
    let mensagem = 'Prazo não definido';

    if (item.data_prazo_produto) {
      const prazoProduto = new Date(item.data_prazo_produto);
      prazoProduto.setHours(0, 0, 0, 0);

      isRetroativo = prazoProduto < hoje;
      diasRestantes = Math.ceil((prazoProduto.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

      if (isRetroativo) {
        mensagem = 'Prazo retroativo';
      } else if (diasRestantes === 0) {
        mensagem = 'Prazo hoje';
      } else {
        mensagem = `${diasRestantes} dia(s) restante(s)`;
      }

      // Verificar se excede prazo final da OS
      if (item.os.data_prazo) {
        const prazoFinal = new Date(item.os.data_prazo);
        prazoFinal.setHours(0, 0, 0, 0);
        excedePrazoFinal = prazoProduto > prazoFinal;
      }
    }

    return {
      item_id: item.id,
      produto_servico: item.produto_servico,
      data_inicio_producao: item.data_inicio_producao,
      data_prazo_produto: item.data_prazo_produto,
      status_liberacao_pcp: item.status_liberacao_pcp || 'PENDENTE',
      prioridade_produto: item.prioridade_produto || 'NORMAL',
      dias_restantes: diasRestantes,
      is_retroativo: isRetroativo,
      mensagem,
      excede_prazo_final: excedePrazoFinal
    };
  }

  /**
   * Valida se o prazo do produto é válido em relação ao prazo final da OS
   */
  async validarPrazoProduto(itemId: string, osId: string, lojaId: string, dataPrazo: Date): Promise<ValidarPrazoProdutoResponse> {
    const item = await this.prisma.itemOS.findFirst({
      where: {
        id: itemId,
        os: {
          id: osId,
          loja_id: lojaId
        }
      },
      include: {
        os: {
          select: {
            data_prazo: true
          }
        }
      }
    });

    if (!item) {
      throw new NotFoundException('Produto não encontrado ou não pertence à OS');
    }

    const avisos: string[] = [];
    const erros: string[] = [];

    // Validar se OS tem prazo final
    if (!item.os.data_prazo) {
      avisos.push('OS não tem prazo final definido');
    }

    // Validar se prazo do produto <= prazo final
    if (item.os.data_prazo) {
      const prazoFinal = new Date(item.os.data_prazo);
      prazoFinal.setHours(0, 0, 0, 0);
      
      const prazoProduto = new Date(dataPrazo);
      prazoProduto.setHours(0, 0, 0, 0);

      if (prazoProduto > prazoFinal) {
        erros.push(
          `Prazo do produto (${prazoProduto.toLocaleDateString('pt-BR')}) ` +
          `excede o prazo final da OS (${prazoFinal.toLocaleDateString('pt-BR')})`
        );
      }
    }

    // Validar se prazo está apertado (< 3 dias)
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const prazoProduto = new Date(dataPrazo);
    prazoProduto.setHours(0, 0, 0, 0);

    const diasRestantes = Math.ceil((prazoProduto.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

    if (diasRestantes < 3 && diasRestantes >= 0) {
      avisos.push(`Prazo apertado: apenas ${diasRestantes} dia(s) restante(s)`);
    }

    if (prazoProduto < hoje) {
      avisos.push('Prazo retroativo: será necessária confirmação e registro em log');
    }

    const valido = erros.length === 0;

    return {
      valido,
      mensagem: valido 
        ? 'Prazo do produto está válido' 
        : 'Prazo do produto possui erros que impedem a definição',
      avisos: avisos.length > 0 ? avisos : undefined,
      erros: erros.length > 0 ? erros : undefined
    };
  }

  /**
   * Libera um produto específico para o PCP
   */
  async liberarProdutoPCP(itemId: string, osId: string, lojaId: string, usuarioId: string, motivo?: string) {
    const item = await this.prisma.itemOS.findFirst({
      where: {
        id: itemId,
        os: {
          id: osId,
          loja_id: lojaId
        }
      }
    });

    if (!item) {
      throw new NotFoundException('Produto não encontrado ou não pertence à OS');
    }

    // Validar se produto tem prazo definido
    if (!item.data_prazo_produto) {
      throw new BadRequestException('Produto não tem prazo definido. Defina o prazo antes de liberar para o PCP.');
    }

    // Atualizar status de liberação
    const itemAtualizado = await this.prisma.itemOS.update({
      where: { id: itemId },
      data: {
        status_liberacao_pcp: 'LIBERADO',
        liberado_pcp_por: usuarioId,
        liberado_pcp_em: new Date()
      }
    });

    // Criar log
    await this.prisma.ordemServicoLog.create({
      data: {
        os_id: osId,
        tipo_acao: 'LIBERACAO_PRODUTO_PCP',
        descricao: `Produto "${item.produto_servico}" liberado para PCP`,
        dados_extras: JSON.stringify({
          item_id: itemId,
          produto_servico: item.produto_servico,
          data_prazo_produto: item.data_prazo_produto,
          motivo: motivo
        }),
        usuario_id: usuarioId
      }
    });

    return {
      success: true,
      item_id: itemId,
      produto_servico: item.produto_servico,
      status_liberacao_pcp: 'LIBERADO',
      liberado_em: itemAtualizado.liberado_pcp_em,
      mensagem: 'Produto liberado para PCP com sucesso'
    };
  }

  /**
   * Consulta status de todos os produtos de uma OS
   */
  async consultarStatusProdutosOS(osId: string, lojaId: string) {
    const os = await this.prisma.ordemServico.findFirst({
      where: {
        id: osId,
        loja_id: lojaId
      },
      include: {
        itens: true
      }
    });

    if (!os) {
      throw new NotFoundException('OS não encontrada ou não pertence à sua loja');
    }

    const produtos = await Promise.all(
      os.itens.map(item => this.consultarStatusPrazoProduto(item.id, osId, lojaId))
    );

    const resumo = {
      total_produtos: produtos.length,
      com_prazo: produtos.filter(p => p.data_prazo_produto).length,
      sem_prazo: produtos.filter(p => !p.data_prazo_produto).length,
      liberados_pcp: produtos.filter(p => p.status_liberacao_pcp === 'LIBERADO').length,
      pendentes: produtos.filter(p => p.status_liberacao_pcp === 'PENDENTE').length,
      excedendo_prazo: produtos.filter(p => p.excede_prazo_final).length
    };

    return {
      os_id: osId,
      data_prazo_final: os.data_prazo,
      produtos,
      resumo
    };
  }

  /**
   * Cria log de auditoria para prazo retroativo de produto
   */
  private async criarLogPrazoRetroativo(logData: any) {
    try {
      await this.prisma.ordemServicoLog.create({
        data: {
          os_id: logData.os_id,
          tipo_acao: 'PRAZO_PRODUTO_RETROATIVO',
          descricao: `Prazo retroativo definido para produto`,
          dados_extras: JSON.stringify({
            item_id: logData.item_id,
            data_prazo_definida: logData.data_definida,
            data_atual: logData.data_atual,
            motivo: logData.motivo,
            dias_atras: Math.ceil(
              (new Date(logData.data_atual).getTime() - new Date(logData.data_definida).getTime()) / (1000 * 60 * 60 * 24)
            )
          }),
          usuario_id: logData.usuario_id,
          ip_origem: logData.ip_origem,
          user_agent: logData.user_agent
        }
      });
    } catch (error) {
      console.error('Erro ao criar log de prazo retroativo de produto:', error);
    }
  }
}
