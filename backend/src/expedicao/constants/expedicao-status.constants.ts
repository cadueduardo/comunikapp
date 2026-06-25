import { StatusExpedicao } from '../enums/status-expedicao.enum';

/** Expedição encerrada — bloqueia PATCH de dados e mudança de status. */
export const STATUS_EXPEDICAO_IMUTAVEIS = new Set<string>([
  StatusExpedicao.ENTREGUE_FINALIZADO,
  StatusExpedicao.ARQUIVADO,
  StatusExpedicao.DEVOLVIDA,
]);

/** Status permitidos via `PATCH /expedicao/:id/status` (drag no kanban). */
export const STATUS_EXPEDICAO_KANBAN_PATCH = new Set<string>([
  StatusExpedicao.AGUARDANDO_SEPARACAO,
  StatusExpedicao.PRONTO_PARA_RETIRADA,
  StatusExpedicao.EM_ROTA_DE_ENTREGA,
  StatusExpedicao.AGUARDANDO_INSTALACAO,
]);
