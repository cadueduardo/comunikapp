import { BadRequestException } from '@nestjs/common';
import { MAX_VDP_LOTE_REGISTROS } from './arte-producao.constants';

const FORMULA_PREFIX = /^[=+\-@]/;

export type AncoraRenderizacao = {
  campoDefId: string;
  chave: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export function sanitizarTextoVdp(valor: unknown): string {
  if (valor === null || valor === undefined) {
    return '';
  }
  const texto = String(valor).trim();
  if (!texto) {
    return '';
  }
  if (FORMULA_PREFIX.test(texto)) {
    throw new BadRequestException(
      'Valor de personalização bloqueado (possível injeção de fórmula em planilha).',
    );
  }
  return texto;
}

/**
 * Normaliza `valores_personalizacao` polimórfico (objeto único ou array VDP).
 */
export function normalizarRegistrosVdp(
  valores: unknown,
  quantidadeItem: number,
): Array<Record<string, string>> {
  if (valores === null || valores === undefined) {
    return [];
  }

  let brutos: Array<Record<string, unknown>>;

  if (Array.isArray(valores)) {
    brutos = valores as Array<Record<string, unknown>>;
  } else if (typeof valores === 'object') {
    brutos = [valores as Record<string, unknown>];
  } else {
    throw new BadRequestException(
      'Formato de valores_personalizacao inválido para VDP.',
    );
  }

  if (brutos.length > MAX_VDP_LOTE_REGISTROS) {
    throw new BadRequestException(
      `Lote VDP excede o limite de ${MAX_VDP_LOTE_REGISTROS} registros.`,
    );
  }

  if (quantidadeItem > 1 && brutos.length !== quantidadeItem) {
    throw new BadRequestException(
      `Quantidade de registros VDP (${brutos.length}) diverge da quantidade do item (${quantidadeItem}).`,
    );
  }

  return brutos.map((registro, indice) => {
    const normalizado: Record<string, string> = {};
    for (const [chave, valor] of Object.entries(registro)) {
      try {
        normalizado[chave] = sanitizarTextoVdp(valor);
      } catch (error) {
        throw new BadRequestException(
          `Registro ${indice + 1}, campo "${chave}": ${(error as Error).message}`,
        );
      }
    }
    return normalizado;
  });
}

export function resolverAncorasComChaves(
  metadados: unknown,
  camposConjunto: Array<{ id: string; chave: string }>,
): AncoraRenderizacao[] {
  if (!Array.isArray(metadados) || !metadados.length) {
    return [];
  }

  const mapaIdChave = new Map(camposConjunto.map((c) => [c.id, c.chave]));
  const ancoras: AncoraRenderizacao[] = [];

  for (const raw of metadados) {
    if (!raw || typeof raw !== 'object') continue;
    const ancora = raw as Record<string, unknown>;
    const campoDefId = String(ancora.campoDefId ?? '');
    const chave = mapaIdChave.get(campoDefId);
    if (!chave) continue;

    ancoras.push({
      campoDefId,
      chave,
      x: Number(ancora.x ?? 0),
      y: Number(ancora.y ?? 0),
      width: Number(ancora.width ?? 0.2),
      height: Number(ancora.height ?? 0.05),
    });
  }

  return ancoras;
}
