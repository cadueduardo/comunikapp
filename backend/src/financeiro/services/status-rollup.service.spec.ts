import { ParcelaStatus } from '../enums/cobranca-status.enum';
import { StatusRollupService } from './status-rollup.service';

describe('StatusRollupService', () => {
  let service: StatusRollupService;
  const ontem = new Date('2026-06-29T12:00:00.000Z');
  const hoje = new Date('2026-06-30T12:00:00.000Z');

  beforeEach(() => {
    service = new StatusRollupService();
  });

  it('não vence parcela aguardando relatório técnico por decurso de prazo', () => {
    const parcelas = service.recategorizarVencidas(
      [
        {
          status: ParcelaStatus.AGUARDANDO_RELATORIO_TECNICO,
          valor_previsto: 5000,
          valor_recebido: 0,
          data_vencimento: ontem,
        },
      ],
      hoje,
    );

    expect(parcelas[0].status).toBe(ParcelaStatus.AGUARDANDO_RELATORIO_TECNICO);
  });

  it('marca parcela A_FATURAR vencida quando prazo expirou', () => {
    const parcelas = service.recategorizarVencidas(
      [
        {
          status: ParcelaStatus.A_FATURAR,
          valor_previsto: 5000,
          valor_recebido: 0,
          data_vencimento: ontem,
        },
      ],
      hoje,
    );

    expect(parcelas[0].status).toBe(ParcelaStatus.VENCIDO);
  });
});
