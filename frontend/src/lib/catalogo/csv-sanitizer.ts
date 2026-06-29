const FORMULA_PREFIX = /^[=+\-@]/;

export function sanitizarCelulaCsv(valor: string): {
  valor: string;
  rejeitado: boolean;
  motivo?: string;
} {
  const trimmed = valor.trim();
  if (!trimmed) {
    return { valor: '', rejeitado: false };
  }

  if (FORMULA_PREFIX.test(trimmed)) {
    return {
      valor: '',
      rejeitado: true,
      motivo: `Célula bloqueada (possível injeção de fórmula): "${trimmed.slice(0, 40)}${trimmed.length > 40 ? '…' : ''}"`,
    };
  }

  return { valor: trimmed, rejeitado: false };
}

export function parseCsvTexto(conteudo: string): {
  cabecalho: string[];
  linhas: string[][];
  erros: string[];
} {
  const erros: string[] = [];
  const linhasBrutas = conteudo
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (!linhasBrutas.length) {
    return { cabecalho: [], linhas: [], erros: ['Arquivo vazio ou sem dados.'] };
  }

  const parseLinha = (linha: string): string[] => {
    const campos: string[] = [];
    let atual = '';
    let dentroAspas = false;

    for (let i = 0; i < linha.length; i += 1) {
      const char = linha[i];
      if (char === '"') {
        if (dentroAspas && linha[i + 1] === '"') {
          atual += '"';
          i += 1;
        } else {
          dentroAspas = !dentroAspas;
        }
        continue;
      }
      if (char === ',' && !dentroAspas) {
        campos.push(atual);
        atual = '';
        continue;
      }
      atual += char;
    }
    campos.push(atual);
    return campos;
  };

  const cabecalho = parseLinha(linhasBrutas[0]).map((c) => c.trim());
  const linhas: string[][] = [];

  for (let i = 1; i < linhasBrutas.length; i += 1) {
    const cols = parseLinha(linhasBrutas[i]);
    const sanitizadas: string[] = [];

    for (const col of cols) {
      const { valor, rejeitado, motivo } = sanitizarCelulaCsv(col);
      if (rejeitado && motivo) {
        erros.push(`Linha ${i + 1}: ${motivo}`);
      }
      sanitizadas.push(valor);
    }

    if (sanitizadas.some((c) => c.length > 0)) {
      linhas.push(sanitizadas);
    }
  }

  return { cabecalho, linhas, erros };
}
