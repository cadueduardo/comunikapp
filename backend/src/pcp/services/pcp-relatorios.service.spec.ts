import { Test, TestingModule } from '@nestjs/testing';
import { PCPRelatoriosService } from './pcp-relatorios.service';
import { PCPCapacidadeService } from './pcp-capacidade.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('PCPRelatoriosService', () => {
  let service: PCPRelatoriosService;

  const capacidadeService = {
    obterCapacidadeMaquinas: jest.fn(),
  };

  const prisma = {
    workflowInstanciaSetor: { findMany: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PCPRelatoriosService,
        { provide: PrismaService, useValue: prisma },
        { provide: PCPCapacidadeService, useValue: capacidadeService },
      ],
    }).compile();

    service = module.get(PCPRelatoriosService);
    jest.clearAllMocks();
  });

  it('deve delegar ocupação de máquinas ao serviço de capacidade', async () => {
    capacidadeService.obterCapacidadeMaquinas.mockResolvedValue({
      maquinas: [],
    });

    await service.obterOcupacaoMaquinas('loja-1', { setorId: 's1' });

    expect(capacidadeService.obterCapacidadeMaquinas).toHaveBeenCalledWith(
      'loja-1',
      { setorId: 's1' },
    );
  });

  it('deve calcular desvio previsto x realizado por setor', async () => {
    prisma.workflowInstanciaSetor.findMany.mockResolvedValue([
      {
        id: 'wis-1',
        setor_id: 'setor-1',
        item_os_id: 'item-1',
        status: 'CONCLUIDA',
        tempo_estimado: 60,
        tempo_real: 90,
        data_inicio: null,
        data_conclusao: new Date(),
        setor: { id: 'setor-1', nome: 'Impressão', cor: '#00f' },
        item_os: { id: 'item-1', produto_servico: 'Banner' },
        workflow_instancia: {
          os_id: 'os-1',
          os: { id: 'os-1', numero: 'OS-100', nome_servico: 'Job teste' },
        },
      },
    ]);

    const resultado = await service.obterPrevistoRealizado('loja-1');

    expect(resultado.resumo.total_itens).toBe(1);
    expect(resultado.resumo.tempo_previsto_min).toBe(60);
    expect(resultado.resumo.tempo_realizado_min).toBe(90);
    expect(resultado.resumo.desvio_min).toBe(30);
    expect(resultado.por_setor[0].setor_nome).toBe('Impressão');
    expect(resultado.itens[0].desvio_percent).toBe(50);
  });
});
