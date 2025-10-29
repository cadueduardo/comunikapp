import { OSCardKanban, KanbanStats, StatusSetorProdutivo } from '../entities/pcp.entities';

export class KanbanMapper {
  /**
   * Mapeia dados brutos do Prisma para formato do kanban
   */
  static mapearOSParaKanban(os: any): OSCardKanban {
    const workflowAtivo = os.workflow_instancia?.[0];
    const etapaAtual = workflowAtivo?.etapas?.[0];
    
    return {
      id: os.id,
      numero: os.numero,
      titulo: os.nome_servico,
      cliente: os.cliente?.nome || 'Cliente não informado',
      status: this.mapearStatusOS(os.status),
      prioridade: os.prioridade || 'MEDIA',
      responsavel: etapaAtual?.responsavel?.nome || 'Não atribuído',
      data_prazo: os.data_prazo ? new Date(os.data_prazo).toISOString().split('T')[0] : '',
      progresso: this.calcularProgresso(os),
      alertas: this.gerarAlertas(os),
      setor_atual: etapaAtual?.setor?.nome,
      operador_atual: etapaAtual?.responsavel?.nome
    };
  }

  /**
   * Mapeia instância de setor para formato do kanban
   */
  static mapearInstanciaParaKanban(instancia: any): OSCardKanban {
    const os = instancia.item_os?.os ?? instancia.workflow_instancia?.os ?? null;

    return {
      id: instancia.item_os_id ?? instancia.id,
      numero: os?.numero || instancia.workflow_instancia?.os_id || '',
      titulo:
        instancia.item_os?.produto_servico ||
        instancia.workflow_instancia?.os?.nome_servico ||
        'Produto',
      cliente: os?.cliente?.nome || 'Cliente nÃ£o informado',
      status: instancia.status,
      prioridade: os?.prioridade || 'MEDIA',
      responsavel: instancia.operador?.nome || 'NÃ£o atribuÃ­do',
      data_prazo: os?.data_prazo ? new Date(os.data_prazo).toISOString().split('T')[0] : '',
      progresso: this.calcularProgressoInstancia(instancia),
      alertas: [],
      setor_atual: instancia.setor?.nome,
      operador_atual: instancia.operador?.nome
    };
  }

  /**
   * Agrupa cards por status para exibição no kanban
   */
  static agruparPorStatus(cards: OSCardKanban[]): Record<string, OSCardKanban[]> {
    return cards.reduce((grupos, card) => {
      if (!grupos[card.status]) {
        grupos[card.status] = [];
      }
      grupos[card.status].push(card);
      return grupos;
    }, {} as Record<string, OSCardKanban[]>);
  }

  /**
   * Agrupa cards por setor
   */
  static agruparPorSetor(cards: OSCardKanban[]): Record<string, OSCardKanban[]> {
    return cards.reduce((grupos, card) => {
      const setor = card.setor_atual || 'Sem Setor';
      if (!grupos[setor]) {
        grupos[setor] = [];
      }
      grupos[setor].push(card);
      return grupos;
    }, {} as Record<string, OSCardKanban[]>);
  }

  /**
   * Calcula estatísticas do kanban
   */
  static calcularEstatisticas(cards: OSCardKanban[]): KanbanStats {
    const hoje = new Date();
    
    const stats: KanbanStats = {
      total: cards.length,
      fila: cards.filter(c => c.status === 'LIBERADA_PARA_PCP').length,
      producao: cards.filter(c => c.status === 'EM_WORKFLOW').length,
      concluida: cards.filter(c => c.status === 'FINALIZADA').length,
      rejeitada: cards.filter(c => c.status === 'REJEITADA').length,
      atrasadas: cards.filter(c => {
        if (!c.data_prazo) return false;
        return new Date(c.data_prazo) < hoje && c.status !== 'FINALIZADA';
      }).length,
      criticas: cards.filter(c => c.prioridade === 'CRITICA').length,
      por_setor: {}
    };

    // Calcular por setor
    cards.forEach(card => {
      if (card.setor_atual) {
        stats.por_setor[card.setor_atual] = (stats.por_setor[card.setor_atual] || 0) + 1;
      }
    });

    return stats;
  }

