import {
  aplicarOwnershipCriacao,
  nomeAtendenteDoUsuario,
} from './orcamento-responsavel';

describe('orcamento-responsavel', () => {
  it('usa o nome do usuário e ignora atendente/responsável do body', () => {
    const preparado = aplicarOwnershipCriacao(
      {
        titulo: 'Teste',
        atendente: 'Equipe Comercial',
        responsavel_id: 'outro-usuario',
      },
      'user-logado',
      '  Maria Silva  ',
    );

    expect(preparado.responsavel_id).toBe('user-logado');
    expect(preparado.atendente).toBe('Maria Silva');
  });

  it('cai no rótulo da loja se o nome estiver vazio', () => {
    expect(nomeAtendenteDoUsuario('')).toBe('Equipe Comercial');
    expect(nomeAtendenteDoUsuario(null)).toBe('Equipe Comercial');
  });
});
