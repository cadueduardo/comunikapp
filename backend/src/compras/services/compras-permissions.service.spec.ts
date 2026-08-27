/**
 * Teste leve (node:test) — evita carregar ts-jest/Nest e estourar heap.
 * Rodar: node --test --import ts-node/register/transpile-only src/compras/services/compras-permissions.service.spec.ts
 * Ou via Jest se necessário (exige NODE_OPTIONS=--max-old-space-size=8192).
 */
import { ForbiddenException } from '@nestjs/common';
import { ComprasPermissionsService } from './compras-permissions.service';

describe('ComprasPermissionsService.parseAcaoCompleta', () => {
  const service = new ComprasPermissionsService({} as never);

  it('separa modulo compras e acao composta', () => {
    expect(service.parseAcaoCompleta('compras.solicitacao.criar')).toEqual({
      modulo: 'compras',
      acao: 'solicitacao.criar',
    });
  });

  it('rejeita string inválida', () => {
    expect(() => service.parseAcaoCompleta('compras')).toThrow(
      ForbiddenException,
    );
  });

  it('delega ao núcleo e honra deny explícito', async () => {
    const permissaoEfetiva = {
      pode: jest.fn().mockResolvedValue(false),
    };
    const nucleo = new ComprasPermissionsService(permissaoEfetiva as never);
    await expect(
      nucleo.pode('u1', 'loja-1', 'compras.solicitacao.aprovar'),
    ).resolves.toBe(false);
    expect(permissaoEfetiva.pode).toHaveBeenCalledWith(
      'u1',
      'loja-1',
      'compras.solicitacao.aprovar',
    );
  });
});
