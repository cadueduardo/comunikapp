import { usuario_funcao } from '@prisma/client';

/**
 * Catálogo canônico de permissões de Vendas (31 + excluir ratificada).
 * Fonte: docs/modulo-vendas/fase-0/03-nomenclatura-e-matriz-rbac.md §3
 * + `proposta.excluir` (Gate 0S / Fase 2).
 *
 * Defaults concedidos nesta fase (comportamento já autorizado nos endpoints):
 * apenas o recorte `DEFAULTS_CONCEDIDOS_FASE_2`. As demais constam no catálogo
 * para contrato futuro (carteira, pipeline, etc.) e **não** são semeadas como
 * permitido=true até a fase correspondente.
 */
export const VENDAS_PERMISSOES = {
  // Carteira / cliente (Fase 4+)
  CARTEIRA_VER_PROPRIA: 'vendas.carteira.ver.propria',
  CARTEIRA_VER_EQUIPE: 'vendas.carteira.ver.equipe',
  CARTEIRA_VER_TODOS: 'vendas.carteira.ver.todos',
  CARTEIRA_VER_SEM_RESPONSAVEL: 'vendas.carteira.ver.sem_responsavel',
  CARTEIRA_TRANSFERIR: 'vendas.carteira.transferir',
  CLIENTE_CRIAR: 'vendas.cliente.criar',
  CLIENTE_EDITAR: 'vendas.cliente.editar',
  CLIENTE_MESCLAR: 'vendas.cliente.mesclar',
  CLIENTE_INATIVAR: 'vendas.cliente.inativar',
  CONTATO_GERENCIAR: 'vendas.contato.gerenciar',

  // Proposta (autorizada nesta fase)
  PROPOSTA_VER: 'vendas.proposta.ver',
  PROPOSTA_CRIAR: 'vendas.proposta.criar',
  PROPOSTA_EDITAR: 'vendas.proposta.editar',
  PROPOSTA_ENVIAR: 'vendas.proposta.enviar',
  PROPOSTA_REVISAR: 'vendas.proposta.revisar',
  PROPOSTA_MARCAR_PERDIDA: 'vendas.proposta.marcar_perdida',
  PROPOSTA_REABRIR: 'vendas.proposta.reabrir',
  PROPOSTA_ACEITE_REGISTRAR: 'vendas.proposta.aceite.registrar',
  PROPOSTA_EXCLUIR: 'vendas.proposta.excluir',

  // Preço / alçada (Fases posteriores)
  PRECO_DESCONTO_APLICAR: 'vendas.preco.desconto.aplicar',
  PRECO_CUSTO_VER: 'vendas.preco.custo.ver',
  PRECO_MARGEM_VER: 'vendas.preco.margem.ver',
  ALCADA_SOLICITAR: 'vendas.alcada.solicitar',
  ALCADA_APROVAR: 'vendas.alcada.aprovar',

  // Pedido / aditivo / atividade (Fases 5–6+)
  PEDIDO_VER: 'vendas.pedido.ver',
  PEDIDO_CANCELAR: 'vendas.pedido.cancelar',
  PEDIDO_COBRANCA_VER: 'vendas.pedido.cobranca.ver',
  ADITIVO_VER: 'vendas.aditivo.ver',
  ADITIVO_PRECIFICAR: 'vendas.aditivo.precificar',
  ADITIVO_ENVIAR: 'vendas.aditivo.enviar',
  ADITIVO_GERAR_OS: 'vendas.aditivo.gerar_os',
  ATIVIDADE_VER_PROPRIA: 'vendas.atividade.ver.propria',
  ATIVIDADE_VER_EQUIPE: 'vendas.atividade.ver.equipe',
  ATIVIDADE_GERENCIAR: 'vendas.atividade.gerenciar',
} as const;

export type VendasPermissao =
  (typeof VENDAS_PERMISSOES)[keyof typeof VENDAS_PERMISSOES];

