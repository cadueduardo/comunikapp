import { Test, TestingModule } from '@nestjs/testing';
import { TipoOcorrencia } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TaxaOcorrenciaLojaSeeder } from './taxa-ocorrencia-loja.seeder';

describe('TaxaOcorrenciaLojaSeeder', () => {
  let seeder: TaxaOcorrenciaLojaSeeder;

  const prismaMock = {
    taxaOcorrenciaLoja: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaxaOcorrenciaLojaSeeder,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    seeder = module.get(TaxaOcorrenciaLojaSeeder);
  });

  it('cria as quatro taxas padrão quando a loja ainda não possui nenhuma', async () => {
    prismaMock.taxaOcorrenciaLoja.findUnique.mockResolvedValue(null);
    prismaMock.taxaOcorrenciaLoja.create.mockResolvedValue({});

    const resultado = await seeder.seed('loja-1');

    expect(resultado.criadas).toHaveLength(4);
    expect(resultado.criadas).toContain(TipoOcorrencia.VISITA_IMPRODUTIVA);
    expect(prismaMock.taxaOcorrenciaLoja.create).toHaveBeenCalledTimes(4);
  });

  it('é idempotente e ignora taxas já existentes', async () => {
    prismaMock.taxaOcorrenciaLoja.findUnique.mockResolvedValue({
      id: 'taxa-1',
    });

    const resultado = await seeder.seed('loja-1');

    expect(resultado.criadas).toHaveLength(0);
    expect(resultado.ignoradas).toHaveLength(4);
    expect(prismaMock.taxaOcorrenciaLoja.create).not.toHaveBeenCalled();
  });
});
