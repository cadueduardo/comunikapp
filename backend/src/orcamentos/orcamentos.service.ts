import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CalcularOrcamentoDto } from './dto/calcular-orcamento.dto';
import { ResultadoCalculoDto, ItemOrcamentoCalculadoDto, DetalhamentoCustoDto, MaquinaCalculadaDto, FuncaoCalculadaDto, CustoIndiretoCalculadoDto } from './dto/resultado-calculo.dto';
import { CreateOrcamentoDto } from './dto/create-orcamento.dto';
import { UpdateOrcamentoDto } from './dto/update-orcamento.dto';
import { NotificacoesService } from '../notificacoes/notificacoes.service';

@Injectable()
export class OrcamentosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificacoesService: NotificacoesService,
  ) {}

  /**
   * Motor de cálculo principal atualizado - Sub-tarefa 2.7.5
   * Implementa cálculo granular com máquinas e funções específicas
   */
  async calcularOrcamento(dto: CalcularOrcamentoDto, lojaId: string): Promise<ResultadoCalculoDto> {
    // 1. Buscar configurações da loja
    const loja = await this.prisma.loja.findUnique({
      where: { id: lojaId },
    });

    if (!loja) {
      throw new NotFoundException('Loja não encontrada');
    }

    // 2. Validar se há máquinas e funções configuradas
    if (dto.maquinas.length === 0 && dto.funcoes.length === 0) {
      throw new BadRequestException(
        'É necessário selecionar pelo menos uma máquina ou função para o orçamento.'
      );
    }

    // 3. Buscar dados dos insumos
    const insumoIds = dto.itens.map(item => item.insumo_id);
    const insumos = await this.prisma.insumo.findMany({
      where: {
        id: { in: insumoIds },
        loja_id: lojaId,
      },
      include: {
        categoria: true,
        fornecedor: true,
      },
    });

    if (insumos.length !== insumoIds.length) {
      throw new BadRequestException('Um ou mais insumos não foram encontrados');
    }

    // 4. Buscar dados das máquinas
    const maquinaIds = dto.maquinas.map(m => m.maquina_id);
    const maquinas = await this.prisma.maquina.findMany({
      where: {
        id: { in: maquinaIds },
        loja_id: lojaId,
      },
    });

    if (maquinas.length !== maquinaIds.length) {
      throw new BadRequestException('Uma ou mais máquinas não foram encontradas');
    }

    // 5. Buscar dados das funções
    const funcaoIds = dto.funcoes.map(f => f.funcao_id);
    const funcoes = await this.prisma.funcao.findMany({
      where: {
        id: { in: funcaoIds },
        loja_id: lojaId,
      },
      include: {
        maquina: true,
      },
    });

    if (funcoes.length !== funcaoIds.length) {
      throw new BadRequestException('Uma ou mais funções não foram encontradas');
    }

    // 6. Buscar custos indiretos ativos
    const custosIndiretos = await this.prisma.custoIndireto.findMany({
      where: {
        loja_id: lojaId,
        ativo: true,
      },
    });

    // 7. Calcular custos diretos
    const { custoMaterial, itensCalculados } = this.calcularCustosDirectos(dto.itens, insumos, dto.largura_produto, dto.altura_produto, dto.unidade_medida_produto);
    
    // 8. Calcular custos de máquinas
    const { custoMaquinaria, maquinasCalculadas } = this.calcularCustosMaquinas(dto.maquinas, maquinas);
    
    // 9. Calcular custos de funções
    const { custoMaoObra, funcoesCalculadas } = this.calcularCustosFuncoes(dto.funcoes, funcoes);

    // 10. Calcular horas totais de produção
    const horasProducaoTotal = this.calcularHorasProducaoTotal(dto.maquinas, dto.funcoes);

    // 11. Calcular custos indiretos rateados
    const { custoIndiretoTotal, custosIndiretosDetalhados } = await this.calcularCustosIndiretosRateados(
      custosIndiretos,
      horasProducaoTotal,
      custoMaterial + custoMaquinaria + custoMaoObra,
      loja.horas_produtivas_mensais || 352
    );

    // 12. Calcular custo total de produção
    const custoTotalProducao = custoMaterial + custoMaquinaria + custoMaoObra + custoIndiretoTotal;

    // 13. Aplicar margem de lucro e impostos
    const margemLucro = dto.margem_lucro_customizada || Number(loja.margem_lucro_padrao || 0);
    const impostos = dto.impostos_customizados || Number(loja.impostos_padrao || 0);

    const margemLucroValor = custoTotalProducao * (margemLucro / 100);
    const subtotalComLucro = custoTotalProducao + margemLucroValor;
    const impostosValor = subtotalComLucro * (impostos / 100);
    const precoFinal = subtotalComLucro + impostosValor;

    // 14. Montar resultado
    const resultado: ResultadoCalculoDto = {
      nome_servico: dto.nome_servico,
      descricao: dto.descricao || '',
      horas_producao_total: horasProducaoTotal,
      itens: itensCalculados,
      maquinas: maquinasCalculadas,
      funcoes: funcoesCalculadas,
      custos: {
        custo_material: custoMaterial,
        custo_mao_obra: custoMaoObra,
        custo_maquinaria: custoMaquinaria,
        custo_indireto: custoIndiretoTotal,
        custos_indiretos_detalhados: custosIndiretosDetalhados,
        custo_total_producao: custoTotalProducao,
        margem_lucro_percentual: margemLucro,
        margem_lucro_valor: margemLucroValor,
        subtotal_com_lucro: subtotalComLucro,
        impostos_percentual: impostos,
        impostos_valor: impostosValor,
        preco_final: precoFinal,
      },
      parametros: {
        margem_lucro_percentual: margemLucro,
        impostos_percentual: impostos,
        total_horas_produtivas_mes: loja.horas_produtivas_mensais || 352,
      },
      simulacao: {
        modo_simulacao: dto.modo_simulacao || false,
      },
    };

    return resultado;
  }

  /**
   * Calcula custos de máquinas específicas
   */
  private calcularCustosMaquinas(maquinasDto: any[], maquinas: any[]): { custoMaquinaria: number, maquinasCalculadas: MaquinaCalculadaDto[] } {
    let custoMaquinaria = 0;
    const maquinasCalculadas: MaquinaCalculadaDto[] = [];

    for (const maquinaDto of maquinasDto) {
      const maquina = maquinas.find(m => m.id === maquinaDto.maquina_id);
      if (!maquina) continue;

      const custoPorHora = Number(maquina.custo_hora);
      const horasUtilizadas = Number(maquinaDto.horas_utilizadas);
      const custoTotal = custoPorHora * horasUtilizadas;

      custoMaquinaria += custoTotal;

      maquinasCalculadas.push({
        maquina_id: maquina.id,
        nome_maquina: maquina.nome,
        tipo_maquina: maquina.tipo,
        horas_utilizadas: horasUtilizadas,
        custo_por_hora: custoPorHora,
        custo_total: custoTotal,
      });
    }

    return { custoMaquinaria, maquinasCalculadas };
  }

  /**
   * Calcula custos de funções específicas
   */
  private calcularCustosFuncoes(funcoesDto: any[], funcoes: any[]): { custoMaoObra: number, funcoesCalculadas: FuncaoCalculadaDto[] } {
    let custoMaoObra = 0;
    const funcoesCalculadas: FuncaoCalculadaDto[] = [];

    for (const funcaoDto of funcoesDto) {
      const funcao = funcoes.find(f => f.id === funcaoDto.funcao_id);
      if (!funcao) continue;

      const custoPorHora = Number(funcao.custo_hora);
      const horasTrabalhadas = Number(funcaoDto.horas_trabalhadas);
      const custoTotal = custoPorHora * horasTrabalhadas;

      custoMaoObra += custoTotal;

      funcoesCalculadas.push({
        funcao_id: funcao.id,
        nome_funcao: funcao.nome,
        horas_trabalhadas: horasTrabalhadas,
        custo_por_hora: custoPorHora,
        custo_total: custoTotal,
        maquina_vinculada: funcao.maquina?.nome,
      });
    }

    return { custoMaoObra, funcoesCalculadas };
  }

  /**
   * Calcula horas totais de produção
   */
  private calcularHorasProducaoTotal(maquinas: any[], funcoes: any[]): number {
    const horasMaquinas = maquinas.reduce((total, m) => total + Number(m.horas_utilizadas), 0);
    const horasFuncoes = funcoes.reduce((total, f) => total + Number(f.horas_trabalhadas), 0);
    return Math.max(horasMaquinas, horasFuncoes); // Usa o maior valor como referência
  }

  /**
   * Calcula custos indiretos rateados conforme regras configuradas
   */
  private async calcularCustosIndiretosRateados(
    custosIndiretos: any[],
    horasProducao: number,
    custoTotalDireto: number,
    horasProdutivasMes: number
  ): Promise<{ custoIndiretoTotal: number, custosIndiretosDetalhados: CustoIndiretoCalculadoDto[] }> {
    let custoIndiretoTotal = 0;
    const custosIndiretosDetalhados: CustoIndiretoCalculadoDto[] = [];

    for (const custoIndireto of custosIndiretos) {
      let valorRateado = 0;
      let percentualRateio = 0;

      switch (custoIndireto.regra_rateio) {
        case 'PROPORCIONAL_TEMPO':
          // Rateio proporcional ao tempo de produção
          percentualRateio = (horasProducao / horasProdutivasMes) * 100;
          valorRateado = Number(custoIndireto.valor_mensal) * (horasProducao / horasProdutivasMes);
          break;

        case 'PROPORCIONAL_VALOR':
          // Rateio proporcional ao valor do orçamento (aproximação)
          const valorEstimadoOrcamento = custoTotalDireto * 1.5; // Estimativa
          percentualRateio = (valorEstimadoOrcamento / (valorEstimadoOrcamento + custoTotalDireto)) * 100;
          valorRateado = Number(custoIndireto.valor_mensal) * (valorEstimadoOrcamento / (valorEstimadoOrcamento + custoTotalDireto));
          break;

        case 'FIXO':
          // Valor fixo por orçamento
          valorRateado = Number(custoIndireto.valor_mensal) / 30; // Rateio diário
          percentualRateio = 100;
          break;

        default:
          // Padrão: proporcional ao tempo
          percentualRateio = (horasProducao / horasProdutivasMes) * 100;
          valorRateado = Number(custoIndireto.valor_mensal) * (horasProducao / horasProdutivasMes);
      }

      custoIndiretoTotal += valorRateado;

      custosIndiretosDetalhados.push({
        custo_indireto_id: custoIndireto.id,
        nome: custoIndireto.nome,
        categoria: custoIndireto.categoria,
        valor_mensal: Number(custoIndireto.valor_mensal),
        regra_rateio: custoIndireto.regra_rateio,
        valor_rateado: valorRateado,
        percentual_rateio: percentualRateio,
      });
    }

    return { custoIndiretoTotal, custosIndiretosDetalhados };
  }

  /**
   * Calcula os custos diretos de materiais
   */
  private calcularCustosDirectos(
    itens: any[], 
    insumos: any[], 
    larguraProduto?: number,
    alturaProduto?: number,
    unidadeMedidaProduto?: string
  ): { custoMaterial: number, itensCalculados: ItemOrcamentoCalculadoDto[] } {
    let custoMaterial = 0;
    const itensCalculados: ItemOrcamentoCalculadoDto[] = [];

    for (const item of itens) {
      const insumo = insumos.find(i => i.id === item.insumo_id);
      if (!insumo) continue;

      const custoUnitario = Number(insumo.custo_unitario);
      
      // Calcular quantidade automaticamente se houver medidas do produto
      let quantidade = Number(item.quantidade);
      if (larguraProduto && alturaProduto && unidadeMedidaProduto) {
        quantidade = this.calcularQuantidadeInsumo(
          insumo,
          larguraProduto,
          alturaProduto,
          unidadeMedidaProduto
        );
      }
      
      const custoTotal = custoUnitario * quantidade;

      custoMaterial += custoTotal;

      itensCalculados.push({
        insumo_id: insumo.id,
        nome_insumo: insumo.nome,
        quantidade,
        custo_unitario: custoUnitario,
        custo_total: custoTotal,
        unidade_medida: insumo.unidade_medida,
        // Campos de medidas
        largura: larguraProduto,
        altura: alturaProduto,
        unidade_medida_item: unidadeMedidaProduto,
        area_calculada: larguraProduto && alturaProduto ? larguraProduto * alturaProduto : undefined,
      });
    }

    return { custoMaterial, itensCalculados };
  }

  /**
   * Calcula automaticamente a quantidade de um insumo baseado na lógica de consumo
   */
  private calcularQuantidadeInsumo(
    insumo: any,
    larguraProduto: number,
    alturaProduto: number,
    unidadeMedidaProduto: string
  ): number {
    if (!larguraProduto || !alturaProduto || !unidadeMedidaProduto) {
      return 1; // Quantidade padrão se não houver medidas
    }

    // Converter medidas do produto para metros
    const larguraEmMetros = this.converterParaMetros(larguraProduto, unidadeMedidaProduto);
    const alturaEmMetros = this.converterParaMetros(alturaProduto, unidadeMedidaProduto);

    switch (insumo.logica_consumo) {
      case 'area':
        // Usar área do produto (largura × altura)
        return larguraEmMetros * alturaEmMetros;

      case 'perimetro':
        // Usar perímetro do produto (2 × (largura + altura))
        return 2 * (larguraEmMetros + alturaEmMetros);

      case 'quantidade_fixa':
        // Usar quantidade fixa definida nos parâmetros
        const parametros = insumo.parametros_consumo as any;
        return parametros?.quantidade_fixa || 1;

      case 'custom':
        // Lógica customizada baseada nos parâmetros
        const params = insumo.parametros_consumo as any;
        if (params?.espacamento) {
          // Para ilhós: perímetro / espaçamento
          const perimetro = 2 * (larguraEmMetros + alturaEmMetros);
          return Math.ceil(perimetro / params.espacamento);
        }
        if (params?.multiplicador) {
          // Multiplicador customizado
          return (larguraEmMetros * alturaEmMetros) * params.multiplicador;
        }
        return 1;

      default:
        return 1;
    }
  }

  /**
   * Converte medidas para metros
   */
  private converterParaMetros(valor: number, unidade: string): number {
    switch (unidade.toLowerCase()) {
      case 'mm':
        return valor / 1000;
      case 'cm':
        return valor / 100;
      case 'm':
        return valor;
      case 'm2':
        return valor;
      default:
        return valor;
    }
  }

  /**
   * API para simulação de cenários de orçamento
   */
  async simularCenarios(dto: CalcularOrcamentoDto, lojaId: string): Promise<{
    cenario_atual: ResultadoCalculoDto;
    cenarios_alternativos: ResultadoCalculoDto[];
  }> {
    // Calcular cenário atual
    const cenarioAtual = await this.calcularOrcamento(dto, lojaId);

    // Buscar máquinas e funções disponíveis para simulação
    const maquinasDisponiveis = await this.prisma.maquina.findMany({
      where: { loja_id: lojaId, status: 'ATIVA' },
    });

    const funcoesDisponiveis = await this.prisma.funcao.findMany({
      where: { loja_id: lojaId },
    });

    const cenariosAlternativos: ResultadoCalculoDto[] = [];

    // Cenário 1: Usar máquina mais barata
    if (dto.maquinas.length > 0) {
      const maquinaMaisBarata = maquinasDisponiveis.reduce((min, m) => 
        Number(m.custo_hora) < Number(min.custo_hora) ? m : min
      );
      
      const dtoAlternativo = { ...dto };
      dtoAlternativo.maquinas = [{ maquina_id: maquinaMaisBarata.id, horas_utilizadas: dto.maquinas[0].horas_utilizadas }];
      dtoAlternativo.nome_servico = `${dto.nome_servico} (Máquina mais barata)`;
      
      try {
        const cenarioAlternativo = await this.calcularOrcamento(dtoAlternativo, lojaId);
        cenariosAlternativos.push(cenarioAlternativo);
      } catch (error) {
        // Ignora erros na simulação
      }
    }

    // Cenário 2: Usar função mais barata
    if (dto.funcoes.length > 0) {
      const funcaoMaisBarata = funcoesDisponiveis.reduce((min, f) => 
        Number(f.custo_hora) < Number(min.custo_hora) ? f : min
      );
      
      const dtoAlternativo = { ...dto };
      dtoAlternativo.funcoes = [{ funcao_id: funcaoMaisBarata.id, horas_trabalhadas: dto.funcoes[0].horas_trabalhadas }];
      dtoAlternativo.nome_servico = `${dto.nome_servico} (Função mais barata)`;
      
      try {
        const cenarioAlternativo = await this.calcularOrcamento(dtoAlternativo, lojaId);
        cenariosAlternativos.push(cenarioAlternativo);
      } catch (error) {
        // Ignora erros na simulação
      }
    }

    return {
      cenario_atual: cenarioAtual,
      cenarios_alternativos: cenariosAlternativos,
    };
  }

  /**
   * CRUD Operations para Orçamentos
   */

  async create(createOrcamentoDto: CreateOrcamentoDto, lojaId: string) {
    // 1. Calcular o orçamento usando o motor existente
    // Para compatibilidade, vamos converter os itens_produto para o formato antigo
    const todosItens = createOrcamentoDto.itens_produto.flatMap(itemProduto => 
      itemProduto.itens.map(item => ({
        insumo_id: item.insumo_id,
        quantidade: item.quantidade,
      }))
    );

    const calculoDto: CalcularOrcamentoDto = {
      nome_servico: createOrcamentoDto.itens_produto[0]?.nome_servico || 'Orçamento',
      descricao: createOrcamentoDto.itens_produto[0]?.descricao || '',
      itens: todosItens,
      maquinas: createOrcamentoDto.maquinas || [],
      funcoes: createOrcamentoDto.funcoes || [],
      cliente_id: createOrcamentoDto.cliente_id,
      margem_lucro_customizada: createOrcamentoDto.margem_lucro_customizada,
      impostos_customizados: createOrcamentoDto.impostos_customizados,
    };

    const resultado = await this.calcularOrcamento(calculoDto, lojaId);

    // 2. Gerar número único do orçamento
    const numero = await this.gerarNumeroOrcamento(lojaId);

    // 3. Criar o orçamento no banco
    const orcamento = await this.prisma.orcamento.create({
      data: {
        numero,
        custo_material: resultado.custos.custo_material,
        custo_mao_obra: resultado.custos.custo_mao_obra,
        custo_indireto: resultado.custos.custo_indireto,
        custo_total: resultado.custos.custo_total_producao,
        margem_lucro: resultado.custos.margem_lucro_percentual,
        impostos: resultado.custos.impostos_percentual,
        preco_final: resultado.custos.preco_final,
        loja_id: lojaId,
        cliente_id: createOrcamentoDto.cliente_id,
        condicoes_comerciais: createOrcamentoDto.condicoes_comerciais,
      },
    });

    // 4. Criar os itens de produto do orçamento
    for (let i = 0; i < createOrcamentoDto.itens_produto.length; i++) {
      const itemProduto = createOrcamentoDto.itens_produto[i];
      
      const itemProdutoOrcamento = await this.prisma.itemProdutoOrcamento.create({
        data: {
          orcamento_id: orcamento.id,
          nome_servico: itemProduto.nome_servico,
          descricao: itemProduto.descricao,
          largura_produto: itemProduto.largura_produto,
          altura_produto: itemProduto.altura_produto,
          unidade_medida_produto: itemProduto.unidade_medida_produto,
          area_produto: itemProduto.area_produto,
          ordem: itemProduto.ordem || i + 1,
          // Custos calculados (vamos distribuir proporcionalmente)
          custo_material: resultado.custos.custo_material / createOrcamentoDto.itens_produto.length,
          custo_mao_obra: resultado.custos.custo_mao_obra / createOrcamentoDto.itens_produto.length,
          custo_indireto: resultado.custos.custo_indireto / createOrcamentoDto.itens_produto.length,
          custo_total: resultado.custos.custo_total_producao / createOrcamentoDto.itens_produto.length,
          preco_final: resultado.custos.preco_final / createOrcamentoDto.itens_produto.length,
        },
      });

      // 5. Criar os itens de insumo para este produto
      const itensData = itemProduto.itens.map(item => ({
        orcamento_id: orcamento.id,
        item_produto_id: itemProdutoOrcamento.id,
        insumo_id: item.insumo_id,
        quantidade: item.quantidade,
        custo_unitario: 0, // Será calculado pelo motor
        custo_total: 0, // Será calculado pelo motor
      }));

      await this.prisma.itemOrcamento.createMany({
        data: itensData,
      });
    }

    // 6. Criar as máquinas utilizadas
    if (createOrcamentoDto.maquinas.length > 0) {
      const maquinasData = createOrcamentoDto.maquinas.map(maquina => ({
        orcamento_id: orcamento.id,
        maquina_id: maquina.maquina_id,
        horas_utilizadas: maquina.horas_utilizadas,
        custo_total: 0, // Será calculado pelo motor
      }));

      await this.prisma.maquinaOrcamento.createMany({
        data: maquinasData,
      });
    }

    // 7. Criar as funções utilizadas
    if (createOrcamentoDto.funcoes.length > 0) {
      const funcoesData = createOrcamentoDto.funcoes.map(funcao => ({
        orcamento_id: orcamento.id,
        funcao_id: funcao.funcao_id,
        horas_trabalhadas: funcao.horas_trabalhadas,
        custo_total: 0, // Será calculado pelo motor
      }));

      await this.prisma.funcaoOrcamento.createMany({
        data: funcoesData,
      });
    }

    return this.findOne(orcamento.id, lojaId);
  }

  async findAll(lojaId: string) {
    try {
      console.log('🔍 Buscando orçamentos para loja:', lojaId);
      
      const orcamentos = await this.prisma.orcamento.findMany({
        where: { loja_id: lojaId },
        include: {
          cliente: true,
          itens_produto: {
            include: {
              itens_insumo: {
                include: {
                  insumo: {
                    include: {
                      categoria: true,
                      fornecedor: true,
                    },
                  },
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
              funcao: true,
            },
          },
        },
        orderBy: { criado_em: 'desc' },
      });
      
      console.log('✅ Orçamentos encontrados:', orcamentos.length);
      return orcamentos;
    } catch (error) {
      console.error('❌ Erro ao buscar orçamentos:', error);
      throw error;
    }
  }

  async findOne(id: string, lojaId: string) {
    const orcamento = await this.prisma.orcamento.findFirst({
      where: { 
        id,
        loja_id: lojaId,
      },
      include: {
        cliente: true,
        itens_produto: {
          include: {
            itens_insumo: {
              include: {
                insumo: {
                  include: {
                    categoria: true,
                    fornecedor: true,
                  },
                },
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
            funcao: true,
          },
        },
      },
    });

    if (!orcamento) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    return orcamento;
  }

  async findOnePublico(id: string) {
    const orcamento = await this.prisma.orcamento.findFirst({
      where: { 
        id,
      },
      include: {
        cliente: true,
        loja: true,
        itens_produto: {
          include: {
            itens_insumo: {
              include: {
                insumo: {
                  include: {
                    categoria: true,
                    fornecedor: true,
                  },
                },
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
            funcao: true,
          },
        },
      },
    });

    if (!orcamento) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    return orcamento;
  }

  async update(id: string, updateOrcamentoDto: UpdateOrcamentoDto, lojaId: string) {
    // Verificar se o orçamento existe
    await this.findOne(id, lojaId);

    // Se houver mudanças nos parâmetros, recalcular
    if (updateOrcamentoDto.maquinas || updateOrcamentoDto.funcoes || 
        updateOrcamentoDto.margem_lucro_customizada || updateOrcamentoDto.impostos_customizados) {
      
      // Recalcular usando o motor
      const calculoDto: CalcularOrcamentoDto = {
        nome_servico: 'Orçamento Atualizado',
        itens: [],
        maquinas: updateOrcamentoDto.maquinas || [],
        funcoes: updateOrcamentoDto.funcoes || [],
        cliente_id: updateOrcamentoDto.cliente_id,
        margem_lucro_customizada: updateOrcamentoDto.margem_lucro_customizada,
        impostos_customizados: updateOrcamentoDto.impostos_customizados,
      };

      const resultado = await this.calcularOrcamento(calculoDto, lojaId);

      // Atualizar com os novos valores calculados
      await this.prisma.orcamento.update({
        where: { id },
        data: {
          custo_material: resultado.custos.custo_material,
          custo_mao_obra: resultado.custos.custo_mao_obra,
          custo_indireto: resultado.custos.custo_indireto,
          custo_total: resultado.custos.custo_total_producao,
          margem_lucro: resultado.custos.margem_lucro_percentual,
          impostos: resultado.custos.impostos_percentual,
          preco_final: resultado.custos.preco_final,
          cliente_id: updateOrcamentoDto.cliente_id,
        },
      });
    } else {
      // Atualização simples sem recálculo
      await this.prisma.orcamento.update({
        where: { id },
        data: {
          cliente_id: updateOrcamentoDto.cliente_id,
        },
      });
    }

    return this.findOne(id, lojaId);
  }

  async remove(id: string, lojaId: string) {
    await this.findOne(id, lojaId);
    
    return this.prisma.orcamento.delete({
      where: { id },
    });
  }

  /**
   * Processa ação do cliente (aprovar, rejeitar, negociar)
   */
  async acaoCliente(id: string, acaoDto: any) {
    const orcamento = await this.findOnePublico(id);
    
    let statusAprovacao: string;
    let tipoNotificacao: string;
    let tituloNotificacao: string;
    let mensagemNotificacao: string;
    
    switch (acaoDto.acao) {
      case 'APROVAR':
        statusAprovacao = 'APROVADO';
        tipoNotificacao = 'orcamento_aprovado';
        tituloNotificacao = 'Orçamento Aprovado';
        mensagemNotificacao = `O orçamento ${orcamento.numero} foi aprovado pelo cliente.`;
        break;
      case 'REJEITAR':
        statusAprovacao = 'REJEITADO';
        tipoNotificacao = 'orcamento_rejeitado';
        tituloNotificacao = 'Orçamento Rejeitado';
        mensagemNotificacao = `O orçamento ${orcamento.numero} foi rejeitado pelo cliente.`;
        break;
      case 'NEGOCIAR':
        statusAprovacao = 'NEGOCIANDO';
        tipoNotificacao = 'orcamento_negociando';
        tituloNotificacao = 'Orçamento em Negociação';
        mensagemNotificacao = `O orçamento ${orcamento.numero} está sendo negociado pelo cliente.`;
        break;
      default:
        throw new BadRequestException('Ação inválida');
    }

    await this.prisma.orcamento.update({
      where: { id },
      data: {
        status_aprovacao: statusAprovacao,
        observacoes_cliente: acaoDto.observacoes,
      },
    });

    // Criar notificação
    await this.notificacoesService.criarNotificacao({
      loja_id: orcamento.loja_id,
      tipo: tipoNotificacao,
      titulo: tituloNotificacao,
      mensagem: mensagemNotificacao,
      orcamento_id: id,
    });

    return {
      message: `Orçamento ${statusAprovacao.toLowerCase()}`,
      status: statusAprovacao,
    };
  }

  /**
   * Gera um número único para o orçamento
   */
  private async gerarNumeroOrcamento(lojaId: string): Promise<string> {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    
    // Buscar o último orçamento do mês
    const ultimoOrcamento = await this.prisma.orcamento.findFirst({
      where: {
        loja_id: lojaId,
        numero: {
          startsWith: `${ano}${mes}`,
        },
      },
      orderBy: { numero: 'desc' },
    });

    let sequencial = 1;
    if (ultimoOrcamento) {
      const ultimoSequencial = parseInt(ultimoOrcamento.numero.slice(-4));
      sequencial = ultimoSequencial + 1;
    }

    return `${ano}${mes}${String(sequencial).padStart(4, '0')}`;
  }
}
