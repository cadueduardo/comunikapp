import {
  carregarContextoOperacionalOs,
  resolverStatusPrazoOperacional,
} from './os-contexto-operacional.util';

describe('resolverStatusPrazoOperacional', () => {
  it('prioriza instalação em andamento sobre prazo futuro', () => {
    const ctx = {
      statusOs: 'FINALIZADA',
      statusInstalacaoOs: 'EM_ANDAMENTO',
      statusExpedicao: null,
      lotesEmAndamento: 2,
      lotesAguardando: 0,
      lotesTotal: 3,
    };

    const resultado = resolverStatusPrazoOperacional(
      ctx,
      new Date('2026-07-06'),
    );

    expect(resultado?.status).toBe('EM_PRODUCAO');
    expect(resultado?.mensagem).toContain('Instalação em andamento');
  });

  it('indica expedição ativa quando produção já finalizou', () => {
    const ctx = {
      statusOs: 'FINALIZADA',
      statusInstalacaoOs: null,
      statusExpedicao: 'AGUARDANDO_SEPARACAO',
      lotesEmAndamento: 0,
      lotesAguardando: 0,
      lotesTotal: 0,
    };

    const resultado = resolverStatusPrazoOperacional(ctx, new Date('2026-07-06'));

    expect(resultado?.mensagem).toContain('expedição');
  });

  it('retorna null quando não há atividade operacional', () => {
    const ctx = {
      statusOs: 'LIBERADA_PARA_PCP',
      statusInstalacaoOs: null,
      statusExpedicao: null,
      lotesEmAndamento: 0,
      lotesAguardando: 0,
      lotesTotal: 0,
    };

    expect(resolverStatusPrazoOperacional(ctx, new Date('2026-07-06'))).toBeNull();
  });
});

describe('carregarContextoOperacionalOs', () => {
  it('agrega lotes e expedição', async () => {
    const prisma = {
      ordemServico: {
        findFirst: jest.fn().mockResolvedValue({
          status: 'FINALIZADA',
          status_instalacao_os: 'EM_ANDAMENTO',
        }),
      },
      itemOSInstalacao: {
        findMany: jest.fn().mockResolvedValue([
          { status_instalacao: 'EM_ANDAMENTO' },
          { status_instalacao: 'AGUARDANDO' },
        ]),
      },
      expedicaoLogistica: {
        findFirst: jest.fn().mockResolvedValue({ status: 'EM_ROTA_DE_ENTREGA' }),
      },
    };

    const ctx = await carregarContextoOperacionalOs(
      prisma as never,
      'os-1',
      'loja-1',
    );

    expect(ctx.lotesEmAndamento).toBe(1);
    expect(ctx.statusExpedicao).toBe('EM_ROTA_DE_ENTREGA');
  });
});
