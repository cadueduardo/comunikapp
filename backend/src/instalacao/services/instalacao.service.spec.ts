import { BadRequestException } from '@nestjs/common';
import { CategoriaOcorrencia, TipoOcorrencia } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { InstalacaoService } from './instalacao.service';
import { InstalacaoFechamentoService } from './instalacao-fechamento.service';
import { InstalacaoAgendaSyncService } from './instalacao-agenda-sync.service';
import { ConfiguracaoInstalacaoService } from './configuracao-instalacao.service';

describe('InstalacaoService', () => {
  let service: InstalacaoService;

  const fechamentoMock = {
    reterAposInstalacaoCompleta: jest.fn(),
  };

  const agendaSyncMock = {
    sincronizarDataOs: jest.fn(),
  };

  const configuracaoMock = {
    osAditivaHabilitada: jest.fn().mockResolvedValue(true),
  };

  const prismaMock = {
    itemOSInstalacao: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      aggregate: jest.fn(),
    },
    ordemServico: { findFirst: jest.fn(), findMany: jest.fn() },
    taxaOcorrenciaLoja: { findUnique: jest.fn() },
    ocorrenciaInstalacao: { create: jest.fn() },
    $transaction: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new InstalacaoService(
      prismaMock as unknown as PrismaService,
      fechamentoMock as unknown as InstalacaoFechamentoService,
      agendaSyncMock as unknown as InstalacaoAgendaSyncService,
      configuracaoMock as unknown as ConfiguracaoInstalacaoService,
    );
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
          status_financeiro: 'PENDENTE_PRECIFICACAO',
          custo_interno: null,
          preco_cliente: null,
          custo_sugerido: expect.anything(),
          preco_sugerido: expect.anything(),
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
    expect(prismaMock.itemOSInstalacao.update).not.toHaveBeenCalled();
  });

  it('fluxo legado: precifica automaticamente quando OS Aditiva está desabilitada', async () => {
    configuracaoMock.osAditivaHabilitada.mockResolvedValueOnce(false);
    prismaMock.ordemServico.findFirst.mockResolvedValue({ id: 'os-1' });
    prismaMock.taxaOcorrenciaLoja.findUnique.mockResolvedValue({
      custo_padrao: 40,
      preco_padrao: 90,
    });
    prismaMock.ocorrenciaInstalacao.create.mockResolvedValue({
      id: 'occ-legado',
      tipo: TipoOcorrencia.MATERIAL_EXTRA,
      categoria: CategoriaOcorrencia.PRODUCAO,
      quantidade: 1,
      descricao: 'Extra',
      criado_em: new Date(),
    });

    await service.registrarOcorrenciaObra({
      lojaId: 'loja-1',
      osId: 'os-1',
      tipo: TipoOcorrencia.MATERIAL_EXTRA,
      descricao: 'Extra',
    });

    expect(prismaMock.ocorrenciaInstalacao.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status_financeiro: 'PRECIFICADO',
          custo_interno: expect.anything(),
          preco_cliente: expect.anything(),
          custo_sugerido: null,
          preco_sugerido: null,
        }),
      }),
    );
  });

  it('persiste sugestões de taxa sem valores finais (pendente de precificação)', async () => {
    prismaMock.ordemServico.findFirst.mockResolvedValue({ id: 'os-1' });
    prismaMock.taxaOcorrenciaLoja.findUnique.mockResolvedValue({
      custo_padrao: 40,
      preco_padrao: 90,
    });
    prismaMock.ocorrenciaInstalacao.create.mockResolvedValue({
      id: 'occ-2',
      tipo: TipoOcorrencia.MATERIAL_EXTRA,
      categoria: CategoriaOcorrencia.PRODUCAO,
      quantidade: 3,
      descricao: 'Parafuso extra',
      criado_em: new Date('2026-07-01'),
    });

    await service.registrarOcorrenciaObra({
      lojaId: 'loja-1',
      osId: 'os-1',
      tipo: TipoOcorrencia.MATERIAL_EXTRA,
      quantidade: 3,
      descricao: 'Parafuso extra',
    });

    expect(prismaMock.ocorrenciaInstalacao.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          loja_id: 'loja-1',
          os_id: 'os-1',
          tipo: TipoOcorrencia.MATERIAL_EXTRA,
          status_financeiro: 'PENDENTE_PRECIFICACAO',
          custo_interno: null,
          preco_cliente: null,
          custo_sugerido: expect.anything(),
          preco_sugerido: expect.anything(),
        }),
      }),
    );
  });

  describe('atualizarEnderecoLote', () => {
    const dadosEndereco = {
      logradouro: 'Rua A',
      numero: '10',
      bairro: 'Centro',
      cidade: 'Osasco',
      uf: 'SP',
    };

    beforeEach(() => {
      prismaMock.$transaction.mockImplementation(async (callback) =>
        callback({
          itemOSInstalacao: {
            update: prismaMock.itemOSInstalacao.update,
          },
        }),
      );
    });

    it('rejeita quantidade_alocada que estoura a grade contratual da OS', async () => {
      prismaMock.itemOSInstalacao.findFirst.mockResolvedValue({
        id: 'lote-1',
        status_instalacao: 'AGUARDANDO',
        quantidade_alocada: 2,
        item_os_id: 'item-1',
        item_os: { os_id: 'os-1', quantidade: 20 },
      });
      prismaMock.itemOSInstalacao.aggregate.mockResolvedValue({
        _sum: { quantidade_alocada: 18 },
      });

      await expect(
        service.atualizarEnderecoLote('loja-1', 'lote-1', {
          ...dadosEndereco,
          quantidade_alocada: 5,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it('permite aumentar quantidade do lote dentro do saldo devolvido', async () => {
      prismaMock.itemOSInstalacao.findFirst.mockResolvedValue({
        id: 'lote-1',
        status_instalacao: 'AGUARDANDO',
        quantidade_alocada: 2,
        item_os_id: 'item-1',
        item_os: { os_id: 'os-1', quantidade: 20 },
      });
      prismaMock.itemOSInstalacao.aggregate.mockResolvedValue({
        _sum: { quantidade_alocada: 18 },
      });
      prismaMock.itemOSInstalacao.update.mockResolvedValue({
        id: 'lote-1',
        quantidade_alocada: 4,
        status_instalacao: 'AGUARDANDO',
      });

      await service.atualizarEnderecoLote('loja-1', 'lote-1', {
        ...dadosEndereco,
        quantidade_alocada: 4,
      });

      expect(prismaMock.itemOSInstalacao.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ quantidade_alocada: 4 }),
        }),
      );
    });
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

  describe('consultarAgenda', () => {
    it('retorna lotes no intervalo com dados operacionais do calendário', async () => {
      const dataPrevisao = new Date('2026-08-10T14:00:00.000Z');
      prismaMock.itemOSInstalacao.findMany.mockResolvedValue([
        {
          id: 'lote-1',
          data_previsao: dataPrevisao,
          turno_previsao: 'MANHA',
          equipe_instalacao: 'Equipe Alpha',
          status_instalacao: 'AGUARDANDO',
          cep: '01310100',
          logradouro: 'Av. Paulista',
          numero: '1000',
          complemento: null,
          bairro: 'Bela Vista',
          cidade: 'São Paulo',
          uf: 'SP',
          item_os: {
            os: {
              id: 'os-1',
              numero: 'OS-2026-001',
              nome_servico: 'Fachada ACM',
              status_instalacao_os: 'EM_ANDAMENTO',
              cliente: { nome: 'Cliente Teste' },
            },
          },
        },
      ]);

      const resultado = await service.consultarAgenda('loja-1', {
        data_inicio: '2026-08-01',
        data_fim: '2026-08-31',
      });

      expect(prismaMock.itemOSInstalacao.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            loja_id: 'loja-1',
            data_previsao: expect.objectContaining({
              not: null,
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
            item_os: { os: { loja_id: 'loja-1' } },
          }),
        }),
      );

      expect(resultado.total).toBe(1);
      expect(resultado.eventos[0]).toEqual(
        expect.objectContaining({
          lote_id: 'lote-1',
          os_id: 'os-1',
          os_numero: 'OS-2026-001',
          cliente_nome: 'Cliente Teste',
          nome_servico: 'Fachada ACM',
          status_instalacao_os: 'EM_ANDAMENTO',
          data_previsao: dataPrevisao.toISOString(),
          turno_previsao: 'MANHA',
          equipe_instalacao: 'Equipe Alpha',
          status_instalacao: 'AGUARDANDO',
          endereco_resumido: expect.stringContaining('Av. Paulista'),
        }),
      );
      expect(resultado.eventos[0].endereco).toEqual(
        expect.objectContaining({
          logradouro: 'Av. Paulista',
          cidade: 'São Paulo',
        }),
      );
    });

    it('retorna lista vazia quando não há instalações no período', async () => {
      prismaMock.itemOSInstalacao.findMany.mockResolvedValue([]);

      const resultado = await service.consultarAgenda('loja-1', {
        data_inicio: '2026-09-01',
        data_fim: '2026-09-30',
      });

      expect(resultado.total).toBe(0);
      expect(resultado.eventos).toEqual([]);
    });

    it('isola tenant — consulta sempre filtra pela loja do contexto', async () => {
      prismaMock.itemOSInstalacao.findMany.mockResolvedValue([]);

      await service.consultarAgenda('loja-segura', {
        data_inicio: '2026-08-01',
        data_fim: '2026-08-31',
      });

      const where =
        prismaMock.itemOSInstalacao.findMany.mock.calls[0][0].where;
      expect(where.loja_id).toBe('loja-segura');
      expect(where.item_os.os.loja_id).toBe('loja-segura');
    });
  });

  describe('consultarConflitosAgenda', () => {
    it('detecta conflito quando a mesma equipe tem 2+ lotes no mesmo dia', async () => {
      prismaMock.itemOSInstalacao.findMany.mockResolvedValue([
        {
          id: 'lote-1',
          data_previsao: new Date('2026-08-10T10:00:00.000Z'),
          equipe_instalacao: 'Equipe Alpha',
          item_os: {
            os: {
              numero: 'OS-2026-001',
              cliente: { nome: 'Cliente A' },
            },
          },
        },
        {
          id: 'lote-2',
          data_previsao: new Date('2026-08-10T18:00:00.000Z'),
          equipe_instalacao: 'Equipe Alpha',
          item_os: {
            os: {
              numero: 'OS-2026-005',
              cliente: { nome: 'Cliente B' },
            },
          },
        },
      ]);

      const resultado = await service.consultarConflitosAgenda('loja-1', {
        data_inicio: '2026-08-01',
        data_fim: '2026-08-31',
      });

      expect(resultado.total_conflitos).toBe(1);
      expect(resultado.conflitos[0]).toEqual({
        data: '2026-08-10',
        equipe_instalacao: 'Equipe Alpha',
        total_lotes_sobrepostos: 2,
        lotes: [
          {
            lote_id: 'lote-1',
            os_numero: 'OS-2026-001',
            cliente_nome: 'Cliente A',
          },
          {
            lote_id: 'lote-2',
            os_numero: 'OS-2026-005',
            cliente_nome: 'Cliente B',
          },
        ],
      });
    });

    it('não retorna conflito para equipes ou dias diferentes', async () => {
      prismaMock.itemOSInstalacao.findMany.mockResolvedValue([
        {
          id: 'lote-1',
          data_previsao: new Date('2026-08-10T10:00:00.000Z'),
          equipe_instalacao: 'Equipe Alpha',
          item_os: {
            os: { numero: 'OS-1', cliente: { nome: 'A' } },
          },
        },
        {
          id: 'lote-2',
          data_previsao: new Date('2026-08-11T10:00:00.000Z'),
          equipe_instalacao: 'Equipe Alpha',
          item_os: {
            os: { numero: 'OS-2', cliente: { nome: 'B' } },
          },
        },
        {
          id: 'lote-3',
          data_previsao: new Date('2026-08-10T14:00:00.000Z'),
          equipe_instalacao: 'Equipe Beta',
          item_os: {
            os: { numero: 'OS-3', cliente: { nome: 'C' } },
          },
        },
      ]);

      const resultado = await service.consultarConflitosAgenda('loja-1', {
        data_inicio: '2026-08-01',
        data_fim: '2026-08-31',
      });

      expect(resultado.total_conflitos).toBe(0);
      expect(resultado.conflitos).toEqual([]);
    });

    it('isola tenant na consulta de conflitos', async () => {
      prismaMock.itemOSInstalacao.findMany.mockResolvedValue([]);

      await service.consultarConflitosAgenda('loja-alfa', {
        data_inicio: '2026-08-01',
        data_fim: '2026-08-31',
      });

      expect(prismaMock.itemOSInstalacao.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            loja_id: 'loja-alfa',
            status_instalacao: {
              in: ['AGUARDANDO', 'EM_ANDAMENTO'],
            },
            equipe_instalacao: { not: null },
            item_os: { os: { loja_id: 'loja-alfa' } },
          }),
        }),
      );
    });
  });

  describe('listarOsInstalacaoGestao', () => {
    it('retorna grid de OS com progresso de lotes', async () => {
      prismaMock.ordemServico.findMany.mockResolvedValue([
        {
          id: 'os-1',
          numero: 'OS-100',
          nome_servico: 'Fachada',
          status_instalacao_os: 'EM_ANDAMENTO',
          data_instalacao_agendada: new Date('2026-08-15T12:00:00.000Z'),
          cliente: { nome: 'Cliente A' },
          itens: [
            {
              quantidade: 10,
              lotes_instalacao: [
                {
                  status_instalacao: 'CONCLUIDO',
                  quantidade_alocada: 5,
                  data_previsao: new Date('2026-08-20T10:00:00.000Z'),
                },
                {
                  status_instalacao: 'AGUARDANDO',
                  quantidade_alocada: 3,
                  data_previsao: new Date('2026-08-18T10:00:00.000Z'),
                },
              ],
            },
          ],
        },
      ]);

      const resultado = await service.listarOsInstalacaoGestao('loja-1');

      expect(prismaMock.ordemServico.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ loja_id: 'loja-1' }),
        }),
      );
      expect(resultado.total).toBe(1);
      expect(resultado.itens[0]).toEqual(
        expect.objectContaining({
          os_id: 'os-1',
          numero: 'OS-100',
          cliente_nome: 'Cliente A',
          progresso: expect.objectContaining({
            concluidos: 1,
            total: 2,
            alocados: 8,
          }),
        }),
      );
    });
  });
});
