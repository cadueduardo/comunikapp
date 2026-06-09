import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MotorCalculoV2Service } from '../motor-calculo-v2/services/motor-calculo-v2.service';
import { CreateProdutoDto } from './dto/create-produto.dto';
import { UpdateProdutoDto } from './dto/update-produto.dto';
import { CalcularProdutoDto } from './dto/calcular-produto.dto';
import {
  DTOCalculo,
  ResultadoCalculo,
} from '../motor-calculo-v2/interfaces/calculo.interface';

@Injectable()
export class ProdutosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly motorCalculoV2Service: MotorCalculoV2Service,
  ) {}

  async create(createProdutoDto: CreateProdutoDto, lojaId: string) {
    const itensPayload = Array.isArray(createProdutoDto.itens)
      ? createProdutoDto.itens.filter((item) => item?.insumo_id)
      : [];
    const maquinasPayload = Array.isArray(createProdutoDto.maquinas)
      ? createProdutoDto.maquinas.filter((maquina) => maquina?.maquina_id)
      : [];
    const funcoesPayload = Array.isArray(createProdutoDto.funcoes)
      ? createProdutoDto.funcoes.filter((funcao) => funcao?.funcao_id)
      : [];

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
    const insumoIds = itensPayload.map((item) => item.insumo_id);
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
    if (maquinasPayload.length > 0) {
      const maquinaIds = maquinasPayload.map(
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
    if (funcoesPayload.length > 0) {
      const funcaoIds = funcoesPayload.map(
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
      if (itensPayload.length > 0) {
        await prisma.itemTemplateProduto.createMany({
          data: itensPayload.map((item) => ({
            template_id: produtoCriado.id,
            insumo_id: item.insumo_id,
            quantidade: item.quantidade,
            custo_unitario: item.custo_unitario,
            custo_total: item.custo_total,
          })),
        });
      }

      // Criar as máquinas do produto (se fornecidas)
      if (maquinasPayload.length > 0) {
        await prisma.maquinaTemplateProduto.createMany({
          data: maquinasPayload.map((maquina) => ({
            template_id: produtoCriado.id,
            maquina_id: maquina.maquina_id,
            horas_utilizadas: maquina.horas_utilizadas,
            custo_total: maquina.custo_total,
          })),
        });
      }

      // Criar as funções do produto (se fornecidas)
      if (funcoesPayload.length > 0) {
        await prisma.funcaoTemplateProduto.createMany({
          data: funcoesPayload.map((funcao) => ({
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
          const itensComCustosRecalculados = produto.itens.map((item) => {
            const quantidade = Number(item.quantidade) || 0;
            // IMPORTANTE: Usar o custo_total já calculado e salvo no banco
            // Não recalcular incorretamente
            const custoTotal = Number(item.custo_total) || 0;

            // Calcular custo unitário baseado no total e quantidade
            const custoUnitario = quantidade > 0 ? custoTotal / quantidade : 0;

            return {
              ...item,
              custo_unitario: custoUnitario,
              custo_total: custoTotal,
            };
          });

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

          const calculo = await this.calcularProdutoV2(
            dtoParaOrcamento,
            lojaId,
          );

          // IMPORTANTE: SEMPRE salvar o valor_calculado no banco de dados
          // Usar o preço final que inclui margem e impostos
          // Forçar atualização para garantir consistência
          await this.prisma.templateProduto.update({
            where: { id: produto.id },
            data: { valor_calculado: calculo.custos.preco_final } as any,
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

    // IMPORTANTE: Não recalcular custos aqui para evitar inconsistências
    // Os custos já estão calculados e salvos no banco
    // Apenas retornar os dados como estão
    return produto;
  }

  async update(id: string, updateProdutoDto: UpdateProdutoDto, lojaId: string) {
    const itensPayload = Array.isArray(updateProdutoDto.itens)
      ? updateProdutoDto.itens.filter((item) => item?.insumo_id)
      : undefined;
    const maquinasPayload = Array.isArray(updateProdutoDto.maquinas)
      ? updateProdutoDto.maquinas.filter((maquina) => maquina?.maquina_id)
      : undefined;
    const funcoesPayload = Array.isArray(updateProdutoDto.funcoes)
      ? updateProdutoDto.funcoes.filter((funcao) => funcao?.funcao_id)
      : undefined;

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
      if (itensPayload) {
        // Remover itens existentes
        await prisma.itemTemplateProduto.deleteMany({
          where: { template_id: id },
        });

        // Criar novos itens
        if (itensPayload.length > 0) {
          await prisma.itemTemplateProduto.createMany({
            data: itensPayload.map((item) => ({
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
      if (maquinasPayload) {
        // Remover máquinas existentes
        await prisma.maquinaTemplateProduto.deleteMany({
          where: { template_id: id },
        });

        // Criar novas máquinas
        if (maquinasPayload.length > 0) {
          await prisma.maquinaTemplateProduto.createMany({
            data: maquinasPayload.map((maquina) => ({
              template_id: id,
              maquina_id: maquina.maquina_id,
              horas_utilizadas: maquina.horas_utilizadas,
              custo_total: maquina.custo_total,
            })),
          });
        }
      }

      // Se funções foram fornecidas, atualizar
      if (funcoesPayload) {
        // Remover funções existentes
        await prisma.funcaoTemplateProduto.deleteMany({
          where: { template_id: id },
        });

        // Criar novas funções
        if (funcoesPayload.length > 0) {
          await prisma.funcaoTemplateProduto.createMany({
            data: funcoesPayload.map((funcao) => ({
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

  // Utiliza o motor de cálculo V2
  async calcularProduto(
    calcularProdutoDto: CalcularProdutoDto,
    lojaId: string,
  ) {
    // Converter para o formato esperado pelo motor de cálculo V2
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

    // Usar o motor de cálculo V2
    return await this.calcularProdutoV2(dtoParaOrcamento, lojaId);
  }

  // Método auxiliar para calcular produto usando motor V2
  private async calcularProdutoV2(dtoParaOrcamento: any, lojaId: string) {
    try {
      // Preparar DTO para o motor V2
      const dtoCalculo: DTOCalculo = {
        lojaId,
        produtos: [
          {
            id: 'temp',
            nome: dtoParaOrcamento.nome_servico,
            nome_servico: dtoParaOrcamento.nome_servico,
            quantidade: dtoParaOrcamento.quantidade_produto || 1,
            insumos: dtoParaOrcamento.itens.map((item: any) => ({
              id: item.insumo_id,
              nome: '',
              unidade: '',
              preco_unitario: 0,
              quantidade: item.quantidade,
              categoria: '',
              fornecedor: '',
              estoque_disponivel: 0,
            })),
            maquinas:
              dtoParaOrcamento.maquinas?.map((m: any) => ({
                id: m.maquina_id,
                nome: '',
                tipo: '',
                custo_hora: 0,
                tempo_setup: 0,
                eficiencia: 1,
                disponivel: true,
              })) || [],
            funcoes:
              dtoParaOrcamento.funcoes?.map((f: any) => ({
                id: f.funcao_id,
                nome: '',
                categoria: '',
                custo_hora: 0,
                tempo_estimado: 0,
                nivel_experiencia: 'INTERMEDIARIO',
                disponivel: true,
              })) || [],
            servicos_manuais: [],
            custos_indiretos: [],
          },
        ],
        configuracoes: {
          margem_lucro_padrao: 20,
          impostos_padrao: 25,
          comissao_padrao: 0,
          custos_indiretos_padrao: 0,
          desconto_padrao: 0,
          prazo_entrega_padrao: 10,
          unidade_monetaria: 'BRL',
          timezone: 'America/Sao_Paulo',
        },
      };

      // Executar cálculo via motor V2
      const resultado =
        await this.motorCalculoV2Service.executarCalculo(dtoCalculo);

      // Converter resultado para formato esperado pelo módulo de produtos
      // O resultado do motor V2 precisa ser adaptado para o formato antigo
      return this.adaptarResultadoMotorV2(resultado);
    } catch (error) {
      console.error('Erro ao calcular produto com motor V2:', error);
      // Retornar resultado vazio em caso de erro
      return {
        custos: {
          preco_final: 0,
          custo_material: 0,
          custo_mao_obra: 0,
          custo_maquinaria: 0,
          custo_indireto: 0,
        },
      };
    }
  }

  // Adaptar resultado do motor V2 para formato antigo
  private adaptarResultadoMotorV2(resultado: ResultadoCalculo) {
    // Extrair os valores do primeiro produto calculado
    const primeiroProduto = resultado.produtos?.[0];
    const custos = primeiroProduto?.custos;

    const precoFinal = custos?.preco_final || 0;
    const custoMaterial = custos?.custo_material || 0;
    const custoMaoObra = custos?.custo_mao_obra || 0;
    const custoMaquinaria = custos?.custo_maquinaria || 0;
    const custoIndireto = custos?.custo_indireto || 0;

    return {
      custos: {
        preco_final: precoFinal,
        custo_material: custoMaterial,
        custo_mao_obra: custoMaoObra,
        custo_maquinaria: custoMaquinaria,
        custo_indireto: custoIndireto,
      },
    };
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
      quantidade_produto: produto.quantidade_padrao || 1,
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
