import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CalcularOrcamentoDto } from './dto/calcular-orcamento.dto';
import { ResultadoCalculoDto, ItemOrcamentoCalculadoDto, DetalhamentoCustoDto } from './dto/resultado-calculo.dto';
import { CreateOrcamentoDto } from './dto/create-orcamento.dto';
import { UpdateOrcamentoDto } from './dto/update-orcamento.dto';

@Injectable()
export class OrcamentosService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Motor de cálculo principal - Tarefa 2.5
   * Implementa a lógica conforme calculo-custos-orcamento.md
   */
  async calcularOrcamento(dto: CalcularOrcamentoDto, lojaId: string): Promise<ResultadoCalculoDto> {
    // 1. Buscar configurações da loja
    const loja = await this.prisma.loja.findUnique({
      where: { id: lojaId },
    });

    if (!loja) {
      throw new NotFoundException('Loja não encontrada');
    }

    // 2. Validar se as configurações necessárias estão preenchidas
    // Custos indiretos são opcionais, mas recomendados
    if (!loja.custos_indiretos_mensais) {
      console.log('Aviso: Custos indiretos não configurados na loja');
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

    // 4. Buscar máquinas e funções se fornecidas
    const maquinasCalculadas = await this.calcularCustosMaquinas(dto.maquinas || [], lojaId);
    const funcoesCalculadas = await this.calcularCustosFuncoes(dto.funcoes || [], lojaId);

    // 5. Calcular custo indireto por hora
    const { custoPorHora: custoIndiretoPorHora, custosDetalhados } = await this.calcularCustoIndiretoPorHora(loja, lojaId);
    
    // Garantir que custosDetalhados seja sempre um array
    const custosDetalhadosArray = custosDetalhados || [];

    // 6. Calcular custos diretos
    const { custoMaterial, itensCalculados } = this.calcularCustosDirectos(dto.itens, insumos);

    // 7. Calcular custo indireto alocado
    const custoIndiretolAlocado = this.calcularCustoIndiretolAlocado(dto.horas_producao, custoIndiretoPorHora);

    // 8. Calcular custo total de produção
    const custoTotalProducao = custoMaterial + maquinasCalculadas.custoTotal + funcoesCalculadas.custoTotal + custoIndiretolAlocado;

    // 8. Aplicar margem de lucro e impostos
    const margemLucro = dto.margem_lucro_customizada || Number(loja.margem_lucro_padrao || 0);
    const impostos = dto.impostos_customizados || Number(loja.impostos_padrao || 0);

    const margemLucroValor = custoTotalProducao * (margemLucro / 100);
    const subtotalComLucro = custoTotalProducao + margemLucroValor;
    const impostosValor = subtotalComLucro * (impostos / 100);
    const precoFinal = subtotalComLucro + impostosValor;

    // 9. Calcular custos indiretos detalhados
    const totalCustosIndiretosMensais = custosDetalhadosArray.reduce((total, custo) => {
      return total + Number(custo.valor_mensal);
    }, 0);

    const custosIndiretosDetalhados = custosDetalhadosArray.map(custo => {
      const valorRateado = (Number(custo.valor_mensal) / (loja.horas_produtivas_mensais || 352)) * dto.horas_producao;
      const percentualRateio = (Number(custo.valor_mensal) / (totalCustosIndiretosMensais || 1)) * 100;
      
      return {
        nome: custo.nome,
        categoria: custo.categoria,
        valor_rateado: valorRateado,
        percentual_rateio: percentualRateio,
      };
    });

    // 10. Montar resultado
    const resultado: ResultadoCalculoDto = {
      nome_servico: dto.nome_servico,
      descricao: dto.descricao,
      horas_producao: dto.horas_producao,
      itens: itensCalculados,
      maquinas: maquinasCalculadas.maquinasCalculadas,
      funcoes: funcoesCalculadas.funcoesCalculadas,
      custos: {
        custo_material: custoMaterial,
        custo_mao_obra: funcoesCalculadas.custoTotal,
        custo_maquinaria: maquinasCalculadas.custoTotal,
        custo_indireto: custoIndiretolAlocado,
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
        custo_maquinaria_por_hora: Number(loja.custo_maquinaria_hora || 0),
        custos_indiretos_por_hora: custoIndiretoPorHora,
        margem_lucro_percentual: margemLucro,
        impostos_percentual: impostos,
        total_horas_produtivas_mes: loja.horas_produtivas_mensais || 352,
      },
    };

    console.log('Resultado sendo retornado:', JSON.stringify(resultado, null, 2));
    return resultado;
  }

  /**
   * Calcula o custo indireto por hora conforme documento
   * Passo 1: Somar todos os custos indiretos mensais da tabela custos_indiretos
   * Passo 2: Calcular total de horas produtivas da empresa
   * Passo 3: Dividir custos indiretos pelas horas produtivas
   */
  private async calcularCustoIndiretoPorHora(loja: any, lojaId: string): Promise<{ custoPorHora: number, custosDetalhados: any[] }> {
    // Buscar todos os custos indiretos ativos da loja
    const custosIndiretos = await this.prisma.custoIndireto.findMany({
      where: {
        loja_id: lojaId,
        ativo: true,
      },
    });

    // Calcular total dos custos indiretos mensais
    const totalCustosIndiretosMensais = custosIndiretos.reduce((total, custo) => {
      return total + Number(custo.valor_mensal);
    }, 0);

    // Se não há custos indiretos configurados, retornar 0
    if (totalCustosIndiretosMensais === 0) {
      return { custoPorHora: 0, custosDetalhados: [] };
    }

    // Usar horas produtivas configuradas na loja ou valor padrão
    const horasProdutivasMes = loja.horas_produtivas_mensais || 352;
    const custoPorHora = totalCustosIndiretosMensais / horasProdutivasMes;

    return { custoPorHora, custosDetalhados: custosIndiretos };
  }

  /**
   * Calcula os custos diretos de materiais
   */
  private calcularCustosDirectos(itens: any[], insumos: any[]): { custoMaterial: number, itensCalculados: ItemOrcamentoCalculadoDto[] } {
    let custoMaterial = 0;
    const itensCalculados: ItemOrcamentoCalculadoDto[] = [];

    for (const item of itens) {
      const insumo = insumos.find(i => i.id === item.insumo_id);
      if (!insumo) continue;

      // Calcular custo por unidade de uso
      const custoUnitario = this.calcularCustoPorUnidadeUso(insumo);
      const quantidade = Number(item.quantidade);
      const custoTotal = custoUnitario * quantidade;

      custoMaterial += custoTotal;

      itensCalculados.push({
        insumo_id: insumo.id,
        nome_insumo: insumo.nome,
        quantidade,
        custo_unitario: custoUnitario,
        custo_total: custoTotal,
        unidade_medida: insumo.unidade_uso,
      });
    }

    return { custoMaterial, itensCalculados };
  }

  /**
   * Calcula o custo por unidade de uso do insumo
   */
  private calcularCustoPorUnidadeUso(insumo: any): number {
    if (!insumo || !insumo.custo_unitario || !insumo.quantidade_compra || !insumo.fator_conversao) {
      return 0;
    }
    
    const custo = Number(insumo.custo_unitario);
    const quantidade = Number(insumo.quantidade_compra);
    const fator = Number(insumo.fator_conversao);
    
    if (quantidade > 0 && fator > 0) {
      return custo / (quantidade * fator);
    }
    
    return 0;
  }

  /**
   * Calcula o custo de mão de obra direta
   */
  private calcularCustoMaoObra(horasProducao: number, custoMaoObraPorHora: number): number {
    return horasProducao * custoMaoObraPorHora;
  }

  /**
   * Calcula o custo de maquinaria
   */
  private calcularCustoMaquinaria(horasProducao: number, custoMaquinariaPorHora: number): number {
    return horasProducao * custoMaquinariaPorHora;
  }

  /**
   * Calcula o custo indireto alocado para este trabalho
   */
  private calcularCustoIndiretolAlocado(horasProducao: number, custoIndiretoPorHora: number): number {
    return horasProducao * custoIndiretoPorHora;
  }

  /**
   * Calcula os custos de máquinas
   */
  private async calcularCustosMaquinas(maquinas: any[], lojaId: string): Promise<{ custoTotal: number, maquinasCalculadas: any[] }> {
    if (!maquinas || maquinas.length === 0) {
      return { custoTotal: 0, maquinasCalculadas: [] };
    }

    const maquinaIds = maquinas.map(m => m.maquina_id);
    const maquinasData = await this.prisma.maquina.findMany({
      where: {
        id: { in: maquinaIds },
        loja_id: lojaId,
      },
    });

    let custoTotal = 0;
    const maquinasCalculadas: any[] = [];

    for (const maquina of maquinas) {
      const maquinaData = maquinasData.find(m => m.id === maquina.maquina_id);
      if (!maquinaData) continue;

      const custoPorHora = Number(maquinaData.custo_hora);
      const horasUtilizadas = Number(maquina.horas_utilizadas);
      const custoTotalMaquina = custoPorHora * horasUtilizadas;

      custoTotal += custoTotalMaquina;

      maquinasCalculadas.push({
        maquina_id: maquinaData.id,
        nome_maquina: maquinaData.nome,
        tipo_maquina: maquinaData.tipo,
        horas_utilizadas: horasUtilizadas,
        custo_por_hora: custoPorHora,
        custo_total: custoTotalMaquina,
      });
    }

    return { custoTotal, maquinasCalculadas };
  }

  /**
   * Calcula os custos de funções (mão de obra)
   */
  private async calcularCustosFuncoes(funcoes: any[], lojaId: string): Promise<{ custoTotal: number, funcoesCalculadas: any[] }> {
    if (!funcoes || funcoes.length === 0) {
      return { custoTotal: 0, funcoesCalculadas: [] };
    }

    const funcaoIds = funcoes.map(f => f.funcao_id);
    const funcoesData = await this.prisma.funcao.findMany({
      where: {
        id: { in: funcaoIds },
        loja_id: lojaId,
      },
      include: {
        maquina: true,
      },
    });

    let custoTotal = 0;
    const funcoesCalculadas: any[] = [];

    for (const funcao of funcoes) {
      const funcaoData = funcoesData.find(f => f.id === funcao.funcao_id);
      if (!funcaoData) continue;

      const custoPorHora = Number(funcaoData.custo_hora);
      const horasTrabalhadas = Number(funcao.horas_trabalhadas);
      const custoTotalFuncao = custoPorHora * horasTrabalhadas;

      custoTotal += custoTotalFuncao;

      funcoesCalculadas.push({
        funcao_id: funcaoData.id,
        nome_funcao: funcaoData.nome,
        horas_trabalhadas: horasTrabalhadas,
        custo_por_hora: custoPorHora,
        custo_total: custoTotalFuncao,
        maquina_vinculada: funcaoData.maquina?.nome,
      });
    }

    return { custoTotal, funcoesCalculadas };
  }

  /**
   * CRUD Operations para Orçamentos
   */

  async create(createOrcamentoDto: CreateOrcamentoDto, lojaId: string) {
    // 1. Calcular o orçamento usando o motor existente
    const calculoDto: CalcularOrcamentoDto = {
      nome_servico: createOrcamentoDto.nome_servico,
      descricao: createOrcamentoDto.descricao,
      horas_producao: createOrcamentoDto.horas_producao,
      itens: createOrcamentoDto.itens,
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
        nome_servico: createOrcamentoDto.nome_servico,
        descricao: createOrcamentoDto.descricao,
        horas_producao: createOrcamentoDto.horas_producao,
        custo_material: resultado.custos.custo_material,
        custo_mao_obra: resultado.custos.custo_mao_obra,
        custo_indireto: resultado.custos.custo_indireto,
        custo_total: resultado.custos.custo_total_producao,
        margem_lucro: resultado.custos.margem_lucro_percentual,
        impostos: resultado.custos.impostos_percentual,
        preco_final: resultado.custos.preco_final,
        loja_id: lojaId,
        cliente_id: createOrcamentoDto.cliente_id,
      },
    });

    // 4. Criar os itens do orçamento
    const itensData = resultado.itens.map(item => ({
      orcamento_id: orcamento.id,
      insumo_id: item.insumo_id,
      quantidade: item.quantidade,
      custo_unitario: item.custo_unitario,
      custo_total: item.custo_total,
    }));

    await this.prisma.itemOrcamento.createMany({
      data: itensData,
    });

    return this.findOne(orcamento.id, lojaId);
  }

  async findAll(lojaId: string) {
    return this.prisma.orcamento.findMany({
      where: { loja_id: lojaId },
      include: {
        cliente: true,
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
      },
      orderBy: { criado_em: 'desc' },
    });
  }

  async findOne(id: string, lojaId: string) {
    const orcamento = await this.prisma.orcamento.findFirst({
      where: { 
        id,
        loja_id: lojaId,
      },
      include: {
        cliente: true,
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

    // Se houver mudanças nos itens ou parâmetros, recalcular
    if (updateOrcamentoDto.itens || updateOrcamentoDto.horas_producao || 
        updateOrcamentoDto.margem_lucro_customizada || updateOrcamentoDto.impostos_customizados) {
      
      // Recalcular usando o motor
      const calculoDto: CalcularOrcamentoDto = {
        nome_servico: updateOrcamentoDto.nome_servico || '',
        descricao: updateOrcamentoDto.descricao,
        horas_producao: updateOrcamentoDto.horas_producao || 0,
        itens: updateOrcamentoDto.itens || [],
        cliente_id: updateOrcamentoDto.cliente_id,
        margem_lucro_customizada: updateOrcamentoDto.margem_lucro_customizada,
        impostos_customizados: updateOrcamentoDto.impostos_customizados,
      };

      const resultado = await this.calcularOrcamento(calculoDto, lojaId);

      // Atualizar com os novos valores calculados
      await this.prisma.orcamento.update({
        where: { id },
        data: {
          nome_servico: updateOrcamentoDto.nome_servico,
          descricao: updateOrcamentoDto.descricao,
          horas_producao: updateOrcamentoDto.horas_producao,
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

      // Se houver novos itens, atualizar
      if (updateOrcamentoDto.itens) {
        // Remover itens antigos
        await this.prisma.itemOrcamento.deleteMany({
          where: { orcamento_id: id },
        });

        // Criar novos itens
        const itensData = resultado.itens.map(item => ({
          orcamento_id: id,
          insumo_id: item.insumo_id,
          quantidade: item.quantidade,
          custo_unitario: item.custo_unitario,
          custo_total: item.custo_total,
        }));

        await this.prisma.itemOrcamento.createMany({
          data: itensData,
        });
      }
    } else {
      // Atualização simples sem recálculo
      await this.prisma.orcamento.update({
        where: { id },
        data: {
          nome_servico: updateOrcamentoDto.nome_servico,
          descricao: updateOrcamentoDto.descricao,
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
