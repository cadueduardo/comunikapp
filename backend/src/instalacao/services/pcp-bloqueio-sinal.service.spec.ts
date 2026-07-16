import { Test, TestingModule } from '@nestjs/testing';
import { ParcelaStatus } from '../../financeiro/enums/cobranca-status.enum';
import { PrismaService } from '../../prisma/prisma.service';
import { HomeCacheService } from '../../home-operacional/services/home-cache.service';
import { StatusLiberacaoPcp } from '../constants/pcp-liberacao.constants';
import { ConfiguracaoInstalacaoService } from './configuracao-instalacao.service';
import {
  PcpBloqueioSinalService,
  TIPO_LOG_LIBERACAO_FINANCEIRA,
} from './pcp-bloqueio-sinal.service';

describe('PcpBloqueioSinalService', () => {
  let service: PcpBloqueioSinalService;

  const prismaMock = {
    cobranca: { findFirst: jest.fn() },
    itemOS: { updateMany: jest.fn() },
    ordemServico: { findMany: jest.fn(), update: jest.fn() },
    ordemServicoLog: { create: jest.fn() },
  };

  const configuracaoMock = {
    deveExigirSinalProducao: jest.fn(),
  };

  const homeCacheMock = {
    invalidarPorPrefixo: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PcpBloqueioSinalService,
        { provide: PrismaService, useValue: prismaMock },
        {
          provide: ConfiguracaoInstalacaoService,
          useValue: configuracaoMock,
        },
        { provide: HomeCacheService, useValue: homeCacheMock },
      ],
    }).compile();

    service = module.get(PcpBloqueioSinalService);
  });

  it('retorna BLOQUEADO_AGUARDANDO_SINAL quando a loja exige sinal', async () => {
    configuracaoMock.deveExigirSinalProducao.mockResolvedValue(true);
    prismaMock.cobranca.findFirst.mockResolvedValue(null);

    const status = await service.resolverStatusInicialItem('loja-1', 'orc-1');

    expect(status).toBe(StatusLiberacaoPcp.BLOQUEADO_AGUARDANDO_SINAL);
  });

  it('retorna PENDENTE quando o sinal já está liquidado', async () => {
    configuracaoMock.deveExigirSinalProducao.mockResolvedValue(true);
    prismaMock.cobranca.findFirst.mockResolvedValue({
      parcelas: [{ status: ParcelaStatus.LIQUIDADO }],
    });

    const status = await service.resolverStatusInicialItem('loja-1', 'orc-1');

    expect(status).toBe(StatusLiberacaoPcp.PENDENTE);
  });

  it('promove OS retida no financeiro mesmo sem itens bloqueados no PCP', async () => {
    prismaMock.cobranca.findFirst.mockResolvedValue({
      orcamento_id: 'orc-1',
    });
    prismaMock.ordemServico.findMany
      .mockResolvedValueOnce([{ id: 'os-1' }]) // promover
      .mockResolvedValueOnce([{ id: 'os-1' }]); // desbloqueio (logs)
    prismaMock.ordemServico.update.mockResolvedValue({});
    prismaMock.ordemServicoLog.create.mockResolvedValue({});
    prismaMock.itemOS.updateMany.mockResolvedValue({ count: 0 });

    const resultado = await service.processarEntradaLiquidadaCobranca(
      'loja-1',
      'cob-1',
    );

    expect(resultado.os_promovidas).toBe(1);
    expect(resultado.itens_desbloqueados).toBe(0);
    expect(prismaMock.ordemServico.update).toHaveBeenCalledWith({
      where: { id: 'os-1' },
      data: {
        status: 'AGUARDANDO_APROVACAO_TECNICA',
        atualizado_em: expect.any(Date),
      },
    });
    expect(prismaMock.ordemServicoLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          os_id: 'os-1',
          tipo_acao: TIPO_LOG_LIBERACAO_FINANCEIRA,
        }),
      }),
    );
    expect(homeCacheMock.invalidarPorPrefixo).toHaveBeenCalledWith('loja-1:');
  });

  it('desbloqueia itens bloqueados ao liquidar entrada', async () => {
    prismaMock.cobranca.findFirst.mockResolvedValue({
      orcamento_id: 'orc-1',
    });
    prismaMock.ordemServico.findMany
      .mockResolvedValueOnce([]) // nenhuma OS a promover
      .mockResolvedValueOnce([{ id: 'os-1' }]);
    prismaMock.itemOS.updateMany.mockResolvedValue({ count: 2 });
    prismaMock.ordemServicoLog.create.mockResolvedValue({});

    const resultado = await service.processarEntradaLiquidadaCobranca(
      'loja-1',
      'cob-1',
    );

    expect(resultado.itens_desbloqueados).toBe(2);
    expect(resultado.os_promovidas).toBe(0);
    expect(prismaMock.itemOS.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status_liberacao_pcp: StatusLiberacaoPcp.PENDENTE },
      }),
    );
  });
});
