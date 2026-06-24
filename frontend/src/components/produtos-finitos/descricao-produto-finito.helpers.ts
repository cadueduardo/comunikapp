const LIMITE_DESCRICAO_RESUMIDA = 200;

export const truncarDescricaoResumida = (
  texto: unknown,
  limite = LIMITE_DESCRICAO_RESUMIDA,
): string => {
  if (typeof texto !== 'string') {
    return '';
  }

  const normalizado = texto
    .normalize('NFC')
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalizado) {
    return '';
  }

  if (normalizado.length <= limite) {
    return normalizado;
  }

  return `${normalizado.slice(0, Math.max(limite - 1, 1)).trimEnd()}…`;
};

export const resolverDescricaoResumidaProdutoFinito = (produto: {
  descricao_resumida?: string | null;
  descricao?: string | null;
}): string => {
  const resumida = produto.descricao_resumida?.trim();
  if (resumida) {
    return truncarDescricaoResumida(resumida);
  }

  return truncarDescricaoResumida(produto.descricao);
};

export const resolverDescricaoDetalhadaProdutoFinito = (produto: {
  descricao?: string | null;
}): string => produto.descricao?.trim() || '';
