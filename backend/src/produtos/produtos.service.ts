import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrcamentosService } from '../orcamentos/orcamentos.service';
import { CreateProdutoDto } from './dto/create-produto.dto';
import { UpdateProdutoDto } from './dto/update-produto.dto';
import { CalcularProdutoDto } from './dto/calcular-produto.dto';

@Injectable()
export class ProdutosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orcamentosService: OrcamentosService, // REUTILIZA o motor de cálculo
  ) {}

  async create(createProdutoDto: CreateProdutoDto, lojaId: string) {
    // Validar se já existe um produto com o mesmo nome na loja
    const produtoExistente = await this.prisma.templateProduto.findFirst({
      where: {
        nome: createProdutoDto.nome,
        loja_id: lojaId,
      },
    });

    if (produtoExistente) {
      throw new BadRequestException(
        `Já existe um produto com o nome "${createProdutoDto.nome}" nesta loja.`,
      );
    }

    // Validar se os insumos existem
    const insumoIds = createProdutoDto.itens.map((item) => item.insumo_id);
    const insumos = await this.prisma.insumo.findMany({
      where: {
        id: { in: insumoIds },
        loja_id: lojaId,
      },
    });

    if (insumos.length !== insumoIds.length) {
      throw new BadRequestException(
        'Um ou mais insumos não foram encontrados.',
      );
    }

    // Validar se as máquinas existem (se fornecidas)
    if (createProdutoDto.maquinas && createProdutoDto.maquinas.length > 0) {
      const maquinaIds = createProdutoDto.maquinas.map(
        (maquina) => maquina.maquina_id,
      );
      const maquinas = await this.prisma.maquina.findMany({
        where: {
          id: { in: maquinaIds },
          loja_id: lojaId,
        },
      });

      if (maquinas.length !== maquinaIds.length) {
        throw new BadRequestException(
          'Uma ou mais máquinas não foram encontradas.',
        );
      }
    }

    // Validar se as funções existem (se fornecidas)
    if (createProdutoDto.funcoes && createProdutoDto.funcoes.length > 0) {
      const funcaoIds = createProdutoDto.funcoes.map(
        (funcao) => funcao.funcao_id,
      );
      const funcoes = await this.prisma.funcao.findMany({
        where: {
          id: { in: funcaoIds },
          loja_id: lojaId,
        },
      });

      if (funcoes.length !== funcaoIds.length) {
        throw new BadRequestException(
          'Uma ou mais funções não foram encontradas.',
        );
      }
    }

    // Criar o produto com transação para garantir consistência
    const produto = await this.prisma.$transaction(async (prisma) => {
      // Criar o produto principal
      const produtoCriado = await prisma.templateProduto.create({
        data: {
          nome: createProdutoDto.nome,
          categoria: createProdutoDto.categoria,
          descricao: createProdutoDto.descricao,
          nome_servico: createProdutoDto.nome_servico,
          descricao_produto: createProdutoDto.descricao_produto,
          horas_producao: createProdutoDto.horas_producao,
          largura_produto: createProdutoDto.largura_produto,
          altura_produto: createProdutoDto.altura_produto,
          area_produto: createProdutoDto.area_produto,
          unidade_medida_produto: createProdutoDto.unidade_medida_produto,
          quantidade_padrao: createProdutoDto.quantidade_padrao,
          ativo: createProdutoDto.ativo ?? true,
          loja_id: lojaId,
        },
      });

      // Criar os itens do produto
      if (createProdutoDto.itens.length > 0) {
        await prisma.itemTemplateProduto.createMany({
          data: createProdutoDto.itens.map((item) => ({
            template_id: produtoCriado.id,
            insumo_id: item.insumo_id,
            quantidade: item.quantidade,
            custo_unitario: item.custo_unitario,
            custo_total: item.custo_total,
          })),
        });
      }

      // Criar as máquinas do produto (se fornecidas)
      if (createProdutoDto.maquinas && createProdutoDto.maquinas.length > 0) {
        await prisma.maquinaTemplateProduto.createMany({
          data: createProdutoDto.maquinas.map((maquina) => ({
            template_id: produtoCriado.id,
            maquina_id: maquina.maquina_id,
            horas_utilizadas: maquina.horas_utilizadas,
            custo_total: maquina.custo_total,
          })),
        });
      }

      // Criar as funções do produto (se fornecidas)
      if (createProdutoDto.funcoes && createProdutoDto.funcoes.length > 0) {
        await prisma.funcaoTemplateProduto.createMany({
          data: createProdutoDto.funcoes.map((funcao) => ({
            template_id: produtoCriado.id,
            funcao_id: funcao.funcao_id,
            horas_trabalhadas: funcao.horas_trabalhadas,
            custo_total: funcao.custo_total,
          })),
        });
      }

      return produtoCriado;
    });

    return produto;
  }

  async findAll(lojaId: string) {
    const produtos = await this.prisma.templateProduto.findMany({
      where: {
        loja_id: lojaId,
      },
      include: {
        itens: {
          include: {
            insumo: {
              include: {
                categoria: true,
                fornecedor: true,
              },
            },
          },
        },
        maquinas: {
          include: {
            maquina: true,
          },
        },
        funcoes: {
          include: {
            funcao: {
              include: {
                maquina: true,
              },
            },
          },
        },
      },
      orderBy: {
        criado_em: 'desc',
      },
    });

    // Calcular o valor de cada produto e atualizar custos
    const produtosComValor = await Promise.all(
      produtos.map(async (produto) => {
        try {
          // Recalcular custos dos itens baseado nos preços atuais dos insumos
          const itensComCustosRecalculados = await Promise.all(
            produto.itens.map(async (item) => {
              const insumo = await this.prisma.insumo.findUnique({
                where: { id: item.insumo_id },
              });

              const quantidade = Number(item.quantidade) || 0;
              // Calcular custo por unidade de uso usando a lógica completa
              let custoPorUnidadeUso = 0;
              if (
                insumo &&
                insumo.custo_unitario &&
                insumo.quantidade_compra &&
                insumo.fator_conversao
              ) {
                const custo = Number(insumo.custo_unitario);
                const quantidadeCompra = Number(insumo.quantidade_compra);
                const fator = Number(insumo.fator_conversao);

                if (quantidadeCompra > 0 && fator > 0) {
                  // Se temos dimensões e tipo de cálculo, usar a lógica específica
                  if (
                    insumo.altura &&
                    insumo.unidade_dimensao &&
                    insumo.tipo_calculo
                  ) {
                    const alturaNum = Number(insumo.altura);

                    if (!isNaN(alturaNum)) {
                      // Converter altura para metros
                      let alturaEmMetros = alturaNum;

                      switch (insumo.unidade_dimensao) {
                        case 'CENTÍMETROS':
                        case 'CM':
                          alturaEmMetros = alturaNum / 100;
                          break;
                        case 'MILÍMETROS':
                        case 'MM':
                          alturaEmMetros = alturaNum / 1000;
                          break;
                        case 'METROS':
                        case 'M':
                          // Já está em metros
                          break;
                      }

                      // Calcular quantidade baseada no tipo de cálculo
                      switch (insumo.tipo_calculo) {
                        case 'COMPRIMENTO LINEAR':
                        case 'LINEAR':
                          // Para comprimento linear: calcular custo por unidade de uso
                          const custoPorUnidade = custo / quantidadeCompra;

                          if (
                            insumo.unidade_uso === 'CENTIMETRO' ||
                            insumo.unidade_uso === 'CM'
                          ) {
                            // Se a unidade de uso é centímetro, calcular custo por centímetro
                            // Para cordão: custo por metro ÷ 100 = custo por centímetro
                            custoPorUnidadeUso = custoPorUnidade / 100;
                          } else {
                            // Para outras unidades de uso, usar o cálculo padrão
                            custoPorUnidadeUso = custoPorUnidade;
                          }
                          break;

                        case 'AREA':
                          // Para área: calcular custo por unidade de uso baseado na área da unidade
                          if (insumo.largura) {
                            const larguraNum = Number(insumo.largura);
                            if (!isNaN(larguraNum)) {
                              let larguraEmMetros = larguraNum;

                              switch (insumo.unidade_dimensao) {
                                case 'CENTÍMETROS':
                                case 'CM':
                                  larguraEmMetros = larguraNum / 100;
                                  break;
                                case 'MILÍMETROS':
                                case 'MM':
                                  larguraEmMetros = larguraNum / 1000;
                                  break;
                              }

                              const areaPorUnidade =
                                larguraEmMetros * alturaEmMetros;

                              if (insumo.unidade_uso === 'METRO QUADRADO') {
                                // Se a unidade de uso é metro quadrado, calcular custo por m²
                                custoPorUnidadeUso = custo / areaPorUnidade;
                              } else {
                                // Para outras unidades de uso, usar o cálculo padrão
                                custoPorUnidadeUso = custo / quantidadeCompra;
                              }
                            }
                          } else {
                            custoPorUnidadeUso = custo / quantidadeCompra;
                          }
                          break;

                        case 'QUANTIDADE':
                          // Para quantidade fixa: usar quantidade diretamente
                          custoPorUnidadeUso = custo / quantidadeCompra;
                          break;

                        default:
                          // Padrão: usar quantidade diretamente
                          custoPorUnidadeUso = custo / quantidadeCompra;
                      }
                    }
                  } else {
                    // Cálculo padrão: custo / (quantidade * fator)
                    custoPorUnidadeUso = custo / (quantidadeCompra * fator);
                  }
                }
              }
              const custoTotal = quantidade * custoPorUnidadeUso;

              return {
                ...item,
                custo_unitario: custoPorUnidadeUso,
                custo_total: custoTotal,
              };
            }),
          );

          // Recalcular custos das máquinas
          const maquinasComCustosRecalculados = await Promise.all(
            produto.maquinas.map(async (maquina) => {
              const maquinaEncontrada = await this.prisma.maquina.findUnique({
                where: { id: maquina.maquina_id },
              });

              const horasUtilizadas = Number(maquina.horas_utilizadas) || 0;
              const custoHora = maquinaEncontrada
                ? Number(maquinaEncontrada.custo_hora)
                : 0;
              const custoTotal = horasUtilizadas * custoHora;

              return {
                ...maquina,
                custo_total: custoTotal,
              };
            }),
          );

          // Recalcular custos das funções
          const funcoesComCustosRecalculados = await Promise.all(
            produto.funcoes.map(async (funcao) => {
              const funcaoEncontrada = await this.prisma.funcao.findUnique({
                where: { id: funcao.funcao_id },
              });

              const horasTrabalhadas = Number(funcao.horas_trabalhadas) || 0;
              const custoHora = funcaoEncontrada
                ? Number(funcaoEncontrada.custo_hora)
                : 0;
              const custoTotal = horasTrabalhadas * custoHora;

              return {
                ...funcao,
                custo_total: custoTotal,
              };
            }),
          );

          // Converter para o formato esperado pelo motor de cálculo
          const dtoParaOrcamento = {
            nome_servico: produto.nome_servico,
            descricao: produto.descricao_produto || undefined,
            horas_producao: Number(produto.horas_producao) || 0,
            quantidade_produto: Number(produto.quantidade_padrao) || 1,
            itens: itensComCustosRecalculados.map((item) => ({
              insumo_id: item.insumo_id,
              quantidade: Number(item.quantidade) || 0,
            })),
            maquinas: maquinasComCustosRecalculados.map((maquina) => ({
              maquina_id: maquina.maquina_id,
              horas_utilizadas: Number(maquina.horas_utilizadas) || 0,
            })),
            funcoes: funcoesComCustosRecalculados.map((funcao) => ({
              funcao_id: funcao.funcao_id,
              horas_trabalhadas: Number(funcao.horas_trabalhadas) || 0,
            })),
            margem_lucro_customizada: undefined,
            impostos_customizados: undefined,
          };

          // Calcular o valor usando o motor de cálculo
          console.log(`🔍 Debug - Calculando produto ${produto.nome}:`, {
            dtoParaOrcamento,
            lojaId,
          });

          const calculo = await this.orcamentosService.calcularOrcamento(
            dtoParaOrcamento,
            lojaId,
          );

          console.log(`🔍 Debug - Resultado do cálculo para ${produto.nome}:`, {
            preco_final: calculo.custos.preco_final,
            custo_material: calculo.custos.custo_material,
            custo_mao_obra: calculo.custos.custo_mao_obra,
            custo_maquinaria: calculo.custos.custo_maquinaria,
            custo_indireto: calculo.custos.custo_indireto,
          });

          return {
            ...produto,
            itens: itensComCustosRecalculados,
            maquinas: maquinasComCustosRecalculados,
            funcoes: funcoesComCustosRecalculados,
            valor_calculado: calculo.custos.preco_final,
          };
        } catch (error) {
          console.error(
            `Erro ao calcular valor do produto ${produto.id}:`,
            error,
          );
          return {
            ...produto,
            valor_calculado: 0,
          };
        }
      }),
    );

    return produtosComValor;
  }

  async findOne(id: string, lojaId: string) {
    const produto = await this.prisma.templateProduto.findFirst({
      where: {
        id,
        loja_id: lojaId,
      },
      include: {
        itens: {
          include: {
            insumo: {
              include: {
                categoria: true,
                fornecedor: true,
              },
            },
          },
        },
        maquinas: {
          include: {
            maquina: true,
          },
        },
        funcoes: {
          include: {
            funcao: {
              include: {
                maquina: true,
              },
            },
          },
        },
      },
    });

    if (!produto) {
      throw new NotFoundException('Produto não encontrado.');
    }

    return produto;
  }

  async update(id: string, updateProdutoDto: UpdateProdutoDto, lojaId: string) {
    // Verificar se o produto existe
    const produtoExistente = await this.prisma.templateProduto.findFirst({
      where: {
        id,
        loja_id: lojaId,
      },
    });

    if (!produtoExistente) {
      throw new NotFoundException('Produto não encontrado.');
    }

    // Se o nome foi alterado, verificar se já existe outro produto com o mesmo nome
    if (
      updateProdutoDto.nome &&
      updateProdutoDto.nome !== produtoExistente.nome
    ) {
      const produtoComMesmoNome = await this.prisma.templateProduto.findFirst({
        where: {
          nome: updateProdutoDto.nome,
          loja_id: lojaId,
          id: { not: id },
        },
      });

      if (produtoComMesmoNome) {
        throw new BadRequestException(
          `Já existe um produto com o nome "${updateProdutoDto.nome}" nesta loja.`,
        );
      }
    }

    // Atualizar o produto com transação
    const produto = await this.prisma.$transaction(async (prisma) => {
      // Atualizar dados principais
      const produtoAtualizado = await prisma.templateProduto.update({
        where: { id },
        data: {
          nome: updateProdutoDto.nome,
          categoria: updateProdutoDto.categoria,
          descricao: updateProdutoDto.descricao,
          nome_servico: updateProdutoDto.nome_servico,
          descricao_produto: updateProdutoDto.descricao_produto,
          horas_producao: updateProdutoDto.horas_producao,
          largura_produto: updateProdutoDto.largura_produto,
          altura_produto: updateProdutoDto.altura_produto,
          area_produto: updateProdutoDto.area_produto,
          unidade_medida_produto: updateProdutoDto.unidade_medida_produto,
          quantidade_padrao: updateProdutoDto.quantidade_padrao,
          ativo: updateProdutoDto.ativo,
        },
      });

      // Se itens foram fornecidos, atualizar
      if (updateProdutoDto.itens) {
        // Remover itens existentes
        await prisma.itemTemplateProduto.deleteMany({
          where: { template_id: id },
        });

        // Criar novos itens
        if (updateProdutoDto.itens.length > 0) {
          await prisma.itemTemplateProduto.createMany({
            data: updateProdutoDto.itens.map((item) => ({
              template_id: id,
              insumo_id: item.insumo_id,
              quantidade: item.quantidade,
              custo_unitario: item.custo_unitario,
              custo_total: item.custo_total,
            })),
          });
        }
      }

      // Se máquinas foram fornecidas, atualizar
      if (updateProdutoDto.maquinas) {
        // Remover máquinas existentes
        await prisma.maquinaTemplateProduto.deleteMany({
          where: { template_id: id },
        });

        // Criar novas máquinas
        if (updateProdutoDto.maquinas.length > 0) {
          await prisma.maquinaTemplateProduto.createMany({
            data: updateProdutoDto.maquinas.map((maquina) => ({
              template_id: id,
              maquina_id: maquina.maquina_id,
              horas_utilizadas: maquina.horas_utilizadas,
              custo_total: maquina.custo_total,
            })),
          });
        }
      }

      // Se funções foram fornecidas, atualizar
      if (updateProdutoDto.funcoes) {
        // Remover funções existentes
        await prisma.funcaoTemplateProduto.deleteMany({
          where: { template_id: id },
        });

        // Criar novas funções
        if (updateProdutoDto.funcoes.length > 0) {
          await prisma.funcaoTemplateProduto.createMany({
            data: updateProdutoDto.funcoes.map((funcao) => ({
              template_id: id,
              funcao_id: funcao.funcao_id,
              horas_trabalhadas: funcao.horas_trabalhadas,
              custo_total: funcao.custo_total,
            })),
          });
        }
      }

      return produtoAtualizado;
    });

    return produto;
  }

  async remove(id: string, lojaId: string) {
    // Verificar se o produto existe
    const produto = await this.prisma.templateProduto.findFirst({
      where: {
        id,
        loja_id: lojaId,
      },
    });

    if (!produto) {
      throw new NotFoundException('Produto não encontrado.');
    }

    // Verificar se o produto está sendo usado em orçamentos
    // (implementar quando necessário)

    // Remover o produto (cascade irá remover itens, máquinas e funções)
    await this.prisma.templateProduto.delete({
      where: { id },
    });

    return { message: 'Produto removido com sucesso.' };
  }

  // REUTILIZA o motor de cálculo existente
  async calcularProduto(
    calcularProdutoDto: CalcularProdutoDto,
    lojaId: string,
  ) {
    // Converter para o formato esperado pelo motor de cálculo
    const dtoParaOrcamento = {
      nome_servico: calcularProdutoDto.nome_servico,
      descricao: calcularProdutoDto.descricao,
      horas_producao: calcularProdutoDto.horas_producao,
      quantidade_produto: calcularProdutoDto.quantidade_produto || 1,
      itens: calcularProdutoDto.itens,
      maquinas: calcularProdutoDto.maquinas || [],
      funcoes: calcularProdutoDto.funcoes || [],
      margem_lucro_customizada: calcularProdutoDto.margem_lucro_customizada,
      impostos_customizados: calcularProdutoDto.impostos_customizados,
    };

    // Usar o motor de cálculo do orçamento
    return this.orcamentosService.calcularOrcamento(dtoParaOrcamento, lojaId);
  }

  // Carrega template para orçamento
  async carregarTemplateParaOrcamento(templateId: string, lojaId: string) {
    const produto = await this.findOne(templateId, lojaId);

    // Converter para o formato esperado pelo formulário de orçamento
    return {
      nome_servico: produto.nome_servico,
      descricao: produto.descricao_produto,
      horas_producao: produto.horas_producao,
      largura_produto: produto.largura_produto,
      altura_produto: produto.altura_produto,
      area_produto: produto.area_produto,
      unidade_medida_produto: produto.unidade_medida_produto,
      quantidade_produto: produto.quantidade_padrao,
      itens: produto.itens.map((item) => ({
        insumo_id: item.insumo_id,
        quantidade: item.quantidade,
      })),
      maquinas: produto.maquinas.map((maquina) => ({
        maquina_id: maquina.maquina_id,
        horas_utilizadas: maquina.horas_utilizadas,
      })),
      funcoes: produto.funcoes.map((funcao) => ({
        funcao_id: funcao.funcao_id,
        horas_trabalhadas: funcao.horas_trabalhadas,
      })),
    };
  }
}
