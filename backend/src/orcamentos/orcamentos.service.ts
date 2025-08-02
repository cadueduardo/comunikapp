import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificacoesService, TipoNotificacao } from '../notificacoes/notificacoes.service';
import { MailService } from '../mail/mail.service';
import { CalcularOrcamentoDto } from './dto/calcular-orcamento.dto';
import { ResultadoCalculoDto, ItemOrcamentoCalculadoDto, DetalhamentoCustoDto } from './dto/resultado-calculo.dto';
import { CreateOrcamentoDto } from './dto/create-orcamento.dto';
import { UpdateOrcamentoDto } from './dto/update-orcamento.dto';

@Injectable()
export class OrcamentosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificacoesService: NotificacoesService,
    private readonly mailService: MailService
  ) {}

  /**
   * Motor de cálculo principal - Tarefa 2.5
   * Implementa a lógica conforme calculo-custos-orcamento.md
   */
  async calcularOrcamento(dto: CalcularOrcamentoDto, lojaId: string): Promise<ResultadoCalculoDto> {
    console.log('💰 Calculando orçamento...');
    
    // 1. Buscar configurações da loja
    const loja = await this.prisma.loja.findUnique({
      where: { id: lojaId },
    });

    if (!loja) {
      throw new NotFoundException('Loja não encontrada');
    }

    console.log('🔍 Debug - calcularOrcamento - Configurações da loja:', {
      margem_lucro_padrao: loja.margem_lucro_padrao,
      impostos_padrao: loja.impostos_padrao,
      horas_produtivas_mensais: loja.horas_produtivas_mensais
    });

    // 2. Validar se as configurações necessárias estão preenchidas
    // Custos indiretos são opcionais, mas recomendados
    if (!loja.custos_indiretos_mensais) {
      // Aviso: Custos indiretos não configurados na loja
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
        tipoMaterial: true,
      },
    });

    if (insumos.length !== insumoIds.length) {
      throw new BadRequestException('Um ou mais insumos não foram encontrados');
    }

    console.log('🔍 Debug - calcularOrcamento - Insumos encontrados:', insumos.length);

    // 4. Buscar máquinas e funções se fornecidas
    const maquinasCalculadas = await this.calcularCustosMaquinas(dto.maquinas || [], lojaId);
    const funcoesCalculadas = await this.calcularCustosFuncoes(dto.funcoes || [], lojaId);

    console.log('🔍 Debug - calcularOrcamento - Custos de máquinas:', maquinasCalculadas);
    console.log('🔍 Debug - calcularOrcamento - Custos de funções:', funcoesCalculadas);

    // 5. Calcular custo indireto por hora
    const { custoPorHora: custoIndiretoPorHora, custosDetalhados } = await this.calcularCustoIndiretoPorHora(loja, lojaId);
    
    console.log('🔍 Debug - calcularOrcamento - Custo indireto por hora:', custoIndiretoPorHora);
    
    // Garantir que custosDetalhados seja sempre um array
    const custosDetalhadosArray = custosDetalhados || [];

    // 6. Calcular custos diretos
    const { custoMaterial, itensCalculados } = this.calcularCustosDirectos(dto.itens, insumos);

    console.log('🔍 Debug - calcularOrcamento - Custo material:', custoMaterial);

    // 7. Calcular custo indireto alocado
    const custoIndiretolAlocado = this.calcularCustoIndiretolAlocado(dto.horas_producao, custoIndiretoPorHora);

    console.log('🔍 Debug - calcularOrcamento - Custo indireto alocado:', custoIndiretolAlocado);

    // 8. Aplicar quantidade do produto aos custos
    const quantidadeProduto = dto.quantidade_produto || 1;
    
    console.log('🔍 Debug - Backend - Quantidade do produto:', {
      quantidadeRecebida: dto.quantidade_produto,
      quantidadeFinal: quantidadeProduto,
      tipo: typeof dto.quantidade_produto
    });
    
    console.log('🔍 Debug - Backend - Dados recebidos:', {
      itens: dto.itens?.length || 0,
      maquinas: dto.maquinas?.length || 0,
      funcoes: dto.funcoes?.length || 0,
      horas_producao: dto.horas_producao,
      margem_lucro: dto.margem_lucro_customizada,
      impostos: dto.impostos_customizados
    });
    
    console.log('🔍 Debug - Backend - Custos antes da quantidade:', {
      custoMaterial,
      custoMaquinas: maquinasCalculadas.custoTotal,
      custoFuncoes: funcoesCalculadas.custoTotal,
      custoIndiretolAlocado
    });
    
    const custoMaterialComQuantidade = custoMaterial * quantidadeProduto;
    const custoMaquinasComQuantidade = maquinasCalculadas.custoTotal * quantidadeProduto;
    const custoFuncoesComQuantidade = funcoesCalculadas.custoTotal * quantidadeProduto;
    const custoIndiretolAlocadoComQuantidade = custoIndiretolAlocado * quantidadeProduto;

    console.log('🔍 Debug - calcularOrcamento - Custos com quantidade:', {
      custoMaterialComQuantidade,
      custoMaquinasComQuantidade,
      custoFuncoesComQuantidade,
      custoIndiretolAlocadoComQuantidade
    });

    // 9. Calcular custo total de produção
    const custoTotalProducao = custoMaterialComQuantidade + custoMaquinasComQuantidade + custoFuncoesComQuantidade + custoIndiretolAlocadoComQuantidade;

    console.log('🔍 Debug - calcularOrcamento - Custo total de produção:', custoTotalProducao);

    // 10. Aplicar margem de lucro e impostos
    const margemLucro = dto.margem_lucro_customizada || Number(loja.margem_lucro_padrao || 0);
    const impostos = dto.impostos_customizados || Number(loja.impostos_padrao || 0);

    const margemLucroValor = custoTotalProducao * (margemLucro / 100);
    const subtotalComLucro = custoTotalProducao + margemLucroValor;
    const impostosValor = subtotalComLucro * (impostos / 100);
    const precoFinal = subtotalComLucro + impostosValor;
    
    console.log('🔍 Debug - Backend - Cálculo do preço final:', {
      custoTotalProducao,
      margemLucro,
      margemLucroValor,
      subtotalComLucro,
      impostos,
      impostosValor,
      precoFinal,
      quantidadeProduto
    });

    // Salvar cálculo detalhado em arquivo
    const fs = require('fs');
    const calculoDebug = {
      timestamp: new Date().toISOString(),
      custoTotalProducao,
      margemLucro,
      margemLucroValor,
      subtotalComLucro,
      impostos,
      impostosValor,
      precoFinal,
      quantidadeProduto,
      custoMaterialComQuantidade,
      custoMaquinasComQuantidade,
      custoFuncoesComQuantidade,
      custoIndiretolAlocadoComQuantidade
    };
    fs.writeFileSync('debug_calculo_detalhado.json', JSON.stringify(calculoDebug, null, 2));
    console.log('🔍 Debug - Cálculo detalhado salvo em debug_calculo_detalhado.json');

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
        custo_material: custoMaterialComQuantidade,
        custo_mao_obra: custoFuncoesComQuantidade,
        custo_maquinaria: custoMaquinasComQuantidade,
        custo_indireto: custoIndiretolAlocadoComQuantidade,
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

    return resultado;
  }

  /**
   * Calcula o custo indireto por hora conforme documento
   * Passo 1: Somar todos os custos indiretos mensais da tabela custos_indiretos
   * Passo 2: Calcular total de horas produtivas da empresa
   * Passo 3: Dividir custos indiretos pelas horas produtivas
   */
  private async calcularCustoIndiretoPorHora(loja: any, lojaId: string): Promise<{ custoPorHora: number, custosDetalhados: any[] }> {
    console.log('🔍 Debug - calcularCustoIndiretoPorHora - Iniciando cálculo para loja:', lojaId);
    
    // Buscar todos os custos indiretos ativos da loja
    const custosIndiretos = await this.prisma.custoIndireto.findMany({
      where: {
        loja_id: lojaId,
        ativo: true,
      },
    });

    console.log('🔍 Debug - calcularCustoIndiretoPorHora - Custos indiretos encontrados:', custosIndiretos.length);
    console.log('🔍 Debug - calcularCustoIndiretoPorHora - Detalhes dos custos:', JSON.stringify(custosIndiretos, null, 2));

    // Calcular total dos custos indiretos mensais
    const totalCustosIndiretosMensais = custosIndiretos.reduce((total, custo) => {
      return total + Number(custo.valor_mensal);
    }, 0);

    console.log('🔍 Debug - calcularCustoIndiretoPorHora - Total custos indiretos mensais:', totalCustosIndiretosMensais);

    // Se não há custos indiretos configurados, retornar 0
    if (totalCustosIndiretosMensais === 0) {
      console.log('🔍 Debug - calcularCustoIndiretoPorHora - Nenhum custo indireto encontrado, retornando 0');
      return { custoPorHora: 0, custosDetalhados: [] };
    }

    // Usar horas produtivas configuradas na loja ou valor padrão
    const horasProdutivasMes = loja.horas_produtivas_mensais || 352;
    const custoPorHora = totalCustosIndiretosMensais / horasProdutivasMes;

    console.log('🔍 Debug - calcularCustoIndiretoPorHora - Horas produtivas por mês:', horasProdutivasMes);
    console.log('🔍 Debug - calcularCustoIndiretoPorHora - Custo por hora calculado:', custoPorHora);

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
      
      // Calcular quantidade baseada na lógica personalizada se aplicável
      let quantidade = Number(item.quantidade);
      
      // Se o insumo tem tipo de material personalizado, aplicar lógica específica
      if (insumo.tipoMaterial && insumo.logica_consumo === 'custom') {
        quantidade = this.calcularQuantidadePersonalizada(insumo, item);
      }
      
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
   * Calcula quantidade personalizada baseada na lógica do TipoMaterial
   */
  private calcularQuantidadePersonalizada(insumo: any, item: any): number {
    if (!insumo.tipoMaterial || !insumo.tipoMaterial.parametros_padrao) {
      return Number(item.quantidade);
    }

    const parametros = insumo.tipoMaterial.parametros_padrao;
    const areaProduto = Number(item.area_produto) || 0;
    const larguraProduto = Number(item.largura_produto) || 0;
    const alturaProduto = Number(item.altura_produto) || 0;

    switch (insumo.tipoMaterial.logica_consumo) {
      case 'area':
        // Quantidade baseada na área do produto
        if (parametros.quantidade_por_m2 && areaProduto > 0) {
          return areaProduto * Number(parametros.quantidade_por_m2);
        }
        break;

      case 'perimetro':
        // Quantidade baseada no perímetro do produto
        if (parametros.espacamento && larguraProduto > 0 && alturaProduto > 0) {
          const perimetro = 2 * (larguraProduto + alturaProduto);
          const espacamento = Number(parametros.espacamento);
          return Math.ceil(perimetro / espacamento);
        }
        break;

      case 'quantidade_fixa':
        // Quantidade fixa independente do produto
        if (parametros.quantidade_fixa) {
          return Number(parametros.quantidade_fixa);
        }
        break;

      case 'custom':
        // Lógica customizada baseada nos parâmetros
        if (parametros.tipo_calculo) {
          switch (parametros.tipo_calculo) {
            case 'espacamento':
              if (parametros.espacamento && larguraProduto > 0 && alturaProduto > 0) {
                const perimetro = 2 * (larguraProduto + alturaProduto);
                const espacamento = Number(parametros.espacamento);
                return Math.ceil(perimetro / espacamento);
              }
              break;

            case 'quantidade_por_m2':
              if (parametros.quantidade_por_m2 && areaProduto > 0) {
                return areaProduto * Number(parametros.quantidade_por_m2);
              }
              break;

            case 'multiplicador':
              if (parametros.multiplicador) {
                return Number(item.quantidade) * Number(parametros.multiplicador);
              }
              break;

            case 'quantidade_fixa':
              if (parametros.quantidade_fixa) {
                return Number(parametros.quantidade_fixa);
              }
              break;
          }
        }
        break;
    }

    // Se não conseguiu calcular, retorna a quantidade original
    return Number(item.quantidade);
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
      // Se temos dimensões e tipo de cálculo, usar a lógica específica
      if (insumo.altura && insumo.unidade_dimensao && insumo.tipo_calculo) {
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
              const custoPorUnidade = custo / quantidade;
              
              if (insumo.unidade_uso === 'CENTIMETRO' || insumo.unidade_uso === 'CM') {
                // Se a unidade de uso é centímetro, calcular custo por centímetro
                // Para cordão: custo por metro ÷ 100 = custo por centímetro
                const custoPorCentimetro = custoPorUnidade / 100;
                
                return custoPorCentimetro;
              } else {
                // Para outras unidades de uso, usar o cálculo padrão
                return custoPorUnidade;
              }
              
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
                  
                  const areaPorUnidade = larguraEmMetros * alturaEmMetros;
                  
                  if (insumo.unidade_uso === 'METRO QUADRADO') {
                    // Se a unidade de uso é metro quadrado, calcular custo por m²
                    const custoPorMetroQuadrado = custo / areaPorUnidade;
                    
                    return custoPorMetroQuadrado;
                  } else {
                    // Para outras unidades de uso, usar o cálculo padrão
                    return custo / quantidade;
                  }
                }
              } else {
                return custo / quantidade;
              }
              break;
              
            case 'QUANTIDADE':
              // Para quantidade fixa: usar quantidade diretamente
              return custo / quantidade;
              
            default:
              // Padrão: usar quantidade diretamente
              return custo / quantidade;
          }
        }
      }
      
      // Cálculo padrão: custo / (quantidade * fator)
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
    // DTO recebido para criação
    
    // Salvar DTO em arquivo para debug
    const fs = require('fs');
    const debugData = {
      timestamp: new Date().toISOString(),
      dto: createOrcamentoDto,
      lojaId
    };
    fs.writeFileSync('debug_orcamento_dto.json', JSON.stringify(debugData, null, 2));
    console.log('🔍 Debug - DTO salvo em debug_orcamento_dto.json');
    
    // 1. Calcular o orçamento usando o motor existente
    const calculoDto: CalcularOrcamentoDto = {
      nome_servico: createOrcamentoDto.nome_servico,
      descricao: createOrcamentoDto.descricao,
      horas_producao: createOrcamentoDto.horas_producao,
      quantidade_produto: createOrcamentoDto.quantidade_produto || 1, // Adicionar quantidade do produto
      itens: createOrcamentoDto.itens,
      maquinas: createOrcamentoDto.maquinas,
      funcoes: createOrcamentoDto.funcoes,
      cliente_id: createOrcamentoDto.cliente_id,
      margem_lucro_customizada: createOrcamentoDto.margem_lucro_customizada,
      impostos_customizados: createOrcamentoDto.impostos_customizados,
    };

    // Executando cálculo...

    const resultado = await this.calcularOrcamento(calculoDto, lojaId);

    // Cálculo concluído

    // Salvar resultado em arquivo para debug
    const resultadoDebug = {
      timestamp: new Date().toISOString(),
      resultado: resultado
    };
    fs.writeFileSync('debug_orcamento_resultado.json', JSON.stringify(resultadoDebug, null, 2));
    console.log('🔍 Debug - Resultado salvo em debug_orcamento_resultado.json');

    // 2. Gerar número único do orçamento
    const numero = await this.gerarNumeroOrcamento(lojaId);

    // 3. Criar o orçamento no banco
    const dadosParaSalvar = {
      numero,
      nome_servico: createOrcamentoDto.nome_servico,
      descricao: createOrcamentoDto.descricao,
      horas_producao: createOrcamentoDto.horas_producao,
      largura_produto: createOrcamentoDto.largura_produto,
      altura_produto: createOrcamentoDto.altura_produto,
      area_produto: createOrcamentoDto.area_produto,
      unidade_medida_produto: createOrcamentoDto.unidade_medida_produto,
      quantidade_produto: createOrcamentoDto.quantidade_produto || 1,
      custo_material: resultado.custos.custo_material,
      custo_mao_obra: resultado.custos.custo_mao_obra,
      custo_indireto: resultado.custos.custo_indireto,
      custo_total: resultado.custos.custo_total_producao,
      margem_lucro: resultado.custos.margem_lucro_percentual,
      impostos: resultado.custos.impostos_percentual,
      preco_final: resultado.custos.preco_final,
      // Configurações comerciais
      prazo_entrega: createOrcamentoDto.prazo_entrega,
      forma_pagamento: createOrcamentoDto.forma_pagamento,
      validade_proposta: createOrcamentoDto.validade_proposta,
      atendente: createOrcamentoDto.atendente,
      loja_id: lojaId,
      cliente_id: createOrcamentoDto.cliente_id,
    };

    console.log('🔍 Debug - Backend - Dados sendo salvos no banco:', {
      preco_final: dadosParaSalvar.preco_final,
      quantidade_produto: dadosParaSalvar.quantidade_produto,
      custo_total: dadosParaSalvar.custo_total,
      custo_material: dadosParaSalvar.custo_material,
      custo_mao_obra: dadosParaSalvar.custo_mao_obra,
      custo_indireto: dadosParaSalvar.custo_indireto,
      margem_lucro: dadosParaSalvar.margem_lucro,
      impostos: dadosParaSalvar.impostos,
      maquinas_count: resultado.maquinas?.length || 0,
      funcoes_count: resultado.funcoes?.length || 0
    });
    
    // Salvar dados para salvar em arquivo
    const dadosDebug = {
      timestamp: new Date().toISOString(),
      dadosParaSalvar: dadosParaSalvar
    };
    fs.writeFileSync('debug_orcamento_dados_salvar.json', JSON.stringify(dadosDebug, null, 2));
    console.log('🔍 Debug - Dados para salvar em debug_orcamento_dados_salvar.json');
    
    const orcamento = await this.prisma.orcamento.create({
      data: dadosParaSalvar,
    });

    console.log('🔍 Debug - Backend - Orçamento salvo no banco:', {
      id: orcamento.id,
      preco_final: orcamento.preco_final,
      custo_total: orcamento.custo_total,
      margem_lucro: orcamento.margem_lucro,
      impostos: orcamento.impostos
    });

    // Salvar orçamento salvo em arquivo
    const orcamentoDebug = {
      timestamp: new Date().toISOString(),
      orcamento: orcamento
    };
    fs.writeFileSync('debug_orcamento_salvo.json', JSON.stringify(orcamentoDebug, null, 2));
    console.log('🔍 Debug - Orçamento salvo em debug_orcamento_salvo.json');

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

    // 5. Criar as máquinas do orçamento
    if (resultado.maquinas && resultado.maquinas.length > 0) {
      const maquinasData = resultado.maquinas.map(maquina => ({
        orcamento_id: orcamento.id,
        maquina_id: maquina.maquina_id,
        horas_utilizadas: maquina.horas_utilizadas,
        custo_total: maquina.custo_total,
      }));

      await this.prisma.maquinaOrcamento.createMany({
        data: maquinasData,
      });

      console.log('🔍 Máquinas salvas:', maquinasData.length);
    }

    // 6. Criar as funções do orçamento
    if (resultado.funcoes && resultado.funcoes.length > 0) {
      const funcoesData = resultado.funcoes.map(funcao => ({
        orcamento_id: orcamento.id,
        funcao_id: funcao.funcao_id,
        horas_trabalhadas: funcao.horas_trabalhadas,
        custo_total: funcao.custo_total,
      }));

      await this.prisma.funcaoOrcamento.createMany({
        data: funcoesData,
      });

      console.log('🔍 Funções salvas:', funcoesData.length);
    }

    return this.findOne(orcamento.id, lojaId);
  }

  async salvarRascunho(createOrcamentoDto: CreateOrcamentoDto, lojaId: string) {
    // 1. Calcular o orçamento usando o motor existente
    const calculoDto: CalcularOrcamentoDto = {
      nome_servico: createOrcamentoDto.nome_servico,
      descricao: createOrcamentoDto.descricao,
      horas_producao: createOrcamentoDto.horas_producao,
      quantidade_produto: createOrcamentoDto.quantidade_produto || 1,
      itens: createOrcamentoDto.itens,
      maquinas: createOrcamentoDto.maquinas,
      funcoes: createOrcamentoDto.funcoes,
      cliente_id: createOrcamentoDto.cliente_id,
      margem_lucro_customizada: createOrcamentoDto.margem_lucro_customizada,
      impostos_customizados: createOrcamentoDto.impostos_customizados,
    };

    const resultado = await this.calcularOrcamento(calculoDto, lojaId);

    // 2. Gerar número único do orçamento
    const numero = await this.gerarNumeroOrcamento(lojaId);

    // 3. Criar o orçamento como rascunho
    const dadosParaSalvar = {
      numero,
      nome_servico: createOrcamentoDto.nome_servico,
      descricao: createOrcamentoDto.descricao,
      horas_producao: createOrcamentoDto.horas_producao,
      largura_produto: createOrcamentoDto.largura_produto,
      altura_produto: createOrcamentoDto.altura_produto,
      area_produto: createOrcamentoDto.area_produto,
      unidade_medida_produto: createOrcamentoDto.unidade_medida_produto,
      quantidade_produto: createOrcamentoDto.quantidade_produto || 1,
      custo_material: resultado.custos.custo_material,
      custo_mao_obra: resultado.custos.custo_mao_obra,
      custo_indireto: resultado.custos.custo_indireto,
      custo_total: resultado.custos.custo_total_producao,
      margem_lucro: resultado.custos.margem_lucro_percentual,
      impostos: resultado.custos.impostos_percentual,
      preco_final: resultado.custos.preco_final,
      status: 'rascunho', // Status como rascunho
      loja_id: lojaId,
      cliente_id: createOrcamentoDto.cliente_id,
    };

    console.log('🔍 Debug - Backend - SalvarRascunho - Dados sendo salvos:', {
      preco_final: dadosParaSalvar.preco_final,
      quantidade_produto: dadosParaSalvar.quantidade_produto,
      custo_total: dadosParaSalvar.custo_total
    });
    
    const orcamento = await this.prisma.orcamento.create({
      data: dadosParaSalvar,
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

    // 5. Criar as máquinas do orçamento
    if (resultado.maquinas && resultado.maquinas.length > 0) {
      const maquinasData = resultado.maquinas.map(maquina => ({
        orcamento_id: orcamento.id,
        maquina_id: maquina.maquina_id,
        horas_utilizadas: maquina.horas_utilizadas,
        custo_total: maquina.custo_total,
      }));

      await this.prisma.maquinaOrcamento.createMany({
        data: maquinasData,
      });
    }

    // 6. Criar as funções do orçamento
    if (resultado.funcoes && resultado.funcoes.length > 0) {
      const funcoesData = resultado.funcoes.map(funcao => ({
        orcamento_id: orcamento.id,
        funcao_id: funcao.funcao_id,
        horas_trabalhadas: funcao.horas_trabalhadas,
        custo_total: funcao.custo_total,
      }));

      await this.prisma.funcaoOrcamento.createMany({
        data: funcoesData,
      });
    }

    // 7. Registrar log de criação do rascunho
    await this.registrarLog(orcamento.id, 'CRIADO', 'Rascunho de orçamento criado');

    return this.findOne(orcamento.id, lojaId);
  }

  async enviarOrcamento(id: string, lojaId: string) {
    // 1. Verificar se o orçamento existe e é um rascunho
    const orcamento = await this.prisma.orcamento.findFirst({
      where: {
        id,
        loja_id: lojaId,
        status: 'rascunho',
      },
      include: {
        cliente: true,
        loja: true,
      },
    });

    if (!orcamento) {
      throw new NotFoundException('Orçamento não encontrado ou não é um rascunho');
    }

    if (!orcamento.cliente) {
      throw new BadRequestException('Orçamento deve ter um cliente associado para ser enviado');
    }

    // 2. Gerar código de aprovação único
    const codigoAprovacao = await this.gerarCodigoAprovacao();

    // 3. Atualizar orçamento para enviado
    const orcamentoAtualizado = await this.prisma.orcamento.update({
      where: { id },
      data: {
        status: 'enviado',
        codigo_aprovacao: codigoAprovacao,
        status_aprovacao: 'PENDENTE',
      },
    });

    // 4. Registrar log de envio
    await this.registrarLog(id, 'ENVIADO', 'Orçamento enviado para o cliente');

    // 5. Enviar email para o cliente
    if (orcamento.cliente?.email) {
      console.log('📧 ============================================');
      console.log('📧 ENVIANDO EMAIL PARA CLIENTE');
      console.log('📧 ============================================');
      console.log('📧 Cliente:', orcamento.cliente.nome);
      console.log('📧 Email:', orcamento.cliente.email);
      console.log('📧 Orçamento:', orcamento.numero);
      console.log('📧 Código de Aprovação:', codigoAprovacao);
      
      const linkPublico = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/orcamento/${orcamento.id}`;
      console.log('📧 Link Público:', linkPublico);
      console.log('📧 ============================================');
      
      await this.mailService.enviarOrcamentoCliente(
        orcamento.cliente.email,
        orcamento.cliente.nome,
        orcamento.numero,
        orcamento.nome_servico,
        Number(orcamento.preco_final),
        codigoAprovacao,
        linkPublico
      );
      
      console.log('📧 EMAIL ENVIADO COM SUCESSO! ✅');
      console.log('📧 ============================================');
    } else {
      console.log('❌ CLIENTE SEM EMAIL - Email não enviado');
      console.log('❌ Cliente ID:', orcamento.cliente_id);
    }

    return this.findOne(id, lojaId);
  }

  private async gerarCodigoAprovacao(): Promise<string> {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let codigo: string;
    let tentativas = 0;
    const maxTentativas = 10;

    do {
      codigo = '';
      for (let i = 0; i < 8; i++) {
        codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
      }
      tentativas++;

      // Verificar se o código já existe
      const existe = await this.prisma.orcamento.findUnique({
        where: { codigo_aprovacao: codigo },
      });

      if (!existe) {
        return codigo;
      }
    } while (tentativas < maxTentativas);

    throw new Error('Não foi possível gerar um código único após várias tentativas');
  }

  async aprovarOrcamento(codigo: string) {
    console.log('🔍 ===== DEBUG APROVAÇÃO =====');
    console.log('🔍 Código recebido (raw):', JSON.stringify(codigo));
    console.log('🔍 Código length:', codigo?.length);
    console.log('🔍 Código trimmed:', codigo?.trim());
    console.log('🔍 Código char codes:', Array.from(codigo || '').map(c => c.charCodeAt(0)));
    
    // Validar se o código foi fornecido
    if (!codigo || typeof codigo !== 'string') {
      throw new BadRequestException('Código de aprovação é obrigatório');
    }
    
    // Limpar o código de espaços em branco e converter para maiúsculo
    const codigoLimpo = codigo.trim().toUpperCase();
    console.log('🔍 Código limpo:', codigoLimpo);
    console.log('🔍 Código limpo char codes:', Array.from(codigoLimpo).map(c => c.charCodeAt(0)));
    
    // Validar se o código tem o formato esperado (8 caracteres)
    if (codigoLimpo.length !== 8) {
      throw new BadRequestException('Código de aprovação deve ter 8 caracteres');
    }
    
    // 1. Buscar orçamento pelo código
    const orcamento = await this.prisma.orcamento.findUnique({
      where: { codigo_aprovacao: codigoLimpo },
      include: {
        cliente: true,
        loja: true,
      },
    });

    console.log('🔍 Orçamento encontrado:', !!orcamento);
    if (orcamento) {
      console.log('🔍 Código no banco:', orcamento.codigo_aprovacao);
      console.log('🔍 Status:', orcamento.status);
      console.log('🔍 Status aprovação:', orcamento.status_aprovacao);
      console.log('🔍 ID do orçamento:', orcamento.id);
      console.log('🔍 Número do orçamento:', orcamento.numero);
    }

    if (!orcamento) {
      // Buscar todos os códigos existentes para debug
      const todosOrcamentos = await this.prisma.orcamento.findMany({
        where: {
          codigo_aprovacao: {
            not: null
          }
        },
        select: {
          id: true,
          numero: true,
          codigo_aprovacao: true,
          status: true,
          status_aprovacao: true
        }
      });
      
      console.log('🔍 Todos os códigos no banco:', todosOrcamentos.map(o => ({
        numero: o.numero,
        codigo: o.codigo_aprovacao,
        codigo_char_codes: Array.from(o.codigo_aprovacao || '').map(c => c.charCodeAt(0)),
        status: o.status,
        aprovacao: o.status_aprovacao
      })));
      
      throw new NotFoundException('Código de aprovação inválido');
    }

    // Validar se o orçamento está no status correto
    if (orcamento.status !== 'enviado' && orcamento.status !== 'negociando' && orcamento.status !== 'rascunho') {
      console.log('🔍 ERRO: Orçamento não está no status correto. Status atual:', orcamento.status);
      throw new BadRequestException('Orçamento não está no status correto para aprovação');
    }

    // Se o orçamento estiver como rascunho, enviar automaticamente
    if (orcamento.status === 'rascunho') {
      console.log('🔍 Orçamento está como rascunho. Enviando automaticamente...');
      
      // Atualizar status para enviado
      await this.prisma.orcamento.update({
        where: { id: orcamento.id },
        data: {
          status: 'enviado',
        },
      });
      
      console.log('🔍 ✅ Orçamento enviado automaticamente');
    }

    // Validar se o orçamento já foi aprovado
    if (orcamento.status_aprovacao === 'APROVADO') {
      console.log('🔍 ERRO: Orçamento já foi aprovado');
      throw new BadRequestException('Orçamento já foi aprovado');
    }

    // Validar se o orçamento foi rejeitado
    if (orcamento.status_aprovacao === 'REJEITADO') {
      console.log('🔍 ERRO: Orçamento foi rejeitado');
      throw new BadRequestException('Orçamento foi rejeitado e não pode ser aprovado');
    }

    console.log('🔍 ✅ Validações passaram. Aprovando orçamento...');
    console.log('🔍 ID do orçamento a ser aprovado:', orcamento.id);
    console.log('🔍 Status atual:', orcamento.status);
    console.log('🔍 Status aprovação atual:', orcamento.status_aprovacao);

    // 2. Atualizar status de aprovação
    const orcamentoAtualizado = await this.prisma.orcamento.update({
      where: { id: orcamento.id },
      data: {
        status_aprovacao: 'APROVADO',
      },
    });

    console.log('🔍 ✅ Orçamento atualizado com sucesso. Novo status:', orcamentoAtualizado.status_aprovacao);
    console.log('🔍 ✅ ID do orçamento atualizado:', orcamentoAtualizado.id);

    // 3. Registrar log de aprovação
    try {
      await this.registrarLog(orcamento.id, 'APROVADO', 'Orçamento aprovado pelo cliente');
      console.log('🔍 ✅ Log registrado com sucesso');
    } catch (error) {
      console.log('🔍 ⚠️ Erro ao registrar log:', error);
    }

    // 4. Criar notificação para a loja
    try {
      await this.notificacoesService.criarNotificacao(
        orcamento.loja_id,
        TipoNotificacao.ORCAMENTO_APROVADO,
        'Orçamento Aprovado',
        `O orçamento #${orcamento.numero} foi aprovado pelo cliente ${orcamento.cliente?.nome}`,
        orcamento.id
      );
      console.log('🔍 ✅ Notificação criada com sucesso');
    } catch (error) {
      console.log('🔍 ⚠️ Erro ao criar notificação:', error);
    }

    // 5. Enviar email de notificação para a loja
    if (orcamento.loja?.email) {
      try {
        await this.mailService.enviarNotificacaoAprovacao(
          orcamento.loja.email,
          orcamento.numero,
          orcamento.cliente?.nome || 'Cliente',
          Number(orcamento.preco_final)
        );
        console.log('🔍 ✅ Email enviado com sucesso');
      } catch (error) {
        console.log('🔍 ⚠️ Erro ao enviar email:', error);
      }
    }

    console.log('🔍 ✅ Aprovação concluída com sucesso!');
    console.log('🔍 ✅ Retornando resposta...');
    return { message: 'Orçamento aprovado com sucesso!' };
  }

  async criarHistoricoVersao(orcamentoId: string, dadosAnteriores: any, dadosNovos: any, motivo?: string, alteradoPor?: string) {
    // 1. Buscar versão atual
    const ultimaVersao = await this.prisma.orcamentoHistorico.findFirst({
      where: { orcamento_id: orcamentoId },
      orderBy: { versao: 'desc' },
    });

    const novaVersao = (ultimaVersao?.versao || 0) + 1;

    // 2. Calcular diferenças
    const alteracoes = this.calcularDiferencas(dadosAnteriores, dadosNovos);

    // 3. Criar registro de histórico
    return this.prisma.orcamentoHistorico.create({
      data: {
        orcamento_id: orcamentoId,
        versao: novaVersao,
        dados_anteriores: dadosAnteriores,
        dados_novos: dadosNovos,
        alteracoes: alteracoes,
        motivo: motivo,
        alterado_por: alteradoPor,
      },
    });
  }

  async registrarLog(orcamentoId: string, tipoAcao: string, descricao: string, dadosExtras?: any) {
    return this.prisma.orcamentoLog.create({
      data: {
        orcamento_id: orcamentoId,
        tipo_acao: tipoAcao,
        descricao: descricao,
        dados_extras: dadosExtras,
      },
    });
  }

  private calcularDiferencas(dadosAnteriores: any, dadosNovos: any): any {
    const alteracoes: any = {};

    // Comparar campos principais
    const campos = ['nome_servico', 'descricao', 'quantidade_produto', 'preco_final', 'margem_lucro', 'impostos'];
    
    campos.forEach(campo => {
      if (dadosAnteriores[campo] !== dadosNovos[campo]) {
        alteracoes[campo] = {
          anterior: dadosAnteriores[campo],
          novo: dadosNovos[campo],
        };
      }
    });

    return alteracoes;
  }

  async findAll(lojaId: string) {
    const orcamentos = await this.prisma.orcamento.findMany({
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

    // Orçamentos carregados com máquinas e funções

    return orcamentos;
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

    // Transformar dados para o formato esperado pelo frontend
    const dadosFormatados = {
      id: orcamento.id,
      status: orcamento.status,
      status_aprovacao: orcamento.status_aprovacao,
      cliente_id: orcamento.cliente_id,
      margem_lucro_customizada: orcamento.margem_lucro ? String(orcamento.margem_lucro) : undefined,
      impostos_customizados: orcamento.impostos ? String(orcamento.impostos) : undefined,
      condicoes_comerciais: '',
      itens_produto: [{
        nome_servico: orcamento.nome_servico,
        quantidade_produto: orcamento.quantidade_produto ? String(orcamento.quantidade_produto) : '1',
        descricao: orcamento.descricao,
        largura_produto: orcamento.largura_produto ? String(orcamento.largura_produto) : '',
        altura_produto: orcamento.altura_produto ? String(orcamento.altura_produto) : '',
        unidade_medida_produto: orcamento.unidade_medida_produto || '',
        area_produto: orcamento.area_produto ? String(orcamento.area_produto) : '',
        materiais: orcamento.itens.map(item => ({
          insumo_id: item.insumo_id,
          quantidade: String(item.quantidade)
        })),
        maquinas: orcamento.maquinas.map(maquina => ({
          maquina_id: maquina.maquina_id,
          horas_utilizadas: String(maquina.horas_utilizadas)
        })),
        funcoes: orcamento.funcoes.map(funcao => ({
          funcao_id: funcao.funcao_id,
          horas_trabalhadas: String(funcao.horas_trabalhadas)
        })),
      }]
    };

    return dadosFormatados;
  }

  async update(id: string, updateOrcamentoDto: UpdateOrcamentoDto, lojaId: string) {
    // Verificar se o orçamento existe
    await this.findOne(id, lojaId);

    // Se houver mudanças nos itens, máquinas, funções, quantidade ou parâmetros, recalcular
    const deveRecalcular = updateOrcamentoDto.itens || updateOrcamentoDto.maquinas || updateOrcamentoDto.funcoes || 
        updateOrcamentoDto.horas_producao || updateOrcamentoDto.quantidade_produto || 
        updateOrcamentoDto.margem_lucro_customizada || updateOrcamentoDto.impostos_customizados;
    
    if (deveRecalcular) {
      
      // Recalcular usando o motor
      const calculoDto: CalcularOrcamentoDto = {
        nome_servico: updateOrcamentoDto.nome_servico || '',
        descricao: updateOrcamentoDto.descricao,
        horas_producao: updateOrcamentoDto.horas_producao || 0,
        quantidade_produto: updateOrcamentoDto.quantidade_produto || 1,
        itens: updateOrcamentoDto.itens || [],
        maquinas: updateOrcamentoDto.maquinas || [],
        funcoes: updateOrcamentoDto.funcoes || [],
        cliente_id: updateOrcamentoDto.cliente_id,
        margem_lucro_customizada: updateOrcamentoDto.margem_lucro_customizada,
        impostos_customizados: updateOrcamentoDto.impostos_customizados,
      };

      const resultado = await this.calcularOrcamento(calculoDto, lojaId);

      console.log('🔍 Debug - Backend - Update - Dados sendo salvos:', {
        preco_final: resultado.custos.preco_final,
        quantidade_produto: updateOrcamentoDto.quantidade_produto,
        custo_total: resultado.custos.custo_total_producao
      });

      // Atualizar com os novos valores calculados
      const orcamentoAtualizado = await this.prisma.orcamento.update({
        where: { id },
        data: {
          nome_servico: updateOrcamentoDto.nome_servico,
          descricao: updateOrcamentoDto.descricao,
          horas_producao: updateOrcamentoDto.horas_producao,
          largura_produto: updateOrcamentoDto.largura_produto,
          altura_produto: updateOrcamentoDto.altura_produto,
          area_produto: updateOrcamentoDto.area_produto,
          unidade_medida_produto: updateOrcamentoDto.unidade_medida_produto,
          quantidade_produto: updateOrcamentoDto.quantidade_produto,
          custo_material: resultado.custos.custo_material,
          custo_mao_obra: resultado.custos.custo_mao_obra,
          custo_indireto: resultado.custos.custo_indireto,
          custo_total: resultado.custos.custo_total_producao,
          margem_lucro: resultado.custos.margem_lucro_percentual,
          impostos: resultado.custos.impostos_percentual,
          preco_final: resultado.custos.preco_final,
          // Configurações comerciais
          prazo_entrega: updateOrcamentoDto.prazo_entrega,
          forma_pagamento: updateOrcamentoDto.forma_pagamento,
          validade_proposta: updateOrcamentoDto.validade_proposta,
          atendente: updateOrcamentoDto.atendente,
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

      // Se houver novas máquinas, atualizar
      if (updateOrcamentoDto.maquinas) {
        // Remover máquinas antigas
        await this.prisma.maquinaOrcamento.deleteMany({
          where: { orcamento_id: id },
        });

        // Criar novas máquinas usando os dados calculados
        const maquinasData = resultado.maquinas.map(maquina => ({
          orcamento_id: id,
          maquina_id: maquina.maquina_id,
          horas_utilizadas: maquina.horas_utilizadas,
          custo_total: maquina.custo_total,
        }));

        await this.prisma.maquinaOrcamento.createMany({
          data: maquinasData,
        });
      }

      // Se houver novas funções, atualizar
      if (updateOrcamentoDto.funcoes) {
        // Remover funções antigas
        await this.prisma.funcaoOrcamento.deleteMany({
          where: { orcamento_id: id },
        });

        // Criar novas funções usando os dados calculados
        const funcoesData = resultado.funcoes.map(funcao => ({
          orcamento_id: id,
          funcao_id: funcao.funcao_id,
          horas_trabalhadas: funcao.horas_trabalhadas,
          custo_total: funcao.custo_total,
        }));

        await this.prisma.funcaoOrcamento.createMany({
          data: funcoesData,
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

  /**
   * Buscar orçamento para visualização pública (versão simplificada)
   */
  async findOnePublico(id: string) {
    const orcamento = await this.prisma.orcamento.findUnique({
      where: { id },
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
          },
        },
        loja: {
          select: {
            nome: true,
            logo_url: true,
            telefone: true,
            email: true,
          },
        },
      },
    });

    if (!orcamento) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    // Retornar apenas os dados necessários para visualização pública do cliente
    return {
      id: orcamento.id,
      numero: orcamento.numero,
      nome_servico: orcamento.nome_servico,
      descricao: orcamento.descricao,
      quantidade_produto: orcamento.quantidade_produto,
      unidade_medida_produto: orcamento.unidade_medida_produto,
      preco_final: orcamento.preco_final, // APENAS o preço final, sem detalhes de custos
      status: orcamento.status,
      status_aprovacao: orcamento.status_aprovacao,
      observacoes_cliente: orcamento.observacoes_cliente,
      criado_em: orcamento.criado_em,
      
      // Dados do cliente
      cliente: orcamento.cliente ? {
        id: orcamento.cliente.id,
        nome: orcamento.cliente.nome,
        email: orcamento.cliente.email,
        telefone: orcamento.cliente.telefone,
      } : null,
      
      // Dados da loja (públicos)
      loja: orcamento.loja ? {
        nome: orcamento.loja.nome,
        email: orcamento.loja.email,
        telefone: orcamento.loja.telefone,
        logo_url: orcamento.loja.logo_url,
      } : null,
      
      // Condições comerciais padrão (podem ser customizadas no futuro)
      prazo_entrega: '10 a 15 dias úteis',
      forma_pagamento: '50% entrada, restante na entrega',
      validade_proposta: '30 dias',
      atendente: 'Equipe Comercial',
      
      // NÃO incluir: custos internos, margens, impostos, itens detalhados, máquinas, funções
    };
  }

  /**
   * Processa ação do cliente (aprovar, rejeitar, negociar)
   */
  async processarAcaoCliente(
    orcamentoId: string,
    acao: 'APROVAR' | 'REJEITAR' | 'NEGOCIAR',
    dados: {
      observacoes?: string;
      cliente_nome?: string;
      cliente_email?: string;
    }
  ) {
    console.log('🔍 Debug - processarAcaoCliente - Iniciando', { orcamentoId, acao, dados });
    
    // Buscar orçamento
    const orcamento = await this.prisma.orcamento.findUnique({
      where: { id: orcamentoId },
      include: {
        cliente: true,
        loja: true,
      },
    });

    console.log('🔍 Debug - processarAcaoCliente - Orçamento encontrado:', !!orcamento);

    if (!orcamento) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    // Atualizar status baseado na ação
    let novoStatus: string;
    let mensagemLog: string;

    switch (acao) {
      case 'APROVAR':
        novoStatus = 'APROVADO';
        mensagemLog = 'Orçamento aprovado pelo cliente';
        break;
      case 'REJEITAR':
        novoStatus = 'REJEITADO';
        mensagemLog = `Orçamento rejeitado pelo cliente. Motivo: ${dados.observacoes}`;
        break;
      case 'NEGOCIAR':
        novoStatus = 'NEGOCIANDO';
        mensagemLog = `Cliente iniciou negociação. Observações: ${dados.observacoes}`;
        break;
      default:
        throw new BadRequestException('Ação inválida');
    }

    // Atualizar orçamento
    const orcamentoAtualizado = await this.prisma.orcamento.update({
      where: { id: orcamentoId },
      data: {
        status_aprovacao: novoStatus,
        ...(dados.observacoes && { observacoes_cliente: dados.observacoes }),
      },
    });

    // Registrar log da ação
    await this.registrarLog(orcamentoId, acao, mensagemLog);

    // Criar notificação para a loja
    if (this.notificacoesService) {
      let tipoNotificacao: string;
      let tituloNotificacao: string;

      switch (acao) {
        case 'APROVAR':
          tipoNotificacao = 'ORCAMENTO_APROVADO';
          tituloNotificacao = `Orçamento #${orcamento.numero} aprovado!`;
          break;
        case 'REJEITAR':
          tipoNotificacao = 'ORCAMENTO_REJEITADO';
          tituloNotificacao = `Orçamento #${orcamento.numero} rejeitado`;
          break;
        case 'NEGOCIAR':
          tipoNotificacao = 'ORCAMENTO_NEGOCIANDO';
          tituloNotificacao = `Cliente quer negociar orçamento #${orcamento.numero}`;
          break;
      }

      await this.notificacoesService.criarNotificacao(
        orcamento.loja_id,
        tipoNotificacao as any,
        tituloNotificacao,
        mensagemLog,
        orcamentoId,
        {
          cliente_nome: dados.cliente_nome || orcamento.cliente?.nome,
          cliente_email: dados.cliente_email || orcamento.cliente?.email,
          acao: acao,
          observacoes: dados.observacoes,
        }
      );
      
      // Enviar email para a loja quando cliente interage pela primeira vez
      if (orcamento.loja?.email) {
        let assuntoEmail: string;
        let mensagemEmail: string;
        
        switch (acao) {
          case 'APROVAR':
            assuntoEmail = `🎉 Orçamento #${orcamento.numero} APROVADO!`;
            mensagemEmail = `Ótima notícia! O cliente ${orcamento.cliente?.nome} aprovou o orçamento #${orcamento.numero} no valor de R$ ${Number(orcamento.preco_final).toFixed(2).replace('.', ',')}`;
            break;
          case 'REJEITAR':
            assuntoEmail = `❌ Orçamento #${orcamento.numero} rejeitado`;
            mensagemEmail = `O cliente ${orcamento.cliente?.nome} rejeitou o orçamento #${orcamento.numero}. Motivo: ${dados.observacoes}`;
            break;
          case 'NEGOCIAR':
            assuntoEmail = `💬 Cliente quer negociar orçamento #${orcamento.numero}`;
            mensagemEmail = `O cliente ${orcamento.cliente?.nome} iniciou uma negociação para o orçamento #${orcamento.numero}. Observações: ${dados.observacoes}`;
            break;
        }
        
        await this.mailService.enviarNotificacaoAprovacao(
          orcamento.loja.email,
          orcamento.numero,
          orcamento.cliente?.nome || 'Cliente',
          Number(orcamento.preco_final)
        );
      }
    }

    // Se for negociação, criar mensagem inicial no chat
    if (acao === 'NEGOCIAR' && dados.observacoes) {
      try {
        // Criar mensagem inicial de negociação diretamente no banco
        await this.prisma.mensagemNegociacao.create({
          data: {
            orcamento_id: orcamentoId,
            mensagem: dados.observacoes,
            tipo: 'CLIENTE',
            autor_nome: orcamento.cliente?.nome || dados.cliente_nome || 'Cliente',
            autor_email: orcamento.cliente?.email || dados.cliente_email || null,
            visualizada: false,
          },
        });
        
        console.log('✅ Mensagem inicial de negociação criada no chat');
      } catch (error) {
        console.error('❌ Erro ao criar mensagem inicial no chat:', error);
        // Fallback: registrar no log se não conseguir criar a mensagem
        await this.registrarLog(
          orcamentoId,
          'MENSAGEM_CLIENTE',
          `Mensagem do cliente: ${dados.observacoes}`
        );
      }
    }

    return {
      success: true,
      orcamento: orcamentoAtualizado,
      acao: acao,
      mensagem: mensagemLog,
    };
  }
  async acaoCliente(id: string, acaoDto: any) {
    // Buscar orçamento com loja_id
    const orcamento = await this.prisma.orcamento.findUnique({
      where: { id },
      select: {
        id: true,
        numero: true,
        loja_id: true,
        status_aprovacao: true,
      },
    });

    if (!orcamento) {
      throw new NotFoundException('Orçamento não encontrado');
    }
    
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

    // Criar notificação para ação do cliente
    await this.notificacoesService.notificarAcaoCliente(
      id,
      orcamento.loja_id,
      acaoDto.acao,
      acaoDto.observacoes
    );

    return {
      message: `Orçamento ${statusAprovacao.toLowerCase()}`,
      status: statusAprovacao,
    };
  }

  /**
   * Buscar mensagens não visualizadas para SSE
   */
  async getMensagensNaoVisualizadas(orcamentoId: string) {
    return this.prisma.mensagemNegociacao.findMany({
      where: {
        orcamento_id: orcamentoId,
        visualizada: false,
        tipo: {
          not: 'SISTEMA'
        }
      },
      orderBy: {
        criado_em: 'desc'
      },
      take: 10
    });
  }

  /**
   * Marcar mensagem como visualizada
   */
  async marcarMensagemComoVisualizada(orcamentoId: string, mensagemId: string) {
    return this.prisma.mensagemNegociacao.update({
      where: {
        id: mensagemId,
        orcamento_id: orcamentoId
      },
      data: {
        visualizada: true
      }
    });
  }

  /**
   * Reenviar código de aprovação para o cliente
   */
  async reenviarCodigoAprovacao(id: string) {
    console.log('📧 ============================================');
    console.log('📧 REENVIANDO CÓDIGO DE APROVAÇÃO');
    console.log('📧 ============================================');
    console.log('📧 Orçamento ID:', id);

    // 1. Buscar o orçamento
    const orcamento = await this.prisma.orcamento.findUnique({
      where: { id },
      include: {
        cliente: true,
        loja: true,
      },
    });

    if (!orcamento) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    if (!orcamento.cliente?.email) {
      throw new Error('Cliente não possui email cadastrado');
    }

    // 2. Gerar novo código de aprovação
    const novoCodigo = await this.gerarCodigoAprovacao();

    // 3. Atualizar o código no orçamento
    await this.prisma.orcamento.update({
      where: { id },
      data: {
        codigo_aprovacao: novoCodigo,
      },
    });

    // 4. Enviar email com o novo código
    const linkPublico = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/orcamento/${orcamento.id}`;
    
    await this.mailService.enviarOrcamentoCliente(
      orcamento.cliente.email,
      orcamento.cliente.nome,
      orcamento.numero,
      orcamento.nome_servico,
      Number(orcamento.preco_final),
      novoCodigo,
      linkPublico
    );

    // 5. Registrar log
    await this.registrarLog(id, 'CODIGO_REENVIADO', 'Código de aprovação reenviado para o cliente');

    console.log('📧 ✅ Código reenviado com sucesso!');
    console.log('📧 ✅ Novo código:', novoCodigo);
    console.log('📧 ✅ Email enviado para:', orcamento.cliente.email);
    console.log('📧 ============================================');

    return {
      message: 'Código de aprovação reenviado com sucesso!',
      email: orcamento.cliente.email,
    };
  }

  /**
   * Recalcular valores de orçamentos existentes
   */
  async recalcularOrcamentosExistentes(lojaId: string) {
    console.log('🔧 Iniciando recálculo de orçamentos existentes para loja:', lojaId);
    
    // Buscar todos os orçamentos da loja
    const orcamentos = await this.prisma.orcamento.findMany({
      where: { loja_id: lojaId },
      include: {
        itens: {
          include: {
            insumo: true,
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

    console.log(`🔧 Encontrados ${orcamentos.length} orçamentos para recalcular`);

    let corrigidos = 0;
    let erros = 0;

    for (const orcamento of orcamentos) {
      try {
        console.log(`🔧 Recalculando orçamento ${orcamento.numero}...`);

        // Preparar dados para recálculo
        const calculoDto: CalcularOrcamentoDto = {
          nome_servico: orcamento.nome_servico,
          descricao: orcamento.descricao || '',
          horas_producao: Number(orcamento.horas_producao),
          quantidade_produto: Number(orcamento.quantidade_produto) || 1,
          itens: orcamento.itens.map(item => ({
            insumo_id: item.insumo_id,
            quantidade: Number(item.quantidade),
          })),
          maquinas: orcamento.maquinas.map(maquina => ({
            maquina_id: maquina.maquina_id,
            horas_utilizadas: Number(maquina.horas_utilizadas),
          })),
          funcoes: orcamento.funcoes.map(funcao => ({
            funcao_id: funcao.funcao_id,
            horas_trabalhadas: Number(funcao.horas_trabalhadas),
          })),
          margem_lucro_customizada: Number(orcamento.margem_lucro),
          impostos_customizados: Number(orcamento.impostos),
        };

        // Recalcular
        const resultado = await this.calcularOrcamento(calculoDto, lojaId);

        // Atualizar no banco
        await this.prisma.orcamento.update({
          where: { id: orcamento.id },
          data: {
            custo_material: resultado.custos.custo_material,
            custo_mao_obra: resultado.custos.custo_mao_obra,
            custo_indireto: resultado.custos.custo_indireto,
            custo_total: resultado.custos.custo_total_producao,
            margem_lucro: resultado.custos.margem_lucro_percentual,
            impostos: resultado.custos.impostos_percentual,
            preco_final: resultado.custos.preco_final,
          },
        });

        console.log(`✅ Orçamento ${orcamento.numero} corrigido:`, {
          antigo: orcamento.preco_final,
          novo: resultado.custos.preco_final,
          quantidade: orcamento.quantidade_produto,
        });

        corrigidos++;
      } catch (error) {
        console.error(`❌ Erro ao recalcular orçamento ${orcamento.numero}:`, error);
        erros++;
      }
    }

    console.log(`🔧 Recálculo concluído: ${corrigidos} corrigidos, ${erros} erros`);
    
    return {
      total: orcamentos.length,
      corrigidos,
      erros,
    };
  }
}
