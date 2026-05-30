import {
  OSCardKanban,
  KanbanStats,
  StatusSetorProdutivo,
} from '../entities/pcp.entities';

export class KanbanMapper {
  /**
   * Mapeia dados brutos do Prisma para formato do kanban
   */
  static mapearOSParaKanban(os: any): OSCardKanban {
    // schema.prisma define OrdemServico.workflow_instancia como WorkflowInstancia?
    // (relação 1-para-1 opcional). O include do Prisma devolve OBJETO ou null,
    // nunca array. O código antigo tratava como array (?.[0]) e quebrava
    // silenciosamente o progresso/setor/operador dos cards.
    const workflowAtivo = os.workflow_instancia ?? null;
    const instanciaAtiva = this.resolverInstanciaSetorAtiva(workflowAtivo);
    const workflowInfo = this.extrairWorkflowInfo(workflowAtivo);

    return {
      id: os.id,
      numero: os.numero,
      titulo: os.nome_servico,
      cliente: os.cliente?.nome || 'Cliente não informado',
      status: this.resolverStatusKanbanOS(os),
      prioridade: os.prioridade || 'MEDIA',
      responsavel: instanciaAtiva?.operador?.nome || 'Não atribuído',
      data_prazo: os.data_prazo
        ? new Date(os.data_prazo).toISOString().split('T')[0]
        : '',
      progresso: this.calcularProgresso(os),
      alertas: this.gerarAlertas(os),
      tem_workflow: Boolean(workflowAtivo),
      ...workflowInfo,
      setor_atual: instanciaAtiva?.setor?.nome,
      operador_atual: instanciaAtiva?.operador?.nome,
    };
  }

  /**
   * Mapeia instância de setor para formato do kanban
   */
  static mapearInstanciaParaKanban(instancia: any): OSCardKanban {
    const os =
      instancia.item_os?.os ?? instancia.workflow_instancia?.os ?? null;
    const workflowInfo = this.extrairWorkflowInfo(instancia.workflow_instancia);

    return {
      id: instancia.item_os_id ?? instancia.id,
      os_id: os?.id,
      operador_id: instancia.operador_id ?? undefined,
      instancia_setor_id: instancia.id,
      setor_id: instancia.setor_id,
      etapa_ordem: instancia.ordem ?? undefined,
      proximos_setores_ids: this.calcularProximosSetoresIds(instancia),
      numero: os?.numero || instancia.workflow_instancia?.os_id || '',
      titulo:
        instancia.item_os?.produto_servico ||
        instancia.workflow_instancia?.os?.nome_servico ||
        'Produto',
      cliente: os?.cliente?.nome || 'Cliente nÃ£o informado',
      status: instancia.status,
      prioridade: os?.prioridade || 'MEDIA',
      responsavel: instancia.operador?.nome || 'NÃ£o atribuÃ­do',
      data_prazo: os?.data_prazo
        ? new Date(os.data_prazo).toISOString().split('T')[0]
        : '',
      progresso: this.calcularProgressoInstancia(instancia),
      alertas: [],
      tem_workflow: true,
      ...workflowInfo,
      setor_atual: instancia.setor?.nome,
      operador_atual: instancia.operador?.nome,
    };
  }

  /**
   * Agrupa cards por status para exibição no kanban
   */
  static agruparPorStatus(
    cards: OSCardKanban[],
  ): Record<string, OSCardKanban[]> {
    return cards.reduce(
      (grupos, card) => {
        if (!grupos[card.status]) {
          grupos[card.status] = [];
        }
        grupos[card.status].push(card);
        return grupos;
      },
      {} as Record<string, OSCardKanban[]>,
    );
  }

  /**
   * Agrupa cards por setor
   */
  static agruparPorSetor(
    cards: OSCardKanban[],
  ): Record<string, OSCardKanban[]> {
    return cards.reduce(
      (grupos, card) => {
        const setor = card.setor_atual || 'Sem Setor';
        if (!grupos[setor]) {
          grupos[setor] = [];
        }
        grupos[setor].push(card);
        return grupos;
      },
      {} as Record<string, OSCardKanban[]>,
    );
  }

