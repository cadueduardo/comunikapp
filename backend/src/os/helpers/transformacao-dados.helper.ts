import { Decimal } from '@prisma/client/runtime/library';

/**
 * Helpers de transformação e enrichment dos dados do orçamento para formato da OS
 * Objetivo: Centralizar lógica de cálculo e formatação conforme PLANO Fase 1
 */

export interface MaterialPrincipal {
  nome: string;
  quantidade: number;
  unidade: string;
  custo_total: number;
}

export interface Acabamento {
  nome: string;
  descricao: string;
  categoria: string;
  custo_total: number;
}

export interface TipoImpressao {
  tipo: string;
  maquina: string;
  confianca: number; // 0-100%
}

export interface DadosTransformacao {
  prazoProducaoDias: number;
  dataEntregaCalculada: Date;
  materiaisPrincipais: MaterialPrincipal[];
  tipoImpressao: TipoImpressao | null;
  acabamentos: Acabamento[];
  instalacaoNecessaria: boolean;
}

export class TransformacaoDadosHelper {
  
  /**
   * Converte horas totais em dias úteis
   * @param horasTotais Total de horas de produção
   * @param horasDiaUtil Horas por dia útil (padrão: 8h)
   * @returns Número de dias úteis
   */
  static calcularPrazoProducaoDias(horasTotais: number, horasDiaUtil: number = 8): number {
    if (horasTotais <= 0) return 0;
    if (horasDiaUtil <= 0) horasDiaUtil = 8;
    
    const dias = Math.ceil(horasTotais / horasDiaUtil);
    return Math.max(1, dias); // Mínimo 1 dia
  }
  
