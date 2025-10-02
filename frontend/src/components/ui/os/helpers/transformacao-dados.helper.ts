/**
 * Helper para transformar dados da OS no frontend
 * Reutiliza a lógica do backend para consistência
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
  confianca: number;
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
   * Ordena insumos por custo e retorna top 3 (materiais principais)
   */
  static extrairMateriaisPrincipais(insumos: any): MaterialPrincipal[] {
    if (!insumos || !Array.isArray(insumos) || insumos.length === 0) return [];
    
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
   */
  static identificarTipoImpressao(maquinas: any): TipoImpressao | null {
    if (!maquinas || !Array.isArray(maquinas) || maquinas.length === 0) return null;
    
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
   */
  static extrairAcabamentos(servicosManuais: any): Acabamento[] {
    if (!servicosManuais || !Array.isArray(servicosManuais) || servicosManuais.length === 0) return [];
    
    return servicosManuais
      .filter(servico => {
        const categorias = servico.categorias || servico.servico?.categorias || [];
        const categoriasArray = Array.isArray(categorias) ? categorias : [];
        return !categoriasArray.includes('instalacao');
      })
      .map(servico => {
        const categorias = servico.categorias || servico.servico?.categorias || [];
        const categoriasArray = Array.isArray(categorias) ? categorias : [];
        
        return {
          nome: servico.nome || servico.servico?.nome || 'Serviço',
          descricao: servico.descricao || servico.servico?.descricao || '',
          categoria: categoriasArray.length > 0 ? categoriasArray.join(', ') : 'Sem categoria',
          custo_total: typeof servico.custo_total === 'string' ? parseFloat(servico.custo_total) : servico.custo_total
        };
      });
  }
  
  /**
   * Verifica se existe serviço manual categoria "instalação"
   */
  static verificarInstalacaoNecessaria(servicosManuais: any): boolean {
    if (!servicosManuais || !Array.isArray(servicosManuais) || servicosManuais.length === 0) return false;
    
    return servicosManuais.some(servico => {
      const categorias = servico.categorias || servico.servico?.categorias || [];
      const categoriasArray = Array.isArray(categorias) ? categorias : [];
      return categoriasArray.includes('instalacao');
    });
  }
  
  /**
   * Transforma dados da OS para exibição
   */
  static transformarDadosOS(dadosOS: any): DadosTransformacao {
    if (!dadosOS || typeof dadosOS !== 'object') {
      return {
        prazoProducaoDias: 0,
        dataEntregaCalculada: new Date(),
        materiaisPrincipais: [],
        tipoImpressao: null,
        acabamentos: [],
        instalacaoNecessaria: false
      };
    }
    
    // Extrair materiais principais dos insumos calculados
    const insumos = dadosOS.insumos_calculados || dadosOS.insumos || [];
    const materiaisPrincipais = this.extrairMateriaisPrincipais(insumos);
    
    // Identificar tipo de impressão (se houver dados de máquinas)
    const maquinas = dadosOS.maquinas_calculadas || dadosOS.maquinas || [];
    const tipoImpressao = this.identificarTipoImpressao(maquinas);
    
    // Extrair acabamentos (se houver dados de serviços)
    const servicos = dadosOS.servicos_manuais || dadosOS.servicos || [];
    const acabamentos = this.extrairAcabamentos(servicos);
    
    // Verificar instalação necessária
    const instalacaoNecessaria = this.verificarInstalacaoNecessaria(servicos);
    
    // Calcular prazo baseado na data de abertura e prazo
    const dataAbertura = dadosOS.data_abertura ? new Date(dadosOS.data_abertura) : new Date();
    const dataPrazo = dadosOS.data_prazo ? new Date(dadosOS.data_prazo) : null;
    const prazoProducaoDias = dataPrazo ? Math.ceil((dataPrazo.getTime() - dataAbertura.getTime()) / (1000 * 60 * 60 * 24)) : 0;
    
    return {
      prazoProducaoDias: Math.max(0, prazoProducaoDias),
      dataEntregaCalculada: dataPrazo || new Date(),
      materiaisPrincipais,
      tipoImpressao,
      acabamentos,
      instalacaoNecessaria
    };
  }
  
  /**
   * Formata dados para exibição no frontend
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

export default TransformacaoDadosHelper;