  /**
   * Calcula estatísticas do kanban
   */
  static calcularEstatisticas(cards: OSCardKanban[]): KanbanStats {
    const hoje = new Date();

    // Os cards aqui já passaram por `mapearStatusOS` e portanto carregam o
    // bucket de coluna (FILA | PRODUCAO | CONCLUIDA | REJEITADA), e não o
    // status técnico da OrdemServico. Manter os contadores alinhados a esses
    // buckets evita que os totais fiquem permanentemente zerados na UI.
    const stats: KanbanStats = {
      total: cards.length,
      fila: cards.filter((c) => c.status === 'FILA').length,
      producao: cards.filter((c) => c.status === 'PRODUCAO').length,
      concluida: cards.filter((c) => c.status === 'CONCLUIDA').length,
      rejeitada: cards.filter((c) => c.status === 'REJEITADA').length,
      atrasadas: cards.filter((c) => {
        if (!c.data_prazo) return false;
        return new Date(c.data_prazo) < hoje && c.status !== 'CONCLUIDA';
      }).length,
      criticas: cards.filter((c) => c.prioridade === 'CRITICA').length,
      por_setor: {},
    };

    // Calcular por setor
    cards.forEach((card) => {
      if (card.setor_atual) {
        stats.por_setor[card.setor_atual] =
          (stats.por_setor[card.setor_atual] || 0) + 1;
      }
    });

    return stats;
  }

