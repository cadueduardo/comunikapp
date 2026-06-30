import { BadRequestException } from '@nestjs/common';
import { CategoriaOcorrencia, TipoOcorrencia } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { InstalacaoService } from './instalacao.service';

describe('InstalacaoService', () => {
  let service: InstalacaoService;

  const prismaMock = {
    itemOSInstalacao: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    ordemServico: { findFirst: jest.fn() },
    taxaOcorrenciaLoja: { findUnique: jest.fn() },
    ocorrenciaInstalacao: { create: jest.fn() },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new InstalacaoService(prismaMock as unknown as PrismaService);
  });

  it('lista lotes sem expor campos financeiros nas ocorrências', async () => {
    prismaMock.itemOSInstalacao.findMany.mockResolvedValue([]);

    await service.listarLotesPendentesInstalador('loja-1');

    const select = prismaMock.itemOSInstalacao.findMany.mock.calls[0][0].select;
    expect(select).not.toHaveProperty('custo_interno');
    expect(select).not.toHaveProperty('preco_cliente');
    expect(prismaMock.itemOSInstalacao.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ loja_id: 'loja-1' }),
      }),
    );
  });

  it('omite custo_interno e preco_cliente no select de ocorrências do lote', async () => {
    prismaMock.itemOSInstalacao.findFirst.mockResolvedValue({
      id: 'lote-1',
      ocorrencias: [],
    });

    await service.obterLoteInstalador('loja-1', 'lote-1');

    const selectOcorrencias =
      prismaMock.itemOSInstalacao.findFirst.mock.calls[0][0].select.ocorrencias
        .select;
    expect(selectOcorrencias).not.toHaveProperty('custo_interno');
    expect(selectOcorrencias).not.toHaveProperty('preco_cliente');
  });

  it('aplica taxas da loja ao registrar ocorrência sem expor valores na resposta', async () => {
    prismaMock.ordemServico.findFirst.mockResolvedValue({ id: 'os-1' });
    prismaMock.taxaOcorrenciaLoja.findUnique.mockResolvedValue({
      custo_padrao: 80,
      preco_padrao: 150,
    });
    prismaMock.ocorrenciaInstalacao.create.mockResolvedValue({
      id: 'occ-1',
      tipo: TipoOcorrencia.VISITA_IMPRODUTIVA,
      categoria: CategoriaOcorrencia.INSTALACAO,
      quantidade: 2,
      descricao: 'Cliente ausente',
      criado_em: new Date('2026-06-30'),
    });

    const resposta = await service.registrarOcorrenciaObra({
      lojaId: 'loja-1',
      osId: 'os-1',
      tipo: TipoOcorrencia.VISITA_IMPRODUTIVA,
      categoria: CategoriaOcorrencia.INSTALACAO,
      quantidade: 2,
      descricao: 'Cliente ausente',
    });

    expect(prismaMock.ocorrenciaInstalacao.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          loja_id: 'loja-1',
          custo_interno: expect.anything(),
          preco_cliente: expect.anything(),
        }),
        select: expect.not.objectContaining({
          custo_interno: expect.anything(),
          preco_cliente: expect.anything(),
        }),
      }),
    );
    expect(resposta).not.toHaveProperty('custo_interno');
    expect(resposta).not.toHaveProperty('preco_cliente');
    expect(resposta.quantidade).toBe(2);
  });

  it('rejeita ocorrência sem descrição', async () => {
    await expect(
      service.registrarOcorrenciaObra({
        lojaId: 'loja-1',
        osId: 'os-1',
        tipo: TipoOcorrencia.VISITA_IMPRODUTIVA,
        categoria: CategoriaOcorrencia.INSTALACAO,
        descricao: '   ',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
