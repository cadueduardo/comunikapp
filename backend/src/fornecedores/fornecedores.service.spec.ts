import { TipoFornecedor } from '@prisma/client';
import { FornecedoresService } from './fornecedores.service';

describe('FornecedoresService', () => {
  const findMany = jest.fn();
  const prisma = {
    fornecedor: { findMany },
  };
  const loja = { id: 'loja-1' } as any;
  let service: FornecedoresService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new FornecedoresService(prisma as any);
  });

  it('lista somente parceiros ativos e da loja no seletor de terceirizacao', async () => {
    findMany.mockResolvedValue([]);

    await service.findAll(loja, 'TERCEIRIZACAO');

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          loja_id: 'loja-1',
          ativo: true,
          tipo: {
            in: [TipoFornecedor.TERCEIRIZADO, TipoFornecedor.AMBOS],
          },
        },
      }),
    );
  });

  it('mantem fornecedores inativos visiveis na administracao do modulo', async () => {
    findMany.mockResolvedValue([]);

    await service.findAll(loja);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { loja_id: 'loja-1' },
      }),
    );
  });
});