  /**
   * Filtra cards baseado em critérios
   */
  static filtrarCards(
    cards: OSCardKanban[],
    filtros: {
      status?: string;
      prioridade?: string;
      setor?: string;
      operador?: string;
      busca?: string;
    },
  ): OSCardKanban[] {
    return cards.filter((card) => {
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
  static ordenarCards(
    cards: OSCardKanban[],
    criterio: 'prazo' | 'prioridade' | 'status' | 'setor',
  ): OSCardKanban[] {
    return [...cards].sort((a, b) => {
      switch (criterio) {
        case 'prazo':
          if (!a.data_prazo && !b.data_prazo) return 0;
          if (!a.data_prazo) return 1;
          if (!b.data_prazo) return -1;
          return (
            new Date(a.data_prazo).getTime() - new Date(b.data_prazo).getTime()
          );

        case 'prioridade':
          const ordemPrioridade = { CRITICA: 4, ALTA: 3, MEDIA: 2, BAIXA: 1 };
          return (
            (ordemPrioridade[b.prioridade] || 0) -
            (ordemPrioridade[a.prioridade] || 0)
          );

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
   * Mapeia o status técnico da OS (`OrdemServico.status`) para o bucket de
   * coluna esperado pelo KanbanBoard do frontend (FILA | PRODUCAO | CONCLUIDA |
   * REJEITADA). O componente `frontend/src/components/ui/kanban-board.tsx`
   * agrupa cards via igualdade estrita (`card.status === column.status`); sem
   * esse mapeamento, todos os cards caem em buckets inexistentes e o board
   * fica vazio mesmo quando há OS para mostrar.
   */
  private static mapearStatusOS(statusOS: string): string {
    const mapeamento: Record<string, string> = {
      // OS aprovada tecnicamente mas ainda sem WorkflowInstancia vinculada
      // entra direto na FILA do Kanban para sinalizar trabalho pendente.
      APROVADA_TECNICA: 'FILA',
      LIBERADA_PARA_PCP: 'FILA',
      AGUARDANDO_MATERIAL: 'FILA',
      EM_WORKFLOW: 'PRODUCAO',
      PRODUCAO: 'PRODUCAO',
      ACABAMENTO: 'PRODUCAO',
      FINALIZADA: 'CONCLUIDA',
      REJEITADA: 'REJEITADA',
      CANCELADA: 'REJEITADA',
    };

    return mapeamento[statusOS] || 'FILA';
  }

  private static resolverStatusKanbanOS(os: any): string {
    const workflowInstancia = os.workflow_instancia;
    if (workflowInstancia?.status === 'CONCLUIDO') {
      return 'CONCLUIDA';
    }

    const instanciasSetor = workflowInstancia?.instancias_setor;
    if (Array.isArray(instanciasSetor) && instanciasSetor.length > 0) {
      const relevantes = instanciasSetor.filter(
        (instancia: any) => instancia.status !== 'CANCELADA',
      );
      const concluidas = relevantes.filter(
        (instancia: any) => instancia.status === 'CONCLUIDA',
      );
      const ativas = relevantes.filter((instancia: any) =>
        ['PENDENTE', 'EM_ANDAMENTO', 'PAUSADA', 'AGUARDANDO'].includes(
          instancia.status,
        ),
      );

      if (relevantes.length > 0 && concluidas.length === relevantes.length) {
        return 'CONCLUIDA';
      }

      if (
        ativas.some((instancia: any) =>
          ['EM_ANDAMENTO', 'PAUSADA'].includes(instancia.status),
        ) ||
        concluidas.length > 0
      ) {
        return 'PRODUCAO';
      }
    }

    return this.mapearStatusOS(os.status);
  }

  private static resolverInstanciaSetorAtiva(workflowInstancia: any) {
    const instanciasSetor = workflowInstancia?.instancias_setor;
    if (!Array.isArray(instanciasSetor) || instanciasSetor.length === 0) {
      return null;
    }

    return [...instanciasSetor]
      .filter((instancia: any) =>
        ['PENDENTE', 'EM_ANDAMENTO', 'PAUSADA'].includes(instancia.status),
      )
      .sort(
        (a: any, b: any) =>
          (a.ordem ?? 0) - (b.ordem ?? 0) ||
          String(a.id).localeCompare(String(b.id)),
      )[0];
  }

  private static calcularProximosSetoresIds(instancia: any): string[] {
    const ordemAtual = instancia.ordem ?? 0;
    const itemOsId = instancia.item_os_id ?? null;
    const instanciasSetor = instancia.workflow_instancia?.instancias_setor ?? [];

    return instanciasSetor
      .filter((destino: any) => {
        if (destino.setor_id === instancia.setor_id) {
          return false;
        }
        if (itemOsId && destino.item_os_id && destino.item_os_id !== itemOsId) {
          return false;
        }
        if (['CONCLUIDA', 'CANCELADA'].includes(destino.status)) {
          return false;
        }
        return destino.ordem <= ordemAtual + 1 && destino.ordem >= ordemAtual;
      })
      .map((destino: any) => destino.setor_id as string)
      .filter((setorId: string, index: number, lista: string[]) =>
        lista.indexOf(setorId) === index,
      );
  }

  /**
   * Calcula progresso da OS
   */
  private static calcularProgresso(os: any): number {
    const instanciasSetor = os.workflow_instancia?.instancias_setor;
    if (Array.isArray(instanciasSetor) && instanciasSetor.length > 0) {
      const relevantes = instanciasSetor.filter(
        (instancia: any) => instancia.status !== 'CANCELADA',
      );
      if (relevantes.length === 0) {
        return 0;
      }

      const concluidas = relevantes.filter(
        (instancia: any) => instancia.status === 'CONCLUIDA',
      ).length;

      return Math.round((concluidas / relevantes.length) * 100);
    }

    const etapas = os.workflow_instancia?.etapas;
    if (!Array.isArray(etapas) || etapas.length === 0) return 0;

    const totalEtapas = etapas.length;
    const etapasConcluidas = etapas.filter(
      (etapa: any) => etapa.status === 'CONCLUIDA',
    ).length;

    return Math.round((etapasConcluidas / totalEtapas) * 100);
  }

  /**
   * Calcula progresso da instância
   */
  private static calcularProgressoInstancia(instancia: any): number {
    switch (instancia.status) {
      case 'PENDENTE':
        return 0;
      case 'EM_ANDAMENTO':
        return 50;
      case 'CONCLUIDA':
        return 100;
      default:
        return 0;
    }
  }

  private static gerarAlertas(os: any): string[] {
    const alertas: string[] = [];

    if (!os.workflow_instancia) {
      alertas.unshift('sem_workflow');
    } else {
      const instanciasSetor = os.workflow_instancia.instancias_setor;
      if (!Array.isArray(instanciasSetor) || instanciasSetor.length === 0) {
        alertas.unshift('workflow_sem_setores');
      }
    }

    if (os.data_prazo && new Date(os.data_prazo) < new Date()) {
      alertas.push('Prazo vencido');
    }

    // Verificar estoque baixo (se houver integração)
    if (os.alertas_estoque && os.alertas_estoque.length > 0) {
      alertas.push(...os.alertas_estoque);
    }

    return alertas;
  }

  private static extrairWorkflowInfo(workflowInstancia: any): {
    workflow_id?: string;
    workflow_nome?: string;
    workflow_setores_nomes?: string[];
  } {
    const workflow = workflowInstancia?.workflow;
    if (!workflow) {
      return {};
    }

    const setoresNomes = (workflow.workflow_setores ?? [])
      .slice()
      .sort(
        (a: { ordem?: number }, b: { ordem?: number }) =>
          (a.ordem ?? 0) - (b.ordem ?? 0),
      )
      .map((item: { setor?: { nome?: string } }) => item.setor?.nome)
      .filter((nome: string | undefined): nome is string => Boolean(nome));

    return {
      workflow_id: workflow.id,
      workflow_nome: workflow.nome,
      workflow_setores_nomes: setoresNomes,
    };
  }
}
