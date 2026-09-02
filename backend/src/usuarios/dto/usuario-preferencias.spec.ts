import {
  FAVORITOS_MAXIMO,
  favoritosComAcesso,
  sanitizarFavoritos,
} from './usuario-preferencias.dto';

describe('favoritos em preferências', () => {
  it('deduplica, valida o formato e respeita o teto', () => {
    expect(
      sanitizarFavoritos([
        'vendas:clientes',
        'vendas:clientes',
        'invalido',
        'estoque:itens',
        'a:b',
        'c:d',
        'e:f',
        'g:h',
        'i:j',
      ]),
    ).toEqual([
      'vendas:clientes',
      'estoque:itens',
      'a:b',
      'c:d',
      'e:f',
      'g:h',
    ]);
    expect(FAVORITOS_MAXIMO).toBe(6);
  });

  it('omite favorito cujo módulo o perfil não acessa', () => {
    expect(
      favoritosComAcesso(
        ['vendas:clientes', 'estoque:itens'],
        { vendas: true },
      ),
    ).toEqual(['vendas:clientes']);
  });
});
