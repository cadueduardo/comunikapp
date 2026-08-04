import { BadRequestException, InternalServerErrorException, ServiceUnavailableException } from '@nestjs/common';
import { OrcamentosV2Service } from './orcamentos-v2.service';
import {
  ACEITE_PUBLICO_DESABILITADO_MSG,
  CODIGO_APROVACAO_ERRO_PUBLICO,
  CODIGO_APROVACAO_MAX_TENTATIVAS,
  calcularHashCodigoAprovacao,
  emitirCodigoAprovacao,
} from '../../common/security/codigo-aprovacao';
import { ACAO_PUBLICA_ERRO_GENERICO } from '../dto/acao-cliente-publico.dto';
import {
  capturarEventosDeSeguranca,
  procurarDadoSensivel,
  type CapturaDeEventos,
} from '../../common/security/testing/capturar-eventos-seguranca';

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
    status_comercial?: string | null;
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
  let auditoria: any[];
  let ordensServico: Array<{ id: string; numero: string; ativo: boolean }>;
  let service: OrcamentosV2Service;
  let osService: { criarOSDeOrcamento: jest.Mock };
  let mailService: { enviarOrcamentoCliente: jest.Mock };
  let prisma: any;

  /** Aplica os filtros do `where` sobre o registro único simulado. */
  const casaComFiltro = (where: any): boolean => {
    if (where.id && where.id !== registro.id) return false;
    if (where.loja_id && where.loja_id !== registro.loja_id) return false;

    if (where.status?.in && !where.status.in.includes(registro.status)) {
      return false;
    }

    if (where.status?.notIn?.includes(registro.status)) {
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
    ordemServico: {
      findFirst: jest.fn(async () =>
        ordensServico.length > 0
          ? ordensServico[ordensServico.length - 1]
          : null,
      ),
      count: jest.fn(async () => ordensServico.length),
    },
    usuario: { findMany: jest.fn(async () => []) },
    // Gate 0S / HS-05: a auditoria vai para a mesma transação da mutação, então
    // o simulador precisa registrar as linhas gravadas para que os testes
    // possam inspecioná-las.
    orcamentoLog: {
      create: jest.fn(async ({ data }: any) => {
        auditoria.push(data);
        return { id: 'log-' + auditoria.length, ...data };
      }),
    },
    historicoOrcamento: {
      create: jest.fn(async ({ data }: any) => ({
        id: 'hist-1',
        ...data,
      })),
    },
    $transaction: jest.fn(async (callback: any) => callback(prisma)),
  });

  const montarService = (): OrcamentosV2Service => {
    auditoria = [];
    ordensServico = [];
    prisma = criarPrismaSimulado();
    osService = { criarOSDeOrcamento: jest.fn(async () => undefined) };
    mailService = { enviarOrcamentoCliente: jest.fn(async () => undefined) };

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
      mailService as any,
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
      status_comercial: 'enviada',
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
    //
    // A OS criada passa a existir no simulador: sem isso, uma segunda chamada
    // enxergaria o orçamento como "aprovado e sem OS" e cairia no caminho de
    // recuperação, que não é o cenário sob teste.
    jest
      .spyOn(service as any, 'criarOSAutomaticaParaOrcamento')
      .mockImplementation(async () => {
        await osService.criarOSDeOrcamento();
        ordensServico.push({
          id: 'os-' + (ordensServico.length + 1),
          numero: '2026-OS-' + (ordensServico.length + 1),
          ativo: true,
        });
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

  describe('auditoria (HS-05)', () => {
    it('grava a trilha do aceite na mesma transação da mutação', async () => {
      const codigo = emitirCodigoValido();

      await service.processarAcaoClientePublico(
        ORCAMENTO_ID,
        { acao: 'APROVAR', codigo_aprovacao: codigo },
        { ip: '203.0.113.7', userAgent: 'Mozilla/5.0' },
      );

      // A gravação só pode ter acontecido pelo cliente entregue ao callback do
      // `$transaction`; o simulador não expõe outro caminho.
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.orcamentoLog.create).toHaveBeenCalled();

      const trilha = auditoria.find((l) => l.tipo_acao === 'ACEITE_PUBLICO');
      expect(trilha).toBeDefined();
      expect(trilha.ip_origem).toBe('203.0.113.7');
      expect(trilha.user_agent).toBe('Mozilla/5.0');
      expect(JSON.parse(trilha.dados_extras)).toEqual({
        origem: 'PUBLICO',
        autor: 'CLIENTE_PUBLICO',
        status_anterior: 'enviado',
        status_novo: 'aprovado',
      });
    });

    it('não deixa código nem hash entrarem na trilha', async () => {
      const codigo = emitirCodigoValido();
      const hash = calcularHashCodigoAprovacao(codigo);

      await service.processarAcaoClientePublico(ORCAMENTO_ID, {
        acao: 'APROVAR',
        codigo_aprovacao: codigo,
      });

      const serializado = JSON.stringify(auditoria);
      expect(serializado).not.toContain(codigo);
      expect(serializado).not.toContain(hash);
    });

    it('trunca texto livre do cliente em vez de gravar payload arbitrário', async () => {
      const motivoEnorme = 'x'.repeat(5000);

      await service.processarAcaoClientePublico(ORCAMENTO_ID, {
        acao: 'REJEITAR',
        observacoes: motivoEnorme,
      });

      const trilha = auditoria.find(
        (l) => l.tipo_acao === 'ACAO_PUBLICA_REJEITAR',
      );
      expect(trilha.descricao.length).toBeLessThanOrEqual(500);
    });

    it('registra a reversão quando a geração da OS falha', async () => {
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

      // A trilha do aceite não é apagada: fica o par aceite + reversão, para
      // que a tentativa não desapareça do histórico.
      expect(
        auditoria.map((l) => l.tipo_acao),
      ).toEqual(['ACEITE_PUBLICO', 'ACEITE_REVERTIDO']);
    });
  });

  describe('aprovação interna (HS-05)', () => {
    const aprovarInternamente = () =>
      service.fecharPedidoInterno(ORCAMENTO_ID, LOJA_ID, 'usuario-1', undefined, {
        ip: '198.51.100.4',
        userAgent: 'ComunikApp/1.0',
      });

    beforeEach(() => {
      (service as any).vendasPermissions = { assertPode: jest.fn() };
    });

    it('passa pelo mesmo caso de uso e grava a trilha na transação', async () => {
      const resposta = await aprovarInternamente();

      expect(resposta.status).toBe('aprovado');
      expect(registro.status).toBe('aprovado');
      expect(osService.criarOSDeOrcamento).toHaveBeenCalledTimes(1);

      const trilha = auditoria.find(
        (l) => l.tipo_acao === 'APROVADO_INTERNAMENTE_E_OS_GERADA',
      );
      expect(trilha).toBeDefined();
      expect(trilha.ip_origem).toBe('198.51.100.4');
      expect(JSON.parse(trilha.dados_extras).origem).toBe('INTERNO');
    });

    it('não gera segunda OS quando a aprovação interna é repetida', async () => {
      // A segunda chamada encontra o status já em `aprovado`, que está fora do
      // `WHERE` da transição. Sem essa condição, as duas requisições casariam e
      // a única defesa seria uma consulta prévia não atômica.
      await aprovarInternamente();
      const repetida = await aprovarInternamente();

      expect(repetida.status).toBe('aprovado');
      expect(osService.criarOSDeOrcamento).toHaveBeenCalledTimes(1);
    });
  });

  describe('alteração de status (HS-05)', () => {
    beforeEach(() => {
      (service as any).vendasPermissions = { assertPode: jest.fn() };
      (service as any).notificacaoService = {
        notificarMudancaStatus: jest.fn(),
      };
    });

    it('grava a trilha e revoga o código na mesma transação do cancelamento', async () => {
      // Antes deste gate, cancelar ou rejeitar chamava `registrarLog`, que só
      // escrevia no logger. A mutação mais destrutiva do fluxo não deixava
      // trilha nenhuma no banco.
      const codigo = emitirCodigoValido();
      registro.status = 'enviado';

      await service.alterarStatus(
        ORCAMENTO_ID,
        'cancelado',
        LOJA_ID,
        'usuario-1',
        'cliente desistiu',
        { ip: '198.51.100.9', userAgent: 'ComunikApp/1.0' },
      );

      expect(registro.codigo_aprovacao_revogado_em).toBeInstanceOf(Date);

      const trilha = auditoria.find((l) => l.tipo_acao === 'STATUS_ALTERADO');
      expect(trilha).toBeDefined();
      expect(trilha.ip_origem).toBe('198.51.100.9');
      expect(JSON.parse(trilha.dados_extras)).toMatchObject({
        origem: 'INTERNO',
        autor: 'usuario-1',
        status_anterior: 'enviado',
        status_novo: 'cancelado',
      });
      expect(JSON.stringify(auditoria)).not.toContain(codigo);
    });
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

  /**
   * Contingência fail-closed do HS-04 — mesmo artefato, schema expandido,
   * fluxos públicos desligados. Sem e-mail, sem mutação, sem OS.
   */
  describe('ORCAMENTOS_ACEITE_PUBLICO_DESABILITADO', () => {
    const chave = 'ORCAMENTOS_ACEITE_PUBLICO_DESABILITADO';
    const anterior = process.env[chave];
    let statusAntes: string;
    let hashAntes: string | null;

    beforeEach(() => {
      process.env[chave] = 'true';
      statusAntes = registro.status;
      hashAntes = registro.codigo_aprovacao_hash;
      mailService.enviarOrcamentoCliente.mockClear();
      osService.criarOSDeOrcamento.mockClear();
      prisma.orcamento.updateMany.mockClear();
    });

    afterEach(() => {
      if (anterior === undefined) {
        delete process.env[chave];
      } else {
        process.env[chave] = anterior;
      }
    });

    it('recusa o aceite público com 503 estável e sem efeitos', async () => {
      const codigo = emitirCodigoValido();

      await expect(
        service.processarAcaoClientePublico(ORCAMENTO_ID, {
          acao: 'APROVAR',
          codigo_aprovacao: codigo,
        }),
      ).rejects.toEqual(
        new ServiceUnavailableException(ACEITE_PUBLICO_DESABILITADO_MSG),
      );

      expect(registro.status).toBe(statusAntes);
      expect(osService.criarOSDeOrcamento).not.toHaveBeenCalled();
      expect(mailService.enviarOrcamentoCliente).not.toHaveBeenCalled();
      expect(prisma.orcamento.updateMany).not.toHaveBeenCalled();
    });

    it('recusa o reenvio com 503 e não envia e-mail nem altera o orçamento', async () => {
      emitirCodigoValido();
      hashAntes = registro.codigo_aprovacao_hash;

      await expect(service.reenviarCodigoAprovacao(ORCAMENTO_ID)).rejects.toEqual(
        new ServiceUnavailableException(ACEITE_PUBLICO_DESABILITADO_MSG),
      );

      expect(mailService.enviarOrcamentoCliente).not.toHaveBeenCalled();
      expect(registro.codigo_aprovacao_hash).toBe(hashAntes);
      expect(prisma.orcamento.updateMany).not.toHaveBeenCalled();
    });

    it('bloqueia a emissão direta do código (caminho autenticado de envio)', async () => {
      await expect(
        (service as any).emitirCodigoAprovacaoDoOrcamento(ORCAMENTO_ID, LOJA_ID),
      ).rejects.toEqual(
        new ServiceUnavailableException(ACEITE_PUBLICO_DESABILITADO_MSG),
      );

      expect(prisma.orcamento.updateMany).not.toHaveBeenCalled();
      expect(mailService.enviarOrcamentoCliente).not.toHaveBeenCalled();
    });
  });

  /**
   * Gate 0S / HS-06 — os três tipos de evento que nascem no fluxo de aceite.
   *
   * Os outros dois (`RATE_LIMIT` e `AUTORIZACAO_NEGADA`) são comprovados em
   * `common/security/eventos-seguranca.spec.ts`, junto do contrato do formato.
   * Aqui interessa que o evento saia do caminho real de recusa, e não que o
   * formatador saiba formatar.
   */
  describe('eventos de segurança (HS-06)', () => {
    let captura: CapturaDeEventos;

    beforeEach(() => {
      captura = capturarEventosDeSeguranca();
    });

    afterEach(() => {
      captura.restaurar();
    });

    it('emite TOKEN_RECUSADO sem revelar o código tentado', async () => {
      emitirCodigoValido();
      const codigoErrado = emitirCodigoAprovacao().codigo;

      await expect(
        service.processarAcaoClientePublico(
          ORCAMENTO_ID,
          { acao: 'APROVAR', codigo_aprovacao: codigoErrado },
          { ip: '203.0.113.7', userAgent: 'Mozilla/5.0' },
        ),
      ).rejects.toThrow(new BadRequestException(CODIGO_APROVACAO_ERRO_PUBLICO));

      const evento = captura.eventos().find((e) => e.tipo === 'TOKEN_RECUSADO');
      expect(evento).toBeDefined();
      expect(evento?.recurso).toBe(ORCAMENTO_ID);
      expect(evento?.motivo).toBe('codigo_nao_aceito');
      // O motivo é indiferenciado de propósito: separar "expirado" de "errado"
      // no log recriaria o oráculo que a resposta pública evita.
      expect(evento?.linha).not.toContain(codigoErrado);
      expect(evento?.linha).not.toContain('203.0.113.7');
      expect(evento?.origem).toMatch(/^[0-9a-f]{12}$/);
    });

    it('emite CONFLITO_IDEMPOTENCIA quando a ação chega fora do estado', async () => {
      // Nada é aplicado: a condição do `UPDATE` não casa. Sem o evento, esse
      // desfecho seria indistinguível de sucesso no log.
      registro.status = 'aprovado';

      await expect(
        service.processarAcaoClientePublico(ORCAMENTO_ID, {
          acao: 'REJEITAR',
          observacoes: 'chegou tarde',
        }),
      ).rejects.toThrow(new BadRequestException(ACAO_PUBLICA_ERRO_GENERICO));

      const evento = captura
        .eventos()
        .find((e) => e.tipo === 'CONFLITO_IDEMPOTENCIA');
      expect(evento).toBeDefined();
      expect(evento?.motivo).toBe('estado_incompativel');
      expect(evento?.recurso).toBe(ORCAMENTO_ID);
    });

    it('emite FALHA_HANDOFF quando a OS não é gerada e o aceite é revertido', async () => {
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

      const evento = captura.eventos().find((e) => e.tipo === 'FALHA_HANDOFF');
      expect(evento).toBeDefined();
      expect(evento?.motivo).toBe('os_nao_gerada');
      expect(evento?.rota).toBe('orcamentos-v2/aceite');
      // Este é o evento que não pode passar despercebido: houve aceite do
      // cliente que não virou trabalho, e a reversão precisa de conferência.
      expect(evento?.recurso).toBe(ORCAMENTO_ID);
    });

    it('nenhum evento do fluxo de aceite carrega dado sensível', async () => {
      emitirCodigoValido();

      await service
        .processarAcaoClientePublico(
          ORCAMENTO_ID,
          {
            acao: 'APROVAR',
            codigo_aprovacao: emitirCodigoAprovacao().codigo,
          },
          { ip: '203.0.113.7', userAgent: 'Mozilla/5.0' },
        )
        .catch(() => undefined);

      expect(procurarDadoSensivel(captura.eventos())).toBeNull();
    });
  });
});
