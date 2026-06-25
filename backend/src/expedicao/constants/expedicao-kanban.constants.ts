import { StatusExpedicao } from '../enums/status-expedicao.enum';

/** Colunas do kanban ativo (`GET /expedicao`). */
export const COLUNAS_KANBAN_EXPEDICAO_ATIVO: StatusExpedicao[] = [
  StatusExpedicao.AGUARDANDO_SEPARACAO,
  StatusExpedicao.PRONTO_PARA_RETIRADA,
  StatusExpedicao.EM_ROTA_DE_ENTREGA,
  StatusExpedicao.AGUARDANDO_INSTALACAO,
  StatusExpedicao.ENTREGUE_FINALIZADO,
];

/** Status exibidos no arquivo morto (`GET /expedicao/arquivo`). */
export const STATUS_EXPEDICAO_ARQUIVO: StatusExpedicao[] = [
  StatusExpedicao.ARQUIVADO,
  StatusExpedicao.DEVOLVIDA,
];
