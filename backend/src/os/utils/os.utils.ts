/**
 * Utilities para o módulo OS
 * Conforme premissas: funções comuns em utils/ para evitar duplicação
 */

import { StatusOS, TipoMovimentacaoOS } from '../interfaces/os.interfaces';

// ===== FORMATAÇÃO E VALIDAÇÃO =====

export class OSUtils {
  
  /**
   * Formatar número da OS com zeros à esquerda
   */
  static formatarNumeroOS(numero: number | string): string {
    return numero.toString().padStart(6, '0');
  }

  /**
   * Validar se status é válido
   */
  static isStatusValido(status: string): boolean {
    return Object.values(StatusOS).includes(status as StatusOS);
  }

  /**
   * Obter cor do badge por status
   */
  static getCorStatus(status: StatusOS): string {
    const cores = {
      [StatusOS.FILA]: 'bg-gray-100 text-gray-800',
      [StatusOS.PRODUCAO]: 'bg-blue-100 text-blue-800',
      [StatusOS.ACABAMENTO]: 'bg-yellow-100 text-yellow-800',
      [StatusOS.FINALIZADA]: 'bg-green-100 text-green-800',
      [StatusOS.CANCELADA]: 'bg-red-100 text-red-800',
      [StatusOS.AGUARDANDO_MATERIAL]: 'bg-orange-100 text-orange-800',
      [StatusOS.PAUSADA]: 'bg-purple-100 text-purple-800',
    };

    return cores[status] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Obter label em português para status
   */
  static getLabelStatus(status: StatusOS): string {
    const labels = {
      [StatusOS.FILA]: 'Na Fila',
      [StatusOS.PRODUCAO]: 'Em Produção',
      [StatusOS.ACABAMENTO]: 'Acabamento',
      [StatusOS.FINALIZADA]: 'Finalizada',
      [StatusOS.CANCELADA]: 'Cancelada',
      [StatusOS.AGUARDANDO_MATERIAL]: 'Aguardando Material',
      [StatusOS.PAUSADA]: 'Pausada',
    };

    return labels[status] || status;
  }

  /**
   * Calcular prazo estimado baseado em horas de produção
   */
  static calcularPrazoEstimado(horasProducao: number, horasPorDia = 8): Date {
    const diasNecessarios = Math.ceil(horasProducao / horasPorDia);
    const prazo = new Date();
    
    // Adicionar dias úteis (não contar fins de semana)
    let diasAdicionados = 0;
    while (diasAdicionados < diasNecessarios) {
      prazo.setDate(prazo.getDate() + 1);
      // Se não for fim de semana (0 = domingo, 6 = sábado)
      if (prazo.getDay() !== 0 && prazo.getDay() !== 6) {
        diasAdicionados++;
      }
    }

    return prazo;
  }

  /**
   * Validar parâmetros técnicos básicos
   */
  static validarParametrosTecnicos(parametros: any): { valido: boolean; erros: string[] } {
    const erros: string[] = [];

    if (parametros) {
      // Validar dimensões
      if (parametros.largura && parametros.largura <= 0) {
        erros.push('Largura deve ser maior que zero');
      }
      
      if (parametros.altura && parametros.altura <= 0) {
        erros.push('Altura deve ser maior que zero');
      }

      // Validar área (se fornecida, deve ser consistente)
      if (parametros.largura && parametros.altura && parametros.area) {
        const areaCalculada = parametros.largura * parametros.altura;
        const diferenca = Math.abs(areaCalculada - parametros.area);
        if (diferenca > 0.01) { // Tolerância de 0.01m²
          erros.push('Área informada não confere com largura x altura');
        }
      }
    }

    return {
      valido: erros.length === 0,
      erros,
    };
  }

  /**
   * Extrair insumos de custos calculados (JSON do motor de cálculo)
   */
  static extrairInsumosDoCustoCalculado(custosCalculados: any): any[] {
    if (!custosCalculados || typeof custosCalculados !== 'object') {
      return [];
    }

    // Estrutura esperada do motor de cálculo V2
    if (custosCalculados.materiais && Array.isArray(custosCalculados.materiais)) {
      return custosCalculados.materiais.map((material: any) => ({
        insumo_id: material.insumo_id,
        nome: material.nome,
        quantidade_necessaria: material.quantidade_total || material.quantidade,
        unidade: material.unidade,
        custo_unitario: material.custo_unitario,
        custo_total: material.custo_total,
      }));
    }

    return [];
  }

  /**
   * Gerar código único para OS (usado em integrações)
   */
  static gerarCodigoOS(lojaId: string, numero: string): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);
    return `OS-${lojaId.substring(0, 8)}-${numero}-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Validar se etapa permite determinada ação
   */
  static podeExecutarAcao(status: StatusOS, acao: string): boolean {
    const acoesPermitidas = {
      [StatusOS.FILA]: ['EDITAR', 'AVANCAR', 'CANCELAR', 'PAUSAR'],
      [StatusOS.PRODUCAO]: ['AVANCAR', 'PAUSAR', 'RETROCEDER'],
      [StatusOS.ACABAMENTO]: ['AVANCAR', 'RETROCEDER', 'PAUSAR'],
      [StatusOS.FINALIZADA]: ['VISUALIZAR'],
      [StatusOS.CANCELADA]: ['VISUALIZAR'],
      [StatusOS.AGUARDANDO_MATERIAL]: ['RETOMAR', 'CANCELAR'],
      [StatusOS.PAUSADA]: ['RETOMAR', 'CANCELAR'],
    };

    return acoesPermitidas[status]?.includes(acao) || false;
  }
}
