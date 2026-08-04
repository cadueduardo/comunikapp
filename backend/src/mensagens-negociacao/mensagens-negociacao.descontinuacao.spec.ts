import { GoneException } from '@nestjs/common';
import { MensagensNegociacaoController } from './mensagens-negociacao.controller';

/**
 * Compatibilidade do chat legado: escritas órfãs → 410; sem terceiro chat.
 */
describe('MensagensNegociacaoController — descontinuação Fase 1', () => {
  const controller = new MensagensNegociacaoController({} as any);

  it('rejeita POST de criação autenticada com 410 Gone', async () => {
    await expect(
      controller.create('orc-1', { mensagem: 'oi' } as any, 'loja-1'),
    ).rejects.toBeInstanceOf(GoneException);
  });

  it('rejeita POST público de criação com 410 Gone', async () => {
    await expect(
      controller.createPublico('orc-1', { mensagem: 'oi' } as any),
    ).rejects.toBeInstanceOf(GoneException);
  });

  it('rejeita upload de anexo com 410 Gone', async () => {
    await expect(
      controller.uploadAnexo('orc-1', 'msg-1', {} as any, 'loja-1'),
    ).rejects.toBeInstanceOf(GoneException);
  });

  it('mensagem pública aponta para MensagemChat / orcamentos-v2', async () => {
    await expect(
      controller.create('orc-1', { mensagem: 'x' } as any, 'loja-1'),
    ).rejects.toMatchObject({
      message: expect.stringContaining('MensagemChat'),
      status: 410,
    });
    try {
      await controller.create('orc-1', { mensagem: 'x' } as any, 'loja-1');
    } catch (erro) {
      expect(String((erro as GoneException).message)).toContain(
        'orcamentos-v2',
      );
    }
  });
});
