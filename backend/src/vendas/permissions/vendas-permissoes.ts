import { usuario_funcao } from '@prisma/client';

/**
 * Catálogo mínimo exigido pelo Gate 0S para proteger os endpoints já existentes
 * de Orçamentos V2.
 *
 * É um recorte do catálogo aprovado em
 * `docs/modulo-vendas/fase-0/03-nomenclatura-e-matriz-rbac.md` §3.2. As
 * permissões de carteira, contato, alçada e pipeline pertencem à Fase 2 e não
 * podem ser antecipadas aqui.
 */
export const VENDAS_PERMISSOES = {
  PROPOSTA_VER: 'vendas.proposta.ver',
  PROPOSTA_CRIAR: 'vendas.proposta.criar',
  PROPOSTA_EDITAR: 'vendas.proposta.editar',
  PROPOSTA_ENVIAR: 'vendas.proposta.enviar',
  PROPOSTA_ACEITE_REGISTRAR: 'vendas.proposta.aceite.registrar',
  /**
   * Acréscimo do Gate 0S: o endpoint de exclusão de orçamento já existe e
   * precisa de permissão própria, mas a matriz do artefato 03 não previa uma
   * ação destrutiva de proposta. Deve ser ratificada na Fase 2.
   */
  PROPOSTA_EXCLUIR: 'vendas.proposta.excluir',
} as const;

export type VendasPermissao =
  (typeof VENDAS_PERMISSOES)[keyof typeof VENDAS_PERMISSOES];

/**
 * Piso de autorização por função, aplicado enquanto `perfil_permissao` não é
 * semeada (o seed pertence à Fase 2 e a tela de perfis ainda não persiste
 * permissões).
 *
 * Sem este piso, negar por padrão deixaria apenas administradores operando
 * Orçamentos V2. Com ele, a autorização é a união entre o que a função concede
 * e o que houver explicitamente cadastrado em `perfil_permissao`.
 *
 * Espelha a matriz de perfis do artefato 03 §4: Vendedor opera a proposta,
 * Financeiro apenas lê, e funções operacionais não têm acesso comercial.
 */
const PISO_POR_FUNCAO: Readonly<Record<usuario_funcao, readonly string[]>> = {
  [usuario_funcao.ADMINISTRADOR]: Object.values(VENDAS_PERMISSOES),
  [usuario_funcao.VENDAS]: [
    VENDAS_PERMISSOES.PROPOSTA_VER,
    VENDAS_PERMISSOES.PROPOSTA_CRIAR,
    VENDAS_PERMISSOES.PROPOSTA_EDITAR,
    VENDAS_PERMISSOES.PROPOSTA_ENVIAR,
    VENDAS_PERMISSOES.PROPOSTA_ACEITE_REGISTRAR,
  ],
  [usuario_funcao.FINANCEIRO]: [VENDAS_PERMISSOES.PROPOSTA_VER],
  [usuario_funcao.PRODUCAO]: [],
  [usuario_funcao.ESTOQUE]: [],
};

export function funcaoConcede(
  funcao: usuario_funcao,
  permissao: string,
): boolean {
  return (PISO_POR_FUNCAO[funcao] ?? []).includes(permissao);
}

/**
 * Quebra `vendas.proposta.aceite.registrar` no par `(modulo, acao)` gravado em
 * `perfil_permissao`: o primeiro segmento é o módulo e o restante é a ação.
 */
export function separarModuloEAcao(permissao: string): {
  modulo: string;
  acao: string;
} {
  const partes = permissao.split('.');
  const modulo = partes[0];
  const acao = partes.slice(1).join('.');

  if (partes.length < 2 || !modulo || !acao) {
    throw new Error(`Permissão de vendas inválida: "${permissao}".`);
  }

  return { modulo, acao };
}
