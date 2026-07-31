import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { OrcamentosV2Service } from './orcamentos-v2.service';
import {
  CODIGO_APROVACAO_ERRO_PUBLICO,
  CODIGO_APROVACAO_MAX_TENTATIVAS,
  calcularHashCodigoAprovacao,
  emitirCodigoAprovacao,
} from '../../common/security/codigo-aprovacao';
import { ACAO_PUBLICA_ERRO_GENERICO } from '../dto/acao-cliente-publico.dto';

/**
 * Gate 0S / HS-04 e HS-05 - aceite público do orçamento.
 *
 * O foco aqui é o contrato de segurança do código de aprovação e a
 * idempotência do aceite. O banco é simulado por um registro em memória que
 * respeita as condições dos `updateMany` usados no fluxo — é exatamente essa
 * condicionalidade que serializa requisições concorrentes em produção.
 */
describe('OrcamentosV2Service - aceite público', () => {
  const ORCAMENTO_ID = 'orc-1';
  const LOJA_ID = 'loja-1';

  interface RegistroOrcamento {
    id: string;
    loja_id: string;
    numero: string;
    status: string;
    status_aprovacao: string | null;
    observacoes_cliente: string | null;
    titulo: string;
    descricao: string | null;
    quantidade_produto: number | null;
    unidade_medida_produto: string | null;
    preco_final: number;
    data_criacao: Date;
    prazo_entrega: string | null;
    forma_pagamento: string | null;
    validade_proposta: string | null;
    atendente: string | null;
    observacoes_internas: string | null;
    codigo_aprovacao: string | null;
    codigo_aprovacao_hash: string | null;
    codigo_aprovacao_expira_em: Date | null;
    codigo_aprovacao_tentativas: number;
    codigo_aprovacao_usado_em: Date | null;
    codigo_aprovacao_revogado_em: Date | null;
  }

  let registro: RegistroOrcamento;
  let service: OrcamentosV2Service;
  let osService: { criarOSDeOrcamento: jest.Mock };
  let prisma: any;

  /** Aplica os filtros do `where` sobre o registro único simulado. */
  const casaComFiltro = (where: any): boolean => {
    if (where.id && where.id !== registro.id) return false;
    if (where.loja_id && where.loja_id !== registro.loja_id) return false;

    if (where.status?.in && !where.status.in.includes(registro.status)) {
      return false;
    }

    if (
      where.codigo_aprovacao_hash !== undefined &&
      typeof where.codigo_aprovacao_hash === 'string' &&
      where.codigo_aprovacao_hash !== registro.codigo_aprovacao_hash
    ) {
      return false;
    }

    if (
      where.codigo_aprovacao_hash?.not === null &&
      registro.codigo_aprovacao_hash === null
    ) {
      return false;
    }

    if (
      where.codigo_aprovacao_usado_em === null &&
      registro.codigo_aprovacao_usado_em !== null
    ) {
      return false;
    }

    if (
      where.codigo_aprovacao_revogado_em === null &&
      registro.codigo_aprovacao_revogado_em !== null
    ) {
      return false;
    }

    if (where.codigo_aprovacao_expira_em?.gt) {
      const expira = registro.codigo_aprovacao_expira_em;
      if (!expira || expira <= where.codigo_aprovacao_expira_em.gt) {
        return false;
      }
    }

    if (
      where.codigo_aprovacao_tentativas?.lt !== undefined &&
      registro.codigo_aprovacao_tentativas >=
        where.codigo_aprovacao_tentativas.lt
    ) {
      return false;
    }

    return true;
  };

  const aplicarDados = (data: any): void => {
    for (const [campo, valor] of Object.entries(data)) {
      if (
        valor &&
        typeof valor === 'object' &&
        'increment' in (valor as Record<string, unknown>)
      ) {
        (registro as any)[campo] =
          ((registro as any)[campo] ?? 0) + (valor as any).increment;
        continue;
      }
      (registro as any)[campo] = valor;
    }
  };

  const criarPrismaSimulado = () => ({
    orcamento: {
      findUnique: jest.fn(async ({ where }: any) =>
        casaComFiltro(where) ? { ...registro, cliente: null, loja: null } : null,
      ),
      findFirst: jest.fn(async ({ where }: any) =>
        casaComFiltro(where) ? { ...registro } : null,
      ),
      updateMany: jest.fn(async ({ where, data }: any) => {
        if (!casaComFiltro(where)) return { count: 0 };
        aplicarDados(data);
        return { count: 1 };
      }),
      update: jest.fn(async ({ data }: any) => {
        aplicarDados(data);
        return { ...registro };
      }),
    },
    ordemServico: { findFirst: jest.fn(async () => null) },
    usuario: { findMany: jest.fn(async () => []) },
    $transaction: jest.fn(async (callback: any) => callback(prisma)),
  });

  const montarService = (): OrcamentosV2Service => {
    prisma = criarPrismaSimulado();
    osService = { criarOSDeOrcamento: jest.fn(async () => undefined) };

    const naoUsado = {} as any;

    return new OrcamentosV2Service(
      prisma,
      naoUsado, // integracaoMotor
      naoUsado, // validacaoService
      naoUsado, // transformacaoService
      naoUsado, // notificacaoService
      { criarNotificacao: jest.fn() } as any,
      naoUsado, // validacaoEstoque
      naoUsado, // chatService
      osService as any,
      naoUsado, // osInativacaoService
      naoUsado, // documentCodeService
      naoUsado, // mailService
      { criarCobrancaParaOrcamento: jest.fn() } as any,
      { parsePrazoEntrega: jest.fn(() => 10) } as any,
      naoUsado, // parcelasBuilder
      { invalidar: jest.fn() } as any,
      naoUsado, // vendasPermissions
    );
  };

  /** Emite um código válido diretamente no registro simulado. */
  const emitirCodigoValido = (): string => {
    const emitido = emitirCodigoAprovacao();
    registro.codigo_aprovacao_hash = emitido.hash;
    registro.codigo_aprovacao_expira_em = emitido.expiraEm;
    registro.codigo_aprovacao_tentativas = 0;
    registro.codigo_aprovacao_usado_em = null;
    registro.codigo_aprovacao_revogado_em = null;
    registro.codigo_aprovacao = null;
    return emitido.codigo;
  };

  beforeEach(() => {
    registro = {
      id: ORCAMENTO_ID,
      loja_id: LOJA_ID,
      numero: '2026-001',
      status: 'enviado',
      status_aprovacao: 'PENDENTE',
      observacoes_cliente: null,
      titulo: 'Fachada em ACM',
      descricao: null,
      quantidade_produto: 1,
      unidade_medida_produto: 'un',
      preco_final: 1500,
      data_criacao: new Date('2026-07-01T10:00:00.000Z'),
      prazo_entrega: '10 dias',
      forma_pagamento: null,
      validade_proposta: '30 dias',
      atendente: 'Equipe Comercial',
      observacoes_internas: null,
      codigo_aprovacao: null,
      codigo_aprovacao_hash: null,
      codigo_aprovacao_expira_em: null,
      codigo_aprovacao_tentativas: 0,
      codigo_aprovacao_usado_em: null,
      codigo_aprovacao_revogado_em: null,
    };

    service = montarService();
    jest
      .spyOn(service as any, 'notificarAcaoCliente')
      .mockResolvedValue(undefined);

    // A montagem da OS a partir do orçamento tem dependências próprias que não
    // são o alvo aqui. O que interessa é *quantas vezes* o aceite chega a
    // disparar a criação da OS — por isso o encaminhamento direto ao mock.
    jest
      .spyOn(service as any, 'criarOSAutomaticaParaOrcamento')
      .mockImplementation(async () => {
        await osService.criarOSDeOrcamento();
      });
  });

  it('aprova com código válido e marca o código como usado', async () => {
    const codigo = emitirCodigoValido();

    const resposta = await service.processarAcaoClientePublico(ORCAMENTO_ID, {
      acao: 'APROVAR',
      codigo_aprovacao: codigo,
    });

    expect(resposta.status).toBe('aprovado');
    expect(resposta.status_aprovacao).toBe('APROVADO');
    expect(registro.codigo_aprovacao_usado_em).toBeInstanceOf(Date);
    expect(osService.criarOSDeOrcamento).toHaveBeenCalledTimes(1);
  });

  it('não devolve nenhum campo de código de aprovação na resposta pública', async () => {
    const codigo = emitirCodigoValido();

    const resposta = await service.processarAcaoClientePublico(ORCAMENTO_ID, {
      acao: 'APROVAR',
      codigo_aprovacao: codigo,
    });

    const serializado = JSON.stringify(resposta);
    expect(serializado).not.toContain(codigo);
    expect(serializado).not.toContain(registro.codigo_aprovacao_hash);
    expect(Object.keys(resposta)).not.toContain('codigo_aprovacao');
  });

  it('trata clique duplo como idempotente, sem gerar segunda OS', async () => {
    const codigo = emitirCodigoValido();

    const primeira = await service.processarAcaoClientePublico(ORCAMENTO_ID, {
      acao: 'APROVAR',
      codigo_aprovacao: codigo,
    });
    const segunda = await service.processarAcaoClientePublico(ORCAMENTO_ID, {
      acao: 'APROVAR',
      codigo_aprovacao: codigo,
    });

    expect(segunda.status).toBe(primeira.status);
    expect(segunda.status_aprovacao).toBe(primeira.status_aprovacao);
    expect(osService.criarOSDeOrcamento).toHaveBeenCalledTimes(1);
  });

  it('recusa código inválido com mensagem genérica e conta a tentativa', async () => {
    emitirCodigoValido();

    await expect(
      service.processarAcaoClientePublico(ORCAMENTO_ID, {
        acao: 'APROVAR',
        codigo_aprovacao: emitirCodigoAprovacao().codigo,
      }),
    ).rejects.toThrow(new BadRequestException(CODIGO_APROVACAO_ERRO_PUBLICO));

    expect(registro.codigo_aprovacao_tentativas).toBe(1);
    expect(registro.status).toBe('enviado');
  });

  it('recusa código expirado', async () => {
    const codigo = emitirCodigoValido();
    registro.codigo_aprovacao_expira_em = new Date(Date.now() - 1000);

    await expect(
      service.processarAcaoClientePublico(ORCAMENTO_ID, {
        acao: 'APROVAR',
        codigo_aprovacao: codigo,
      }),
    ).rejects.toThrow(new BadRequestException(CODIGO_APROVACAO_ERRO_PUBLICO));

    expect(registro.status).toBe('enviado');
  });

  it('recusa código revogado', async () => {
    const codigo = emitirCodigoValido();
    registro.codigo_aprovacao_revogado_em = new Date();

    await expect(
      service.processarAcaoClientePublico(ORCAMENTO_ID, {
        acao: 'APROVAR',
        codigo_aprovacao: codigo,
      }),
    ).rejects.toThrow(new BadRequestException(CODIGO_APROVACAO_ERRO_PUBLICO));

    expect(registro.status).toBe('enviado');
  });

  it('trava o alvo ao atingir o limite de tentativas, mesmo com o código correto', async () => {
    const codigo = emitirCodigoValido();
    registro.codigo_aprovacao_tentativas = CODIGO_APROVACAO_MAX_TENTATIVAS;

    await expect(
      service.processarAcaoClientePublico(ORCAMENTO_ID, {
        acao: 'APROVAR',
        codigo_aprovacao: codigo,
      }),
    ).rejects.toThrow(new BadRequestException(CODIGO_APROVACAO_ERRO_PUBLICO));

    // O contador não passa do teto: força bruta não faz o número crescer sem limite.
    expect(registro.codigo_aprovacao_tentativas).toBe(
      CODIGO_APROVACAO_MAX_TENTATIVAS,
    );
    expect(registro.status).toBe('enviado');
  });

  it('não distingue orçamento inexistente de código errado', async () => {
    // Se as duas recusas tivessem textos diferentes, o endereço público viraria
    // um verificador de IDs de orçamento para quem não tem código nenhum.
    emitirCodigoValido();

    const recusaPorCodigo = await service
      .processarAcaoClientePublico(ORCAMENTO_ID, {
        acao: 'APROVAR',
        codigo_aprovacao: emitirCodigoAprovacao().codigo,
      })
      .catch((erro) => erro);

    const recusaPorInexistencia = await service
      .processarAcaoClientePublico('orcamento-inexistente', {
        acao: 'APROVAR',
        codigo_aprovacao: emitirCodigoAprovacao().codigo,
      })
      .catch((erro) => erro);

    expect(recusaPorInexistencia).toBeInstanceOf(BadRequestException);
    expect(recusaPorInexistencia.getStatus()).toBe(
      recusaPorCodigo.getStatus(),
    );
    expect(recusaPorInexistencia.getResponse()).toEqual(
      recusaPorCodigo.getResponse(),
    );
    expect(recusaPorInexistencia.message).toBe(CODIGO_APROVACAO_ERRO_PUBLICO);
  });

  it('usa a mesma recusa para código inválido, expirado e revogado', async () => {
    const cenarios: Array<[string, () => string]> = [
      ['inválido', () => (emitirCodigoValido(), emitirCodigoAprovacao().codigo)],
      [
        'expirado',
        () => {
          const codigo = emitirCodigoValido();
          registro.codigo_aprovacao_expira_em = new Date(Date.now() - 1000);
          return codigo;
        },
      ],
      [
        'revogado',
        () => {
          const codigo = emitirCodigoValido();
          registro.codigo_aprovacao_revogado_em = new Date();
          return codigo;
        },
      ],
      [
        'acima do limite de tentativas',
        () => {
          const codigo = emitirCodigoValido();
          registro.codigo_aprovacao_tentativas =
            CODIGO_APROVACAO_MAX_TENTATIVAS;
          return codigo;
        },
      ],
    ];

    for (const [descricao, preparar] of cenarios) {
      const codigo = preparar();

      const erro = await service
        .processarAcaoClientePublico(ORCAMENTO_ID, {
          acao: 'APROVAR',
          codigo_aprovacao: codigo,
        })
        .catch((e) => e);

      expect([descricao, erro.message]).toEqual([
        descricao,
        CODIGO_APROVACAO_ERRO_PUBLICO,
      ]);
    }
  });

  it('recusa aprovação sem código', async () => {
    emitirCodigoValido();

    await expect(
      service.processarAcaoClientePublico(ORCAMENTO_ID, { acao: 'APROVAR' }),
    ).rejects.toThrow(new BadRequestException(CODIGO_APROVACAO_ERRO_PUBLICO));

    expect(registro.status).toBe('enviado');
  });

  it('devolve o código ao estado utilizável quando a geração da OS falha', async () => {
    const codigo = emitirCodigoValido();
    osService.criarOSDeOrcamento.mockRejectedValueOnce(
      new Error('OS indisponível'),
    );

    await expect(
      service.processarAcaoClientePublico(ORCAMENTO_ID, {
        acao: 'APROVAR',
        codigo_aprovacao: codigo,
      }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);

    expect(registro.status).toBe('enviado');
    expect(registro.codigo_aprovacao_usado_em).toBeNull();
    // O hash continua o mesmo, então o cliente pode tentar de novo com o
    // mesmo código que recebeu por e-mail.
    expect(registro.codigo_aprovacao_hash).toBe(
      calcularHashCodigoAprovacao(codigo),
    );
  });

  it('não exige código para rejeitar, mas exige motivo', async () => {
    await expect(
      service.processarAcaoClientePublico(ORCAMENTO_ID, { acao: 'REJEITAR' }),
    ).rejects.toBeInstanceOf(BadRequestException);

    const resposta = await service.processarAcaoClientePublico(ORCAMENTO_ID, {
      acao: 'REJEITAR',
      observacoes: 'Valor acima do previsto',
    });

    expect(resposta.status).toBe('rejeitado');
    expect(resposta.observacoes_cliente).toBe('Valor acima do previsto');
  });

  describe('revogação', () => {
    // A edição de uma proposta já enviada chama este caminho antes de decidir
    // se consegue entregar um código novo. É o que impede um código válido de
    // continuar apontando para uma versão da proposta que não existe mais.
    const revogar = async () =>
      (service as any).revogarCodigoAprovacaoDoOrcamento(
        ORCAMENTO_ID,
        LOJA_ID,
        'proposta editada após o envio',
      );

    it('invalida o código ativo', async () => {
      const codigo = emitirCodigoValido();

      await revogar();

      expect(registro.codigo_aprovacao_revogado_em).toBeInstanceOf(Date);
      await expect(
        service.processarAcaoClientePublico(ORCAMENTO_ID, {
          acao: 'APROVAR',
          codigo_aprovacao: codigo,
        }),
      ).rejects.toThrow(new BadRequestException(CODIGO_APROVACAO_ERRO_PUBLICO));
    });

    it('é inofensiva quando não há código ativo', async () => {
      await revogar();

      expect(registro.codigo_aprovacao_revogado_em).toBeNull();
      expect(registro.codigo_aprovacao_hash).toBeNull();
    });
  });

  it('recusa ação quando a proposta já saiu do estado que aceita ação pública', async () => {
    registro.status = 'cancelado';

    await expect(
      service.processarAcaoClientePublico(ORCAMENTO_ID, { acao: 'NEGOCIAR' }),
    ).rejects.toThrow(new BadRequestException(ACAO_PUBLICA_ERRO_GENERICO));
  });
});
