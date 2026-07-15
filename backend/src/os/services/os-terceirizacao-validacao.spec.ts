import { ModoFulfillmentItem, TipoFornecedor } from '@prisma/client';
import { OSService } from './os.service';

describe('OSService - validação de terceirização', () => {
  const criarServiceMinimo = () => {
    const service = Object.create(OSService.prototype) as any;
    service.montarParametrosItemOS = jest.fn(() => ({}));
    service.extrairMateriaisDoProdutoOrcamento = jest.fn(() => []);
    return service;
  };

  const produtoBase = {
    id: 'item-1',
    nome: 'Estrutura terceirizada',
    tipo_item: 'SOB_DEMANDA',
    quantidade: 1,
    modo_fulfillment: ModoFulfillmentItem.OUTSOURCE,
    fornecedor_terceirizado_id: 'fornecedor-1',
  };

  it('recusa item terceirizado sem o relacionamento do fornecedor', () => {
    const service = criarServiceMinimo();

    expect(() =>
      service.montarItensOSDoOrcamento(
        { produtos: [{ ...produtoBase, fornecedor_terceirizado: null }] },
        'loja-1',
      ),
    ).toThrow('não possui um parceiro válido');
  });

  it('recusa fornecedor terceirizado inativo', () => {
    const service = criarServiceMinimo();

    expect(() =>
      service.montarItensOSDoOrcamento(
        {
          produtos: [
            {
              ...produtoBase,
              fornecedor_terceirizado: {
                id: 'fornecedor-1',
                loja_id: 'loja-1',
                tipo: TipoFornecedor.TERCEIRIZADO,
                ativo: false,
              },
            },
          ],
        },
        'loja-1',
      ),
    ).toThrow('está inativo');
  });
});
