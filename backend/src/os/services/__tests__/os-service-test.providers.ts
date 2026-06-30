import { ExpedicaoCriacaoService } from '../../../expedicao/services/expedicao-criacao.service';
import { ArteProducaoService } from '../../../catalogo/producao/arte-producao.service';
import { PcpBloqueioSinalService } from '../../../instalacao/services/pcp-bloqueio-sinal.service';
import { StatusLiberacaoPcp } from '../../../instalacao/constants/pcp-liberacao.constants';

export const mockExpedicaoCriacaoService = {
  criarExpedicaoParaOS: jest.fn().mockResolvedValue(undefined),
};

export const mockArteProducaoService = {
  sincronizarItensOs: jest.fn().mockResolvedValue(undefined),
};

export const mockPcpBloqueioSinalService = {
  resolverStatusInicialItem: jest
    .fn()
    .mockResolvedValue(StatusLiberacaoPcp.PENDENTE),
  entradaJaLiquidada: jest.fn().mockResolvedValue(false),
  desbloquearItensAposSinal: jest.fn().mockResolvedValue({
    itens_desbloqueados: 0,
    orcamento_id: null,
  }),
};

export const osServiceExtraProviders = [
  {
    provide: ExpedicaoCriacaoService,
    useValue: mockExpedicaoCriacaoService,
  },
  {
    provide: ArteProducaoService,
    useValue: mockArteProducaoService,
  },
  {
    provide: PcpBloqueioSinalService,
    useValue: mockPcpBloqueioSinalService,
  },
];
