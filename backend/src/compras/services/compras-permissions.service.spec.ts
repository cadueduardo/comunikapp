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
