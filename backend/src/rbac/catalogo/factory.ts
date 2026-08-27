import { usuario_funcao } from '@prisma/client';
import { validarChaveModulo, validarChavePermissao } from './parser-chave';
import {
  ModuloCatalogo,
  PermissaoCatalogo,
  StatusEnforcement,
} from './tipos';

const FUNCOES = Object.values(usuario_funcao);

export function pisoVazio(): Record<usuario_funcao, readonly string[]> {
  return {
    [usuario_funcao.ADMINISTRADOR]: [],
    [usuario_funcao.FINANCEIRO]: [],
    [usuario_funcao.PRODUCAO]: [],
    [usuario_funcao.VENDAS]: [],
    [usuario_funcao.ESTOQUE]: [],
  };
}

export function pisoAcessoParaFuncoes(
  permissaoAcesso: string,
  funcoes: readonly usuario_funcao[],
): Record<usuario_funcao, readonly string[]> {
  const piso = pisoVazio();
  for (const funcao of funcoes) {
    piso[funcao] = [permissaoAcesso];
  }
  return piso;
}

export function permissaoAcessoModulo(
  chave: string,
  extras?: Partial<PermissaoCatalogo>,
): PermissaoCatalogo {
  const chavePermissao = `${chave}.acessar`;
  validarChavePermissao(chavePermissao);
  return {
    chave: chavePermissao,
    nome: extras?.nome ?? 'Acessar o módulo',
    descricao:
      extras?.descricao ??
      'Porta de entrada do módulo. Sem esta permissão a API e o menu são negados.',
    grupo: extras?.grupo ?? chave,
    risco: extras?.risco ?? 'MEDIO',
  };
}

export function manifestoAcessoModulo(input: {
  chave: string;
  nome: string;
  descricao: string;
  grupo: string;
  ordem: number;
  statusEnforcement: StatusEnforcement;
  prefixosApi: string[];
  rotasFrontend: string[];
  funcoesComAcesso: readonly usuario_funcao[];
  permissoesGranulares?: PermissaoCatalogo[];
  pisoExtra?: Partial<Record<usuario_funcao, readonly string[]>>;
}): ModuloCatalogo {
  validarChaveModulo(input.chave);
  const acesso = permissaoAcessoModulo(input.chave);
  const granulares = input.permissoesGranulares ?? [];
  for (const p of granulares) {
    validarChavePermissao(p.chave);
    if (!p.chave.startsWith(`${input.chave}.`)) {
      throw new Error(
        `Permissão "${p.chave}" não pertence ao módulo "${input.chave}".`,
      );
    }
  }

  const piso = pisoAcessoParaFuncoes(acesso.chave, input.funcoesComAcesso);
  if (input.pisoExtra) {
    for (const funcao of FUNCOES) {
      const extra = input.pisoExtra[funcao];
      if (extra?.length) {
        piso[funcao] = [...new Set([...piso[funcao], ...extra])];
      }
    }
  }

  return {
    chave: input.chave,
    nome: input.nome,
    descricao: input.descricao,
    grupo: input.grupo,
    ordem: input.ordem,
    permissaoAcesso: acesso.chave,
    granularidade: granulares.length > 0 ? 'GRANULAR' : 'MODULO',
    statusEnforcement: input.statusEnforcement,
    prefixosApi: input.prefixosApi,
    rotasFrontend: input.rotasFrontend,
    pisoPorFuncao: piso,
    permissoes: [acesso, ...granulares],
  };
}