  /**
   * Transforma texto de prazo em data calculada
   * @param prazoEntrega Texto como "10 a 15 dias" ou "5 dias"
   * @param dataAbertura Data de abertura do orçamento
   * @returns Data calculada de entrega
   */
  static converterPrazoEntregaParaData(prazoEntrega: string, dataAbertura: Date): Date {
    if (!prazoEntrega || !dataAbertura) {
      return new Date(dataAbertura.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 dias padrão
    }
    
    // Extrair números do texto
    const numeros = prazoEntrega.match(/\d+/g);
    if (!numeros || numeros.length === 0) {
      return new Date(dataAbertura.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 dias padrão
    }
    
    // Usar o maior número encontrado (prazo mais conservador)
    const dias = Math.max(...numeros.map(n => parseInt(n)));
    
    // Calcular data de entrega (considerando apenas dias úteis)
    const dataEntrega = new Date(dataAbertura);
    let diasAdicionados = 0;
    
    while (diasAdicionados < dias) {
      dataEntrega.setDate(dataEntrega.getDate() + 1);
      
      // Pular fins de semana
      const diaSemana = dataEntrega.getDay();
      if (diaSemana !== 0 && diaSemana !== 6) { // Não é domingo nem sábado
        diasAdicionados++;
      }
    }
    
    return dataEntrega;
  }
  
  /**
   * Ordena insumos por custo e retorna top 3 (materiais principais)
   * @param insumos Lista de insumos com custo
   * @returns Top 3 materiais principais
   */
  static extrairMateriaisPrincipais(insumos: any[]): MaterialPrincipal[] {
    if (!insumos || insumos.length === 0) return [];
    
    // Ordenar por custo total (decrescente)
    const insumosOrdenados = insumos
      .filter(insumo => insumo.custo_total && insumo.custo_total > 0)
      .sort((a, b) => {
        const custoA = typeof a.custo_total === 'string' ? parseFloat(a.custo_total) : a.custo_total;
        const custoB = typeof b.custo_total === 'string' ? parseFloat(b.custo_total) : b.custo_total;
        return custoB - custoA;
      });
    
    // Retornar top 3
    return insumosOrdenados.slice(0, 3).map(insumo => ({
      nome: insumo.nome || insumo.insumo?.nome || 'Material',
      quantidade: typeof insumo.quantidade === 'string' ? parseFloat(insumo.quantidade) : insumo.quantidade,
      unidade: insumo.unidade || insumo.insumo?.unidade_uso || 'un',
      custo_total: typeof insumo.custo_total === 'string' ? parseFloat(insumo.custo_total) : insumo.custo_total
    }));
  }
  
  /**
   * Analisa máquinas e retorna tipo predominante de impressão
   * @param maquinas Lista de máquinas utilizadas
   * @returns Tipo de impressão predominante
   */
  static identificarTipoImpressao(maquinas: any[]): TipoImpressao | null {
    if (!maquinas || maquinas.length === 0) return null;
    
    // Mapear tipos de impressão
    const tiposImpressao: { [key: string]: string } = {
      'DIGITAL': 'Impressão Digital',
      'OFFSET': 'Impressão Offset',
      'SERIGRAFIA': 'Serigrafia',
      'PLOTTER': 'Plotagem',
      'LASER': 'Corte Laser',
      'CNC': 'Corte CNC',
      'VINIL': 'Aplicação de Vinil'
    };
    
    // Contar tipos de máquinas
    const contadores: { [key: string]: number } = {};
    
    maquinas.forEach(maquina => {
      const tipo = maquina.tipo || maquina.maquina?.tipo || 'OUTRO';
      contadores[tipo] = (contadores[tipo] || 0) + 1;
    });
    
    // Encontrar tipo predominante
    const tipoPredominante = Object.keys(contadores).reduce((a, b) => 
      contadores[a] > contadores[b] ? a : b
    );
    
    const totalMaquinas = maquinas.length;
    const confianca = Math.round((contadores[tipoPredominante] / totalMaquinas) * 100);
    
    return {
      tipo: tiposImpressao[tipoPredominante] || tipoPredominante,
      maquina: maquinas.find(m => (m.tipo || m.maquina?.tipo) === tipoPredominante)?.nome || 'Máquina',
      confianca
    };
  }
  
  /**
   * Filtra serviços manuais excluindo categoria "instalação" (acabamentos)
   * @param servicosManuais Lista de serviços manuais
   * @returns Lista de acabamentos
   */
  static extrairAcabamentos(servicosManuais: any[]): Acabamento[] {
    if (!servicosManuais || servicosManuais.length === 0) return [];
    
    return servicosManuais
      .filter(servico => {
        const categorias = servico.categorias || servico.servico?.categorias || [];
        return !categorias.includes('instalacao');
      })
      .map(servico => ({
        nome: servico.nome || servico.servico?.nome || 'Serviço',
        descricao: servico.descricao || servico.servico?.descricao || '',
        categoria: (servico.categorias || servico.servico?.categorias || []).join(', '),
        custo_total: typeof servico.custo_total === 'string' ? parseFloat(servico.custo_total) : servico.custo_total
      }));
  }
  
  /**
   * Verifica se existe serviço manual categoria "instalação"
   * @param servicosManuais Lista de serviços manuais
   * @returns True se instalação é necessária
   */
  static verificarInstalacaoNecessaria(servicosManuais: any[]): boolean {
    if (!servicosManuais || servicosManuais.length === 0) return false;
    
    return servicosManuais.some(servico => {
      const categorias = servico.categorias || servico.servico?.categorias || [];
      return categorias.includes('instalacao');
    });
  }
  
  /**
   * Transforma dados completos do orçamento para formato da OS
   * @param dadosOrcamento Dados do orçamento
   * @returns Dados transformados para OS
   */
  static transformarDadosCompletos(dadosOrcamento: {
    horasProducao: number;
    prazoEntrega: string;
    dataAbertura: Date;
    insumos: any[];
    maquinas: any[];
    servicosManuais: any[];
  }): DadosTransformacao {
    
    // Calcular prazo de produção
    const prazoProducaoDias = this.calcularPrazoProducaoDias(dadosOrcamento.horasProducao);
    
    // Calcular data de entrega
    const dataEntregaCalculada = this.converterPrazoEntregaParaData(
      dadosOrcamento.prazoEntrega, 
      dadosOrcamento.dataAbertura
    );
    
    // Extrair materiais principais
    const materiaisPrincipais = this.extrairMateriaisPrincipais(dadosOrcamento.insumos);
    
    // Identificar tipo de impressão
    const tipoImpressao = this.identificarTipoImpressao(dadosOrcamento.maquinas);
    
    // Extrair acabamentos
    const acabamentos = this.extrairAcabamentos(dadosOrcamento.servicosManuais);
    
    // Verificar instalação necessária
    const instalacaoNecessaria = this.verificarInstalacaoNecessaria(dadosOrcamento.servicosManuais);
    
    return {
      prazoProducaoDias,
      dataEntregaCalculada,
      materiaisPrincipais,
      tipoImpressao,
      acabamentos,
      instalacaoNecessaria
    };
  }
  
  /**
   * Valida se os dados transformados estão completos
   * @param dados Dados transformados
   * @returns Lista de validações
   */
  static validarDadosTransformados(dados: DadosTransformacao): {
    valido: boolean;
    erros: string[];
    alertas: string[];
  } {
    const erros: string[] = [];
    const alertas: string[] = [];
    
    // Validações obrigatórias
    if (dados.prazoProducaoDias <= 0) {
      erros.push('Prazo de produção deve ser maior que zero');
    }
    
    if (!dados.dataEntregaCalculada) {
      erros.push('Data de entrega deve ser calculada');
    }
    
    if (dados.materiaisPrincipais.length === 0) {
      erros.push('Pelo menos um material principal deve ser identificado');
    }
    
    // Alertas (não bloqueiam)
    if (dados.prazoProducaoDias > 30) {
      alertas.push('Prazo de produção muito longo (>30 dias)');
    }
    
    if (dados.materiaisPrincipais.length < 3) {
      alertas.push('Poucos materiais principais identificados');
    }
    
    if (!dados.tipoImpressao) {
      alertas.push('Tipo de impressão não identificado');
    }
    
    if (dados.acabamentos.length === 0) {
      alertas.push('Nenhum acabamento identificado');
    }
    
    return {
      valido: erros.length === 0,
      erros,
      alertas
    };
  }
  
  /**
   * Formata dados para exibição no frontend
   * @param dados Dados transformados
   * @returns Dados formatados para UI
   */
  static formatarParaExibicao(dados: DadosTransformacao): {
    prazoFormatado: string;
    materiaisFormatados: string[];
    impressaoFormatada: string;
    acabamentosFormatados: string[];
    instalacaoFormatada: string;
  } {
    return {
      prazoFormatado: `${dados.prazoProducaoDias} dias úteis`,
      materiaisFormatados: dados.materiaisPrincipais.map(m => 
        `${m.nome} (${m.quantidade} ${m.unidade})`
      ),
      impressaoFormatada: dados.tipoImpressao 
        ? `${dados.tipoImpressao.tipo} (${dados.tipoImpressao.confianca}% confiança)`
        : 'Não identificado',
      acabamentosFormatados: dados.acabamentos.map(a => a.nome),
      instalacaoFormatada: dados.instalacaoNecessaria ? 'Sim' : 'Não'
    };
  }
}

// Export default para uso em outros módulos
export default TransformacaoDadosHelper;
