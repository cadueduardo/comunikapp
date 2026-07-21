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
});
