import { Injectable, Logger } from '@nestjs/common';
import {
  KanbanSetorColuna,
  KanbanStats,
  OSCardKanban,
} from '../entities/pcp.entities';
import { PCPConfiguracaoService } from './pcp-configuracao.service';
import { PCPKanbanService } from './pcp-kanban.service';
import { NivelPCP } from '../dto/pcp-configuracao.dto';

export interface GargaloSetorResumo {
  setor_id: string;
  titulo: string;
  score_gargalo: number;
  nivel_gargalo: 'BAIXO' | 'MEDIO' | 'ALTO';
  pendentes: number;
  pausadas: number;
  atrasadas: number;
}

export interface PCPDashboardResponse {
  configuracao: {
    nivel: NivelPCP | null;
    definido: boolean;
  };
  stats: KanbanStats;
  cards_atencao: OSCardKanban[];
  gargalos: GargaloSetorResumo[];
  gerado_em: string;
}

@Injectable()
export class PCPDashboardService {
  private readonly logger = new Logger(PCPDashboardService.name);

  constructor(
    private readonly configuracaoService: PCPConfiguracaoService,
    private readonly kanbanService: PCPKanbanService,
  ) {}

  async obter(lojaId: string): Promise<PCPDashboardResponse> {
    this.logger.log(`Montando dashboard PCP para loja ${lojaId}`);

    const configuracao = await this.configuracaoService.obter(lojaId);
    const { cards, stats } = await this.kanbanService.obterKanbanGeral(lojaId, {});
    const cards_atencao = this.selecionarCardsAtencao(cards);

    let gargalos: GargaloSetorResumo[] = [];

    if (configuracao.nivel === NivelPCP.COMPLETO) {
      const kanbanSetores = await this.kanbanService.obterKanbanPorSetores(
        lojaId,
        {},
      );
      gargalos = this.montarGargalos(kanbanSetores.colunas);
    }

    return {
      configuracao,
      stats,
      cards_atencao,
      gargalos,
      gerado_em: new Date().toISOString(),
    };
  }

  private selecionarCardsAtencao(
    cards: OSCardKanban[],
    limite = 6,
  ): OSCardKanban[] {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    return cards
      .filter((card) => {
        const temAlerta =
          Array.isArray(card.alertas) && card.alertas.length > 0;
        const aguardandoEntrada =
          card.status === 'FILA' || card.tem_workflow === false;
        const prazo = card.data_prazo ? new Date(card.data_prazo) : null;
        const atrasado =
          !!prazo && prazo < hoje && card.status !== 'CONCLUIDA';
        return temAlerta || atrasado || !card.data_prazo || aguardandoEntrada;
      })
      .slice(0, limite);
  }

  private montarGargalos(
    colunas: KanbanSetorColuna[],
    limite = 3,
  ): GargaloSetorResumo[] {
    return colunas
      .filter((coluna) => coluna.score_gargalo > 0)
      .sort((a, b) => b.score_gargalo - a.score_gargalo)
      .slice(0, limite)
      .map((coluna) => ({
        setor_id: coluna.setor_id,
        titulo: coluna.titulo,
        score_gargalo: coluna.score_gargalo,
        nivel_gargalo: coluna.nivel_gargalo,
        pendentes: coluna.pendentes,
        pausadas: coluna.pausadas,
        atrasadas: coluna.atrasadas,
      }));
  }
}
