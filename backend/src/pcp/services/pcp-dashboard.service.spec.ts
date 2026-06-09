import { Test, TestingModule } from '@nestjs/testing';
import { PCPDashboardService } from './pcp-dashboard.service';
import { PCPConfiguracaoService } from './pcp-configuracao.service';
import { PCPKanbanService } from './pcp-kanban.service';
import { NivelPCP } from '../dto/pcp-configuracao.dto';

describe('PCPDashboardService', () => {
  let service: PCPDashboardService;
  let configuracaoService: jest.Mocked<Pick<PCPConfiguracaoService, 'obter'>>;
  let kanbanService: jest.Mocked<
    Pick<PCPKanbanService, 'obterKanbanGeral' | 'obterKanbanPorSetores'>
  >;

  beforeEach(async () => {
    configuracaoService = {
      obter: jest.fn(),
    };
    kanbanService = {
      obterKanbanGeral: jest.fn(),
      obterKanbanPorSetores: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PCPDashboardService,
        { provide: PCPConfiguracaoService, useValue: configuracaoService },
        { provide: PCPKanbanService, useValue: kanbanService },
      ],
    }).compile();

    service = module.get(PCPDashboardService);
    jest.clearAllMocks();
  });

  it('deve montar dashboard essencial sem gargalos', async () => {
    configuracaoService.obter.mockResolvedValue({
      nivel: NivelPCP.ESSENCIAL,
      definido: true,
    });
    kanbanService.obterKanbanGeral.mockResolvedValue({
      cards: [
        {
          id: 'os-1',
          numero: 'OS-1',
          titulo: 'Banner',
          cliente: 'Cliente',
          status: 'FILA',
          prioridade: 'ALTA',
          responsavel: 'Op',
          data_prazo: '',
          progresso: 0,
          alertas: ['Sem prazo'],
          tem_workflow: false,
        },
      ],
      stats: {
        total: 1,
        fila: 1,
        producao: 0,
        concluida: 0,
        rejeitada: 0,
        atrasadas: 0,
        criticas: 0,
        por_setor: {},
      },
    });

    const resultado = await service.obter('loja-1');

    expect(resultado.configuracao.nivel).toBe(NivelPCP.ESSENCIAL);
    expect(resultado.stats.total).toBe(1);
    expect(resultado.cards_atencao).toHaveLength(1);
    expect(resultado.gargalos).toEqual([]);
    expect(kanbanService.obterKanbanPorSetores).not.toHaveBeenCalled();
  });

  it('deve incluir gargalos no modo completo', async () => {
    configuracaoService.obter.mockResolvedValue({
      nivel: NivelPCP.COMPLETO,
      definido: true,
    });
    kanbanService.obterKanbanGeral.mockResolvedValue({
      cards: [],
      stats: {
        total: 0,
        fila: 0,
        producao: 0,
        concluida: 0,
        rejeitada: 0,
        atrasadas: 0,
        criticas: 0,
        por_setor: {},
      },
    });
    kanbanService.obterKanbanPorSetores.mockResolvedValue({
      colunas: [
        {
          id: 'setor-a',
          setor_id: 'setor-a',
          titulo: 'Corte',
          cor: '#f00',
          ordem: 1,
          total: 5,
          pendentes: 3,
          em_andamento: 1,
          pausadas: 1,
          atrasadas: 2,
          score_gargalo: 12,
          nivel_gargalo: 'ALTO',
          cards: [],
        },
        {
          id: 'setor-b',
          setor_id: 'setor-b',
          titulo: 'Impressão',
          cor: '#00f',
          ordem: 2,
          total: 0,
          pendentes: 0,
          em_andamento: 0,
          pausadas: 0,
          atrasadas: 0,
          score_gargalo: 0,
          nivel_gargalo: 'BAIXO',
          cards: [],
        },
      ],
      total: 5,
      gerado_em: new Date().toISOString(),
    });

    const resultado = await service.obter('loja-1');

    expect(kanbanService.obterKanbanPorSetores).toHaveBeenCalledWith('loja-1', {});
    expect(resultado.gargalos).toHaveLength(1);
    expect(resultado.gargalos[0]).toMatchObject({
      setor_id: 'setor-a',
      titulo: 'Corte',
      nivel_gargalo: 'ALTO',
    });
  });
});
