import {
  deveExibirCardConcluidoPronto24h,
  obterInstanteConclusaoPronto,
} from './pronto-24h-kanban.util';
import { obterLimiarHorasAtrasUtc } from '../../common/utils/utc-time.util';

describe('pronto-24h-kanban.util', () => {
  const agora = new Date('2026-06-25T15:00:00.000Z');
  let limiar: Date;

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(agora);
    limiar = obterLimiarHorasAtrasUtc(24);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('usa workflow_instancia.data_fim quando disponível', () => {
    const dataFim = new Date('2026-06-25T12:00:00.000Z');
    const os = {
      id: 'os-1',
      status: 'FINALIZADA',
      atualizado_em: new Date('2026-06-20T10:00:00.000Z'),
      workflow_instancia: {
        status: 'CONCLUIDO',
        data_fim: dataFim,
        instancias_setor: [],
      },
    };

    expect(obterInstanteConclusaoPronto(os)).toEqual(dataFim);
    expect(deveExibirCardConcluidoPronto24h(os, limiar)).toBe(true);
  });

  it('usa atualizado_em para OS finalizada manualmente sem workflow', () => {
    const atualizado = new Date('2026-06-25T14:00:00.000Z');
    const os = {
      id: 'os-2',
      status: 'FINALIZADA',
      atualizado_em: atualizado,
      workflow_instancia: null,
    };

    expect(obterInstanteConclusaoPronto(os)).toEqual(atualizado);
    expect(deveExibirCardConcluidoPronto24h(os, limiar)).toBe(true);
  });

  it('oculta card concluído fora da janela de 24h UTC', () => {
    const os = {
      id: 'os-3',
      status: 'FINALIZADA',
      atualizado_em: new Date('2026-06-23T10:00:00.000Z'),
      workflow_instancia: {
        status: 'CONCLUIDO',
        data_fim: new Date('2026-06-23T10:00:00.000Z'),
        instancias_setor: [],
      },
    };

    expect(deveExibirCardConcluidoPronto24h(os, limiar)).toBe(false);
  });

  it('usa maior data_conclusao dos setores quando data_fim ausente', () => {
    const os = {
      id: 'os-4',
      status: 'EM_WORKFLOW',
      atualizado_em: new Date('2026-06-20T10:00:00.000Z'),
      workflow_instancia: {
        status: 'ATIVO',
        data_fim: null,
        instancias_setor: [
          { data_conclusao: new Date('2026-06-25T11:00:00.000Z') },
          { data_conclusao: new Date('2026-06-25T13:30:00.000Z') },
        ],
      },
    };

    expect(obterInstanteConclusaoPronto(os)?.toISOString()).toBe(
      '2026-06-25T13:30:00.000Z',
    );
  });
});
