import { OrcamentoOrigemSobraService } from './orcamento-origem-sobra.service';

describe('OrcamentoOrigemSobraService', () => {
  const prisma = {
    orcamento: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  const service = new OrcamentoOrigemSobraService(prisma as any);

  it('busca orçamentos pela loja com termo', async () => {
    prisma.orcamento.findMany.mockResolvedValue([
      {
        id: 'orc-1',
        numero: '2026-001',
        titulo: 'Banner',
        status: 'APROVADO',
        data_criacao: new Date('2026-05-01'),
        cliente: { nome: 'Cliente A' },
      },
    ]);

    const lista = await service.buscarOrcamentos('loja-1', 'banner');

    expect(lista).toHaveLength(1);
    expect(lista[0].numero).toBe('2026-001');
    expect(prisma.orcamento.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ loja_id: 'loja-1' }),
      }),
    );
  });

  it('monta candidatos com sobra do cálculo congelado', async () => {
    prisma.orcamento.findFirst.mockResolvedValue({
      id: 'orc-1',
      numero: '2026-001',
      titulo: 'Lona',
      status: 'APROVADO',
      data_criacao: new Date(),
      cliente: { nome: 'Cliente' },
      produtos: [
        {
          id: 'prod-1',
          nome: 'Produto',
          nome_servico: 'Lona com Ilhós',
          insumos: [
            {
              id: 'item-1',
              quantidade: 19.2,
              unidade: 'M2',
              calculo_chapa: JSON.stringify({ sobra_area_m2: 68.92 }),
              insumo: {
                id: 'ins-1',
                nome: 'Bobina Lona',
                unidade_uso: 'M2',
                unidade_dimensao: 'm',
                formato_material: 'ROLO',
                largura: 1.4,
                altura: 50,
                largura_comercial: 1.4,
                altura_comercial: null,
                comprimento_comercial: 50,
                permite_registrar_sobra: true,
                permite_simulacao_chapa: true,
                categoria: { nome: 'Lonas' },
              },
            },
          ],
        },
      ],
    });

    const { candidatos } = await service.listarCandidatosSobra(
      'loja-1',
      'orc-1',
    );

    expect(candidatos).toHaveLength(1);
    expect(candidatos[0].sobra_estimada_m2).toBe(68.92);
    expect(candidatos[0].sugestao.orcamento_origem).toBe('orc-1');
  });
});
