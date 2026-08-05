/**
 * Fluxo real (unitário integrado): atendimento monta deep-link → transformação
 * do orçamento V2 persiste contato_id → validação exige loja/cliente/contato.
 *
 * Não basta assertar a string da URL: o payload canônico precisa carregar o
 * contato até o create do Prisma.
 */
import { BadRequestException } from '@nestjs/common';
import { AtendimentoService } from '../../vendas/atendimento/atendimento.service';
import { TransformacaoV2Service } from './transformacao-v2.service';
import { ValidacaoV2Service } from './validacao-v2.service';

describe('Fluxo atendimento → orçamento → contato persistido', () => {
  it('deep-link + preparação + validação mantêm o mesmo contato_id', async () => {
    const prismaAtend: Record<string, unknown> = {};
    Object.assign(prismaAtend, {
      atendimento_idempotencia: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
      },
      cliente_contato: {
        findFirst: jest.fn().mockResolvedValue({ id: 'ct-fluxo' }),
      },
      atividade_comercial: {
        create: jest.fn().mockResolvedValue({ id: 'a-fluxo' }),
      },
      $transaction: jest.fn(async (fn: (tx: unknown) => unknown) =>
        fn(prismaAtend),
      ),
    });

    const atendimento = new AtendimentoService(
      prismaAtend as never,
      { assertPode: jest.fn().mockResolvedValue(undefined) } as never,
      { enfileirarAtribuida: jest.fn().mockResolvedValue(null) } as never,
      { assertClienteAcessivel: jest.fn().mockResolvedValue(undefined) } as never,
    );

    const resultado = await atendimento.criar(
      { usuarioId: 'u1', lojaId: 'l1' } as never,
      {
        chave_operacao: 'cccccccc-bbbb-cccc-dddd-eeeeeeeeeeee',
        cliente_id: 'cli-fluxo',
        contato_id: 'ct-fluxo',
        necessidade: 'Fachada ACM',
        origem: 'presencial',
        prazo: new Date('2026-08-20T12:00:00.000Z').toISOString(),
        criar_orcamento: true,
      } as never,
    );

    expect(resultado.deep_link).toContain('clienteId=cli-fluxo');
    expect(resultado.deep_link).toContain('contatoId=ct-fluxo');

    const url = new URL(resultado.deep_link!, 'http://local.test');
    const clienteId = url.searchParams.get('clienteId');
    const contatoId = url.searchParams.get('contatoId');
    expect(clienteId).toBe('cli-fluxo');
    expect(contatoId).toBe('ct-fluxo');

    const transformacao = new TransformacaoV2Service();
    const preparado = transformacao.prepararDadosCriacao(
      {
        titulo: 'Fachada ACM',
        cliente_id: clienteId,
        contato_id: contatoId,
        produtos: [
          {
            nome_servico: 'Fachada',
            quantidade: 1,
            preco_unitario: 100,
            preco_total: 100,
          },
        ],
      },
      'l1',
      'u1',
    );
    expect(preparado.contato_id).toBe('ct-fluxo');
    expect(preparado.cliente_id).toBe('cli-fluxo');

    const prismaVal = {
      cliente: {
        findFirst: jest.fn().mockResolvedValue({ id: 'cli-fluxo', ativo: true }),
      },
      cliente_contato: {
        findFirst: jest.fn().mockResolvedValue({ id: 'ct-fluxo' }),
      },
    };
    const validacao = new ValidacaoV2Service(prismaVal as never);
    jest
      .spyOn(validacao as any, 'validarCamposObrigatorios')
      .mockReturnValue(undefined);
    jest.spyOn(validacao as any, 'validarTiposDados').mockReturnValue(undefined);
    jest.spyOn(validacao as any, 'validarValores').mockReturnValue(undefined);
    jest.spyOn(validacao as any, 'validarProdutos').mockResolvedValue(undefined);
    jest
      .spyOn(validacao as any, 'validarConfiguracoes')
      .mockResolvedValue(undefined);
    jest
      .spyOn(validacao as any, 'validarIntegridadeDados')
      .mockReturnValue(undefined);
    jest
      .spyOn(validacao as any, 'validarRegrasNegocio')
      .mockReturnValue(undefined);

    await expect(
      validacao.validarDadosCriacao(
        {
          cliente_id: preparado.cliente_id,
          contato_id: preparado.contato_id,
          produtos: [{ nome: 'x' }],
          status: 'rascunho',
        },
        'l1',
      ),
    ).resolves.toBeUndefined();

    expect(prismaVal.cliente_contato.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'ct-fluxo',
          loja_id: 'l1',
          cliente_id: 'cli-fluxo',
        }),
      }),
    );

    // Contato de outro cliente no mesmo fluxo deve falhar
    prismaVal.cliente_contato.findFirst.mockResolvedValueOnce(null);
    await expect(
      validacao.validarDadosCriacao(
        {
          cliente_id: 'cli-fluxo',
          contato_id: 'ct-outro-cliente',
          produtos: [{ nome: 'x' }],
          status: 'rascunho',
        },
        'l1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
