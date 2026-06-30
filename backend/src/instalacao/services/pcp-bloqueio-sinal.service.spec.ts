import { Test, TestingModule } from '@nestjs/testing';
import { ParcelaStatus } from '../../financeiro/enums/cobranca-status.enum';
import { PrismaService } from '../../prisma/prisma.service';
import { StatusLiberacaoPcp } from '../constants/pcp-liberacao.constants';
import { ConfiguracaoInstalacaoService } from './configuracao-instalacao.service';
import { PcpBloqueioSinalService } from './pcp-bloqueio-sinal.service';

describe('PcpBloqueioSinalService', () => {
  let service: PcpBloqueioSinalService;

  const prismaMock = {
    cobranca: { findFirst: jest.fn() },
    itemOS: { updateMany: jest.fn() },
    ordemServico: { findMany: jest.fn() },
    ordemServicoLog: { create: jest.fn() },
  };

  const configuracaoMock = {
    deveExigirSinalProducao: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PcpBloqueioSinalService,
        { provide: PrismaService, useValue: prismaMock },
        {
          provide: ConfiguracaoInstalacaoService,
          useValue: configuracaoMock,
        },
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

  it('desbloqueia itens bloqueados ao liquidar entrada', async () => {
    prismaMock.cobranca.findFirst.mockResolvedValue({
      orcamento_id: 'orc-1',
    });
    prismaMock.itemOS.updateMany.mockResolvedValue({ count: 2 });
    prismaMock.ordemServico.findMany.mockResolvedValue([{ id: 'os-1' }]);

    const resultado = await service.processarEntradaLiquidadaCobranca(
      'loja-1',
      'cob-1',
    );

    expect(resultado.itens_desbloqueados).toBe(2);
    expect(prismaMock.itemOS.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status_liberacao_pcp: StatusLiberacaoPcp.PENDENTE },
      }),
    );
  });
});
