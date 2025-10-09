/**
 * Controller para buscar detalhes completos de um produto de orçamento
 * Inclui materiais, máquinas, funções e serviços associados
 */

import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Orçamentos V2 - Detalhes de Produto')
@ApiBearerAuth()
@Controller('orcamentos-v2/produto')
@UseGuards(JwtAuthGuard)
export class ProdutoDetalhesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':produtoId/detalhes')
  @ApiOperation({ summary: 'Buscar detalhes completos de um produto de orçamento' })
  @ApiParam({ name: 'produtoId', description: 'ID do produto no orçamento' })
  async getDetalhesProduto(@Param('produtoId') produtoId: string) {
    try {
      const produto = await this.prisma.produtoOrcamento.findUnique({
        where: { id: produtoId },
        include: {
          insumos: {
            include: {
              insumo: {
                select: {
                  nome: true,
                  unidade_compra: true,
                  unidade_uso: true
                }
              }
            }
          },
          maquinas: {
            include: {
              maquina: {
                select: {
                  nome: true,
                  tipo: true
                }
              }
            }
          },
          funcoes: {
            include: {
              funcao: {
                select: {
                  nome: true
                }
              }
            }
          },
          servicos_manuais: {
            include: {
              servico: {
                select: {
                  nome: true
                }
              }
            }
          }
        }
      });

      if (!produto) {
        return {
          success: false,
          error: 'Produto não encontrado'
        };
      }

      // Processar dados para o frontend
      const dadosProcessados = {
        id: produto.id,
        nome_servico: produto.nome_servico,
        descricao: produto.descricao,
        quantidade: produto.quantidade,
        dimensoes: {
          largura: produto.largura,
          altura: produto.altura,
          profundidade: produto.profundidade,
          area_produto: produto.area_produto,
          unidade_medida: produto.unidade_medida
        },
        materiais: produto.insumos.map(item => ({
          id: item.id,
          nome: item.insumo.nome,
          quantidade: item.quantidade,
          unidade: item.unidade,
          unidade_compra: item.insumo.unidade_compra,
          unidade_uso: item.insumo.unidade_uso,
          preco_unitario: item.preco_unitario,
          preco_total: item.preco_total
        })),
        maquinas: produto.maquinas.map(item => ({
          id: item.id,
          nome: item.maquina.nome,
          tipo: item.maquina.tipo,
          tempo_horas: item.tempo_horas,
          custo_total: item.custo_total
        })),
        funcoes: produto.funcoes.map(item => ({
          id: item.id,
          nome: item.funcao.nome,
          tempo_horas: item.tempo_horas,
          custo_total: item.custo_total
        })),
        servicos_manuais: produto.servicos_manuais.map(item => ({
          id: item.id,
          nome: item.servico.nome,
          tempo_horas: item.tempo_horas,
          custo_total: item.custo_total
        })),
        custos: {
          custo_total_producao: produto.custo_total_producao,
          preco_unitario: produto.preco_unitario,
          preco_total: produto.preco_total
        }
      };

      return {
        success: true,
        data: dadosProcessados
      };

    } catch (error) {
      console.error('Erro ao buscar detalhes do produto:', error);
      return {
        success: false,
        error: 'Erro interno do servidor'
      };
    }
  }
}