/** Recorte efetivamente enforced pelos endpoints Orçamentos V2 nesta fase. */
export const DEFAULTS_CONCEDIDOS_FASE_2 = {
  VENDEDOR: [
    VENDAS_PERMISSOES.PROPOSTA_VER,
    VENDAS_PERMISSOES.PROPOSTA_CRIAR,
    VENDAS_PERMISSOES.PROPOSTA_EDITAR,
    VENDAS_PERMISSOES.PROPOSTA_ENVIAR,
    VENDAS_PERMISSOES.PROPOSTA_ACEITE_REGISTRAR,
  ],
  GESTOR: [
    VENDAS_PERMISSOES.PROPOSTA_VER,
    VENDAS_PERMISSOES.PROPOSTA_CRIAR,
    VENDAS_PERMISSOES.PROPOSTA_EDITAR,
    VENDAS_PERMISSOES.PROPOSTA_ENVIAR,
    VENDAS_PERMISSOES.PROPOSTA_ACEITE_REGISTRAR,
    VENDAS_PERMISSOES.PROPOSTA_EXCLUIR,
    VENDAS_PERMISSOES.PROPOSTA_REVISAR,
    VENDAS_PERMISSOES.PROPOSTA_MARCAR_PERDIDA,
    VENDAS_PERMISSOES.PROPOSTA_REABRIR,
  ],
  FINANCEIRO: [VENDAS_PERMISSOES.PROPOSTA_VER],
  ADMIN: [
    VENDAS_PERMISSOES.PROPOSTA_VER,
    VENDAS_PERMISSOES.PROPOSTA_CRIAR,
    VENDAS_PERMISSOES.PROPOSTA_EDITAR,
    VENDAS_PERMISSOES.PROPOSTA_ENVIAR,
    VENDAS_PERMISSOES.PROPOSTA_ACEITE_REGISTRAR,
    VENDAS_PERMISSOES.PROPOSTA_EXCLUIR,
    VENDAS_PERMISSOES.PROPOSTA_REVISAR,
    VENDAS_PERMISSOES.PROPOSTA_MARCAR_PERDIDA,
    VENDAS_PERMISSOES.PROPOSTA_REABRIR,
  ],
} as const;

/**
 * Defaults adicionais da Fase 4 (carteira / cliente / contato).
 * Inclui o recorte da Fase 2 para o seed continuar idempotente e completo.
 */
export const DEFAULTS_CONCEDIDOS_FASE_4 = {
  VENDEDOR: [
    ...DEFAULTS_CONCEDIDOS_FASE_2.VENDEDOR,
    VENDAS_PERMISSOES.CARTEIRA_VER_PROPRIA,
    VENDAS_PERMISSOES.CLIENTE_CRIAR,
    VENDAS_PERMISSOES.CLIENTE_EDITAR,
    VENDAS_PERMISSOES.CONTATO_GERENCIAR,
  ],
  GESTOR: [
    ...DEFAULTS_CONCEDIDOS_FASE_2.GESTOR,
    VENDAS_PERMISSOES.CARTEIRA_VER_PROPRIA,
    VENDAS_PERMISSOES.CARTEIRA_VER_EQUIPE,
    VENDAS_PERMISSOES.CARTEIRA_VER_TODOS,
    VENDAS_PERMISSOES.CARTEIRA_VER_SEM_RESPONSAVEL,
    VENDAS_PERMISSOES.CARTEIRA_TRANSFERIR,
    VENDAS_PERMISSOES.CLIENTE_CRIAR,
    VENDAS_PERMISSOES.CLIENTE_EDITAR,
    VENDAS_PERMISSOES.CLIENTE_INATIVAR,
    VENDAS_PERMISSOES.CONTATO_GERENCIAR,
  ],
  FINANCEIRO: [...DEFAULTS_CONCEDIDOS_FASE_2.FINANCEIRO],
  ADMIN: [
    ...DEFAULTS_CONCEDIDOS_FASE_2.ADMIN,
    VENDAS_PERMISSOES.CARTEIRA_VER_PROPRIA,
    VENDAS_PERMISSOES.CARTEIRA_VER_EQUIPE,
    VENDAS_PERMISSOES.CARTEIRA_VER_TODOS,
    VENDAS_PERMISSOES.CARTEIRA_VER_SEM_RESPONSAVEL,
    VENDAS_PERMISSOES.CARTEIRA_TRANSFERIR,
    VENDAS_PERMISSOES.CLIENTE_CRIAR,
    VENDAS_PERMISSOES.CLIENTE_EDITAR,
    VENDAS_PERMISSOES.CLIENTE_MESCLAR,
    VENDAS_PERMISSOES.CLIENTE_INATIVAR,
    VENDAS_PERMISSOES.CONTATO_GERENCIAR,
  ],
} as const;

