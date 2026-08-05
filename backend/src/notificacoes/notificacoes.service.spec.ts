import { BadRequestException, ConflictException } from '@nestjs/common';
import { NotificacoesService, TipoNotificacao } from './notificacoes.service';

describe('NotificacoesService — endereçada Fase 5', () => {
  it('rejeita url_destino absoluta ou fora da allowlist', async () => {
    const svc = new NotificacoesService({} as never);
    await expect(
      svc.criarNotificacaoEndereçada({
        lojaId: 'l1',
        usuarioId: 'u1',
        tipo: TipoNotificacao.SISTEMA,
        titulo: 't',
        mensagem: 'm',
        urlDestino: 'https://evil.example',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      svc.criarNotificacaoEndereçada({
        lojaId: 'l1',
        usuarioId: 'u1',
        tipo: TipoNotificacao.SISTEMA,
        titulo: 't',
        mensagem: 'm',
        urlDestino: '/admin/secret',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('dedup: mesma chave e payload → retorna existente', async () => {
    const existente = {
      id: 'n1',
      titulo: 't',
      mensagem: 'm',
      usuario_id: 'u1',
      chave_dedup: 'ativ:a1:atribuida',
    };
    const prisma = {
      notificacao: {
        findUnique: jest.fn().mockResolvedValue(existente),
        create: jest.fn(),
      },
    };
    const svc = new NotificacoesService(prisma as never);
    const r = await svc.criarNotificacaoEndereçada({
      lojaId: 'l1',
      usuarioId: 'u1',
      tipo: TipoNotificacao.SISTEMA,
      titulo: 't',
      mensagem: 'm',
      urlDestino: '/vendas/atividades?id=a1',
      chaveDedup: 'ativ:a1:atribuida',
    });
    expect(r).toBe(existente);
    expect(prisma.notificacao.create).not.toHaveBeenCalled();
  });

  it('dedup: mesma chave e payload incompatível → conflito', async () => {
    const prisma = {
      notificacao: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'n1',
          titulo: 'outro',
          mensagem: 'm',
          usuario_id: 'u1',
        }),
        create: jest.fn(),
      },
    };
    const svc = new NotificacoesService(prisma as never);
    await expect(
      svc.criarNotificacaoEndereçada({
        lojaId: 'l1',
        usuarioId: 'u1',
        tipo: TipoNotificacao.SISTEMA,
        titulo: 't',
        mensagem: 'm',
        urlDestino: '/vendas/atividades',
        chaveDedup: 'ativ:a1:atribuida',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('assinatura legado criarNotificacao permanece (broadcast loja)', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'n0' });
    const svc = new NotificacoesService({
      notificacao: { create },
    } as never);
    await svc.criarNotificacao(
      'l1',
      TipoNotificacao.SISTEMA,
      't',
      'm',
    );
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        loja_id: 'l1',
        visualizada: false,
      }),
    });
  });
});
