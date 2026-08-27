export function separarModuloEAcao(permissao: string): {
  modulo: string;
  acao: string;
} {
  const partes = permissao.split('.');
  const modulo = partes[0];
  const acao = partes.slice(1).join('.');
  if (partes.length < 2 || !modulo || !acao) {
    throw new Error(`Permissão inválida: "${permissao}".`);
  }
  return { modulo, acao };
}

const CHAVE_PERMISSAO =
  /^[a-z][a-z0-9-]*(\.[a-z][a-z0-9_-]*)+$/;

export function validarChavePermissao(chave: string): void {
  if (!CHAVE_PERMISSAO.test(chave)) {
    throw new Error(`Chave de permissão fora do padrão: "${chave}".`);
  }
}

export function validarChaveModulo(chave: string): void {
  if (!/^[a-z][a-z0-9-]*$/.test(chave)) {
    throw new Error(`Chave de módulo inválida: "${chave}".`);
  }
}
