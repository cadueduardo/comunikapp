import { TransformacaoV2Service } from './transformacao-v2.service';

describe('TransformacaoV2Service — contato_id persistido na criação', () => {
  it('inclui contato_id no payload preparado para o Prisma', () => {
    const svc = new TransformacaoV2Service();
    const preparado = svc.prepararDadosCriacao(
      {
        titulo: 'Orçamento com contato',
        cliente_id: 'cliente-1',
        contato_id: 'contato-1',
        produtos: [
          {
            nome_servico: 'Banner',
            quantidade: 1,
            preco_unitario: 10,
            preco_total: 10,
          },
        ],
      },
      'loja-1',
      'user-1',
    );

    expect(preparado.cliente_id).toBe('cliente-1');
    expect(preparado.contato_id).toBe('contato-1');
    expect(preparado.loja_id).toBe('loja-1');
  });

  it('normaliza contato_id vazio para null', () => {
    const svc = new TransformacaoV2Service();
    const preparado = svc.prepararDadosCriacao(
      {
        titulo: 'Sem contato',
        cliente_id: 'cliente-1',
        contato_id: '   ',
        produtos: [
          {
            nome_servico: 'Banner',
            quantidade: 1,
            preco_unitario: 10,
            preco_total: 10,
          },
        ],
      },
      'loja-1',
      'user-1',
    );
    expect(preparado.contato_id).toBeNull();
  });
});