/**
 * Defaults da Fase 5 (atividades) sobre o recorte da Fase 4.
 * Financeiro: sem ATIVIDADE_* implícito.
 */
export const DEFAULTS_CONCEDIDOS_FASE_5 = {
  VENDEDOR: [
    ...DEFAULTS_CONCEDIDOS_FASE_4.VENDEDOR,
    VENDAS_PERMISSOES.ATIVIDADE_VER_PROPRIA,
    VENDAS_PERMISSOES.ATIVIDADE_GERENCIAR,
  ],
  GESTOR: [
    ...DEFAULTS_CONCEDIDOS_FASE_4.GESTOR,
    VENDAS_PERMISSOES.ATIVIDADE_VER_PROPRIA,
    VENDAS_PERMISSOES.ATIVIDADE_VER_EQUIPE,
    VENDAS_PERMISSOES.ATIVIDADE_GERENCIAR,
  ],
  FINANCEIRO: [...DEFAULTS_CONCEDIDOS_FASE_4.FINANCEIRO],
  ADMIN: [
    ...DEFAULTS_CONCEDIDOS_FASE_4.ADMIN,
    VENDAS_PERMISSOES.ATIVIDADE_VER_PROPRIA,
    VENDAS_PERMISSOES.ATIVIDADE_VER_EQUIPE,
    VENDAS_PERMISSOES.ATIVIDADE_GERENCIAR,
  ],
} as const;

export const DEFAULTS_CONCEDIDOS_FASE_7 = {
  VENDEDOR: [
    ...DEFAULTS_CONCEDIDOS_FASE_5.VENDEDOR,
    VENDAS_PERMISSOES.PRECO_DESCONTO_APLICAR,
    VENDAS_PERMISSOES.ALCADA_SOLICITAR,
  ],
  GESTOR: [
    ...DEFAULTS_CONCEDIDOS_FASE_5.GESTOR,
    VENDAS_PERMISSOES.PRECO_DESCONTO_APLICAR,
    VENDAS_PERMISSOES.PRECO_CUSTO_VER,
    VENDAS_PERMISSOES.PRECO_MARGEM_VER,
    VENDAS_PERMISSOES.ALCADA_SOLICITAR,
    VENDAS_PERMISSOES.ALCADA_APROVAR,
  ],
  FINANCEIRO: [...DEFAULTS_CONCEDIDOS_FASE_5.FINANCEIRO],
  ADMIN: [
    ...DEFAULTS_CONCEDIDOS_FASE_5.ADMIN,
    VENDAS_PERMISSOES.PRECO_DESCONTO_APLICAR,
    VENDAS_PERMISSOES.PRECO_CUSTO_VER,
    VENDAS_PERMISSOES.PRECO_MARGEM_VER,
    VENDAS_PERMISSOES.ALCADA_SOLICITAR,
    VENDAS_PERMISSOES.ALCADA_APROVAR,
  ],
} as const;

