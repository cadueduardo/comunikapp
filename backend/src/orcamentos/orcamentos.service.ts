import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CalcularOrcamentoDto } from './dto/calcular-orcamento.dto';
import { ResultadoCalculoDto, ItemOrcamentoCalculadoDto, DetalhamentoCustoDto } from './dto/resultado-calculo.dto';

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
    if (!loja.custo_maodeobra_hora || !loja.custos_indiretos_mensais) {
      throw new BadRequestException(
        'Configurações da loja incompletas. Configure os custos de mão de obra e custos indiretos nas configurações da loja.'
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

    // 4. Calcular custo indireto por hora
    const custoIndiretoPorHora = await this.calcularCustoIndiretoPorHora(loja);

    // 5. Calcular custos diretos
    const { custoMaterial, itensCalculados } = this.calcularCustosDirectos(dto.itens, insumos);
    const custoMaoObra = this.calcularCustoMaoObra(dto.horas_producao, Number(loja.custo_maodeobra_hora));
    const custoMaquinaria = this.calcularCustoMaquinaria(dto.horas_producao, Number(loja.custo_maquinaria_hora || 0));

    // 6. Calcular custo indireto alocado
    const custoIndiretolAlocado = this.calcularCustoIndiretolAlocado(dto.horas_producao, custoIndiretoPorHora);

    // 7. Calcular custo total de produção
    const custoTotalProducao = custoMaterial + custoMaoObra + custoMaquinaria + custoIndiretolAlocado;

    // 8. Aplicar margem de lucro e impostos
    const margemLucro = dto.margem_lucro_customizada || Number(loja.margem_lucro_padrao || 0);
    const impostos = dto.impostos_customizados || Number(loja.impostos_padrao || 0);

    const margemLucroValor = custoTotalProducao * (margemLucro / 100);
    const subtotalComLucro = custoTotalProducao + margemLucroValor;
    const impostosValor = subtotalComLucro * (impostos / 100);
    const precoFinal = subtotalComLucro + impostosValor;

    // 9. Montar resultado
    const resultado: ResultadoCalculoDto = {
      nome_servico: dto.nome_servico,
      descricao: dto.descricao,
      horas_producao: dto.horas_producao,
      itens: itensCalculados,
      custos: {
        custo_material: custoMaterial,
        custo_mao_obra: custoMaoObra + custoMaquinaria,
        custo_indireto: custoIndiretolAlocado,
        custo_total_producao: custoTotalProducao,
        margem_lucro_percentual: margemLucro,
        margem_lucro_valor: margemLucroValor,
        subtotal_com_lucro: subtotalComLucro,
        impostos_percentual: impostos,
        impostos_valor: impostosValor,
        preco_final: precoFinal,
      },
      parametros: {
        custo_mao_obra_por_hora: Number(loja.custo_maodeobra_hora),
        custo_maquinaria_por_hora: Number(loja.custo_maquinaria_hora || 0),
        custos_indiretos_por_hora: custoIndiretoPorHora,
        margem_lucro_percentual: margemLucro,
        impostos_percentual: impostos,
        total_horas_produtivas_mes: 352, // Assumindo 2 colaboradores * 176 horas/mês
      },
    };

    return resultado;
  }

  /**
   * Calcula o custo indireto por hora conforme documento
   * Passo 1: Somar todos os custos indiretos mensais
   * Passo 2: Calcular total de horas produtivas da empresa
   * Passo 3: Dividir custos indiretos pelas horas produtivas
   */
  private async calcularCustoIndiretoPorHora(loja: any): Promise<number> {
    const custosIndiretosMensais = Number(loja.custos_indiretos_mensais);
    
    // TODO: Implementar configuração de horas produtivas por loja
    // Por enquanto assumindo 2 colaboradores * 176 horas/mês = 352 horas
    const horasProdutivasMes = 352;
    
    return custosIndiretosMensais / horasProdutivasMes;
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

      const custoUnitario = Number(insumo.custo_unitario);
      const quantidade = Number(item.quantidade);
      const custoTotal = custoUnitario * quantidade;

      custoMaterial += custoTotal;

      itensCalculados.push({
        insumo_id: insumo.id,
        nome_insumo: insumo.nome,
        quantidade,
        custo_unitario: custoUnitario,
        custo_total: custoTotal,
        unidade_medida: insumo.unidade_medida,
      });
    }

    return { custoMaterial, itensCalculados };
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
}
