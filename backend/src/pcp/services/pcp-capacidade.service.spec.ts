import { Test, TestingModule } from '@nestjs/testing';
import { PCPCapacidadeService } from './pcp-capacidade.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('PCPCapacidadeService', () => {
  let service: PCPCapacidadeService;

  const prisma = {
    setorProdutivo: { findMany: jest.fn() },
    maquina: { findMany: jest.fn() },
    workflowInstanciaSetor: { findMany: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PCPCapacidadeService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(PCPCapacidadeService);
    jest.clearAllMocks();
  });

  it('deve classificar carga normal abaixo de 70%', () => {
    const status = (service as any).classificarCarga(5, 8);
    expect(status).toBe('normal');
  });

  it('deve classificar sobrecarga acima de 100%', () => {
    const status = (service as any).classificarCarga(10, 8);
    expect(status).toBe('sobrecarregada');
  });

  it('deve somar apenas instancias validas por setor', async () => {
    prisma.setorProdutivo.findMany.mockResolvedValue([
      { id: 'setor-1', nome: 'Corte', cor: '#fff', horas_produtivas_mensais: 176 },
    ]);
    prisma.workflowInstanciaSetor.findMany.mockResolvedValue([
      {
        setor_id: 'setor-1',
        tempo_estimado: 120,
        status: 'PENDENTE',
        item_os: { id: 'item-1', parametros_tecnicos: null },
        workflow_instancia: { os: { id: 'os-1', numero: 'OS-1' } },
      },
    ]);

    const resultado = await service.obterCapacidadeSetores('loja-1');
    expect(resultado.setores[0].horas_programadas).toBe(2);
    expect(resultado.setores[0].itens_programados).toHaveLength(1);
  });

  it('deve agrupar item sem maquina em sem_maquina_definida', async () => {
    prisma.maquina.findMany.mockResolvedValue([
      {
        id: 'maq-1',
        nome: 'Router',
        horas_disponiveis_dia: 8,
        considerar_eficiencia_na_capacidade: false,
        eficiencia_percent: 100,
        setor: { id: 'setor-1', nome: 'Corte', horas_produtivas_mensais: null },
      },
    ]);
    prisma.workflowInstanciaSetor.findMany.mockResolvedValue([
      {
        setor_id: 'setor-1',
        tempo_estimado: 60,
        item_os: { id: 'item-1', parametros_tecnicos: '{}' },
        workflow_instancia: { os: { id: 'os-1', numero: 'OS-1' } },
      },
    ]);

    const resultado = await service.obterCapacidadeMaquinas('loja-1', {
      setorId: 'setor-1',
    });

    expect(resultado.sem_maquina_definida?.itens_programados).toHaveLength(1);
    expect(resultado.maquinas[0].horas_programadas).toBe(0);
  });
});