export const DEFAULTS_CONCEDIDOS_FASE_9 = {
  VENDEDOR: [
    ...DEFAULTS_CONCEDIDOS_FASE_7.VENDEDOR,
    VENDAS_PERMISSOES.ADITIVO_VER,
    VENDAS_PERMISSOES.ADITIVO_PRECIFICAR,
  ],
  GESTOR: [
    ...DEFAULTS_CONCEDIDOS_FASE_7.GESTOR,
    VENDAS_PERMISSOES.ADITIVO_VER,
    VENDAS_PERMISSOES.ADITIVO_PRECIFICAR,
    VENDAS_PERMISSOES.ADITIVO_ENVIAR,
    VENDAS_PERMISSOES.ADITIVO_GERAR_OS,
  ],
  FINANCEIRO: [
    ...DEFAULTS_CONCEDIDOS_FASE_7.FINANCEIRO,
    VENDAS_PERMISSOES.ADITIVO_VER,
  ],
  ADMIN: [
    ...DEFAULTS_CONCEDIDOS_FASE_7.ADMIN,
    VENDAS_PERMISSOES.ADITIVO_VER,
    VENDAS_PERMISSOES.ADITIVO_PRECIFICAR,
    VENDAS_PERMISSOES.ADITIVO_ENVIAR,
    VENDAS_PERMISSOES.ADITIVO_GERAR_OS,
  ],
} as const;

/**
 * Piso por `usuario_funcao` enquanto perfil não concede explicitamente.
 * Função desconhecida / operacional → [].
 * Admin → todas as permissões do catálogo (bypass também no service).
 */
const PISO_POR_FUNCAO: Readonly<
  Record<usuario_funcao, readonly string[]>
> = {
  [usuario_funcao.ADMINISTRADOR]: Object.values(VENDAS_PERMISSOES),
  [usuario_funcao.VENDAS]: DEFAULTS_CONCEDIDOS_FASE_7.VENDEDOR,
  [usuario_funcao.FINANCEIRO]: DEFAULTS_CONCEDIDOS_FASE_7.FINANCEIRO,
  [usuario_funcao.PRODUCAO]: [],
  [usuario_funcao.ESTOQUE]: [],
};

export function funcaoConcede(
  funcao: usuario_funcao | string | null | undefined,
  permissao: string,
): boolean {
  if (!funcao || !(funcao in PISO_POR_FUNCAO)) {
    return false;
  }
  return (PISO_POR_FUNCAO[funcao as usuario_funcao] ?? []).includes(permissao);
}

/**
 * Compatibilidade UserRole (legado / frontend) → usuario_funcao.
 * UserRole NÃO autoriza; só documenta tradução para quem ainda o envia.
 */
export const MAPA_USER_ROLE_PARA_FUNCAO: Readonly<
  Record<string, usuario_funcao | null>
> = {
  admin: usuario_funcao.ADMINISTRADOR,
  ADMIN: usuario_funcao.ADMINISTRADOR,
  gerente: usuario_funcao.VENDAS,
  GERENTE: usuario_funcao.VENDAS,
  manager: usuario_funcao.VENDAS,
  MANAGER: usuario_funcao.VENDAS,
  vendedor: usuario_funcao.VENDAS,
  VENDEDOR: usuario_funcao.VENDAS,
  user: null,
  USER: null,
  viewer: null,
  VIEWER: null,
  operador: usuario_funcao.PRODUCAO,
  OPERADOR: usuario_funcao.PRODUCAO,
};

export const NOMES_PERFIL_SISTEMA = {
  VENDEDOR: 'Vendedor',
  GESTOR: 'Gestor de Vendas',
  FINANCEIRO: 'Financeiro Comercial',
  ADMIN: 'Administrador',
} as const;

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

export function listarCatalogoVendas(): readonly string[] {
  return Object.values(VENDAS_PERMISSOES);
}