  /**
   * Filtra cards baseado em critérios
   */
  static filtrarCards(cards: OSCardKanban[], filtros: {
    status?: string;
    prioridade?: string;
    setor?: string;
    operador?: string;
    busca?: string;
  }): OSCardKanban[] {
    return cards.filter(card => {
      // Filtro por status
      if (filtros.status && card.status !== filtros.status) {
        return false;
      }

      // Filtro por prioridade
      if (filtros.prioridade && card.prioridade !== filtros.prioridade) {
        return false;
      }

      // Filtro por setor
      if (filtros.setor && card.setor_atual !== filtros.setor) {
        return false;
      }

      // Filtro por operador
      if (filtros.operador && card.operador_atual !== filtros.operador) {
        return false;
      }

      // Filtro por busca (texto)
      if (filtros.busca) {
        const busca = filtros.busca.toLowerCase();
        const matchNumero = card.numero.toLowerCase().includes(busca);
        const matchTitulo = card.titulo.toLowerCase().includes(busca);
        const matchCliente = card.cliente.toLowerCase().includes(busca);
        
        if (!matchNumero && !matchTitulo && !matchCliente) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Ordena cards por critério
   */
  static ordenarCards(cards: OSCardKanban[], criterio: 'prazo' | 'prioridade' | 'status' | 'setor'): OSCardKanban[] {
    return [...cards].sort((a, b) => {
      switch (criterio) {
        case 'prazo':
          if (!a.data_prazo && !b.data_prazo) return 0;
          if (!a.data_prazo) return 1;
          if (!b.data_prazo) return -1;
          return new Date(a.data_prazo).getTime() - new Date(b.data_prazo).getTime();
        
        case 'prioridade':
          const ordemPrioridade = { 'CRITICA': 4, 'ALTA': 3, 'MEDIA': 2, 'BAIXA': 1 };
          return (ordemPrioridade[b.prioridade] || 0) - (ordemPrioridade[a.prioridade] || 0);
        
        case 'status':
          return a.status.localeCompare(b.status);
        
        case 'setor':
          return (a.setor_atual || '').localeCompare(b.setor_atual || '');
        
        default:
          return 0;
      }
    });
  }

  /**
   * Mapeia status da OS para status do kanban
   */
  private static mapearStatusOS(statusOS: string): string {
    const mapeamento: Record<string, string> = {
      'LIBERADA_PARA_PCP': 'LIBERADA_PARA_PCP',
      'EM_WORKFLOW': 'EM_WORKFLOW',
      'FINALIZADA': 'FINALIZADA',
      'REJEITADA': 'REJEITADA',
      'CANCELADA': 'CANCELADA'
    };

    return mapeamento[statusOS] || 'LIBERADA_PARA_PCP';
  }

  /**
   * Calcula progresso da OS
   */
  private static calcularProgresso(os: any): number {
    if (!os.workflow_instancia?.[0]?.etapas) return 0;
    
    const etapas = os.workflow_instancia[0].etapas;
    const totalEtapas = etapas.length;
    const etapasConcluidas = etapas.filter((etapa: any) => etapa.status === 'CONCLUIDA').length;
    
    return totalEtapas > 0 ? Math.round((etapasConcluidas / totalEtapas) * 100) : 0;
  }

  /**
   * Calcula progresso da instância
   */
  private static calcularProgressoInstancia(instancia: any): number {
    switch (instancia.status) {
      case 'PENDENTE': return 0;
      case 'EM_ANDAMENTO': return 50;
      case 'CONCLUIDA': return 100;
      default: return 0;
    }
  }

  /**
   * Gera alertas para a OS
   */
  private static gerarAlertas(os: any): string[] {
    const alertas: string[] = [];
    
    if (os.data_prazo && new Date(os.data_prazo) < new Date()) {
      alertas.push('Prazo vencido');
    }
    
    // Verificar estoque baixo (se houver integração)
    if (os.alertas_estoque && os.alertas_estoque.length > 0) {
      alertas.push(...os.alertas_estoque);
    }
    
    return alertas;
  }
}
