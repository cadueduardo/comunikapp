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
  processarEntradaLiquidadaCobranca: jest.fn().mockResolvedValue({
    itens_desbloqueados: 0,
    os_promovidas: 0,
    orcamento_id: null,
  }),
  promoverOsAguardandoFinanceiroPorOrcamento: jest.fn().mockResolvedValue(0),
  promoverOsParaAprovacaoTecnica: jest.fn().mockResolvedValue(undefined),
  desbloquearItensPorOrcamento: jest.fn().mockResolvedValue(0),
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
