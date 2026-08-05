import { BadRequestException } from '@nestjs/common';
import { OrcamentoStatusComercial } from '../domain/status-comercial';
import { TransicaoComercialService } from './transicao-comercial.service';

describe('TransicaoComercialService', () => {
  const orcamento = {
    id: 'orc-1',
    loja_id: 'loja-1',
    status: 'enviado',
    status_comercial: OrcamentoStatusComercial.ENVIADA,
    status_aprovacao: 'PENDENTE',
  };

  let estado: typeof orcamento;
  let tx: any;
  let prisma: any;
  let service: TransicaoComercialService;

  beforeEach(() => {
    estado = { ...orcamento };
    tx = {
      orcamento: {
        updateMany: jest.fn(async ({ where, data }: any) => {
          if (
            where.id !== estado.id ||
            where.loja_id !== estado.loja_id ||
            where.status_comercial !== estado.status_comercial
          ) {
            return { count: 0 };
          }
          Object.assign(estado, data);
          return { count: 1 };
        }),
      },
      orcamentoLog: { create: jest.fn(async () => ({ id: 'log-1' })) },
      historicoOrcamento: {
        create: jest.fn(async () => ({ id: 'hist-1' })),
      },
      ordemServico: { count: jest.fn(async () => 0) },
    };
    prisma = {
      $transaction: jest.fn(async (callback: any) => callback(tx)),
    };
    service = new TransicaoComercialService(prisma);
  });

  const entrada = () => ({
    orcamentoId: estado.id,
    lojaId: estado.loja_id,
    origemStatus: OrcamentoStatusComercial.ENVIADA,
    destinoStatus: OrcamentoStatusComercial.ACEITA,
    origemAcao: 'INTERNO' as const,
    autor: 'usr-1',
    tipoAuditoria: 'ACEITE_INTERNO',
    descricao: 'Proposta aceita.',
    evento: 'vendas.proposta.aceita' as const,
  });

  it('faz dual-write, auditoria e timeline na mesma transacao', async () => {
    await expect(service.executar(entrada())).resolves.toBe(true);

    expect(estado).toMatchObject({
      status: 'aprovado',
      status_comercial: OrcamentoStatusComercial.ACEITA,
      status_aprovacao: 'APROVADO',
    });
    expect(tx.orcamentoLog.create).toHaveBeenCalledTimes(1);
    expect(tx.historicoOrcamento.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          loja: { connect: { id: 'loja-1' } },
          evento: 'vendas.proposta.aceita',
        }),
      }),
    );
  });

  it('perde o CAS sem gravar auditoria ou timeline', async () => {
    estado.status_comercial = OrcamentoStatusComercial.EM_NEGOCIACAO;

    await expect(service.executar(entrada())).resolves.toBe(false);

    expect(tx.orcamentoLog.create).not.toHaveBeenCalled();
    expect(tx.historicoOrcamento.create).not.toHaveBeenCalled();
  });

  it('nega transicao fora das 23 passagens da DV-14', async () => {
    const invalida = {
      ...entrada(),
      destinoStatus: OrcamentoStatusComercial.PEDIDO_CONFIRMADO,
    };

    await expect(service.executar(invalida)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(tx.orcamento.updateMany).not.toHaveBeenCalled();
  });

  it('permite compensacao tecnica pelo mesmo writer e pelo mesmo CAS', async () => {
    estado.status = 'aprovado';
    estado.status_comercial = OrcamentoStatusComercial.ACEITA;
    estado.status_aprovacao = 'APROVADO';

    await expect(
      service.compensarEmTransacao(tx, {
        ...entrada(),
        origemStatus: OrcamentoStatusComercial.ACEITA,
        destinoStatus: OrcamentoStatusComercial.ENVIADA,
        tipoAuditoria: 'ACEITE_REVERTIDO',
      }),
    ).resolves.toBe(true);

    expect(estado.status_comercial).toBe(OrcamentoStatusComercial.ENVIADA);
    expect(tx.orcamentoLog.create).toHaveBeenCalledTimes(1);
  });

  it('nega reconciliacao sem OS da mesma loja', async () => {
    await expect(
      service.reconciliarPedidoComOs({
        ...entrada(),
        origemStatus: OrcamentoStatusComercial.ENVIADA,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.orcamento.updateMany).not.toHaveBeenCalled();
    expect(tx.ordemServico.count).toHaveBeenCalledWith({
      where: { orcamento_id: 'orc-1', loja_id: 'loja-1' },
    });
  });

  it('reconcilia legado somente quando a OS pertence ao mesmo tenant', async () => {
    tx.ordemServico.count.mockResolvedValue(1);

    await expect(
      service.reconciliarPedidoComOs({
        ...entrada(),
        origemStatus: OrcamentoStatusComercial.ENVIADA,
      }),
    ).resolves.toBe(true);

    expect(estado.status_comercial).toBe(
      OrcamentoStatusComercial.PEDIDO_CONFIRMADO,
    );
  });
});
