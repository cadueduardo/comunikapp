import { usuario_funcao } from '@prisma/client';

export type GranularidadeCatalogo = 'MODULO' | 'GRANULAR';
export type StatusEnforcement = 'ENFORCED' | 'PARCIAL' | 'PENDENTE';
export type RiscoPermissao = 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO';

export type PermissaoCatalogo = {
  chave: string;
  nome: string;
  descricao: string;
  grupo: string;
  risco: RiscoPermissao;
};

export type ModuloCatalogo = {
  chave: string;
  nome: string;
  descricao: string;
  grupo: string;
  ordem: number;
  permissaoAcesso: string;
  granularidade: GranularidadeCatalogo;
  statusEnforcement: StatusEnforcement;
  prefixosApi: string[];
  rotasFrontend: string[];
  /** Piso temporário por função enquanto não há decisão no perfil. */
  pisoPorFuncao: Readonly<Record<usuario_funcao, readonly string[]>>;
  permissoes: PermissaoCatalogo[];
};

export type ChaveModuloFuncional = string;

export const PREFIXOS_API_AUTOATENDIMENTO_USUARIO = [
  '/usuarios/me',
  '/usuarios/2fa',
  '/usuarios/reenviar-codigo',
  '/usuarios/definir-senha',
  '/usuarios/solicitar-redefinicao-senha',
  '/usuarios/redefinir-senha',
  '/lojas/me',
  '/lojas/minha-loja',
  '/lojas/my-loja-trial',
  '/vendas/acesso',
] as const;
