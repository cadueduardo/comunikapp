import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

export interface FaixaPrecoContrato {
  min: number;
  max?: number | null;
  preco: number;
}

@ValidatorConstraint({ name: 'faixasPreco', async: false })
export class FaixasPrecoValidator implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (value === undefined || value === null) {
      return true;
    }

    if (!Array.isArray(value)) {
      return false;
    }

    const faixas: FaixaPrecoContrato[] = [];

    for (const item of value) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return false;
      }

      const registro = item as Record<string, unknown>;
      const chaves = Object.keys(registro);
      const permitidas = new Set(['min', 'max', 'preco']);
      if (
        !chaves.every((k) => permitidas.has(k)) ||
        !chaves.includes('min') ||
        !chaves.includes('preco')
      ) {
        return false;
      }

      const min = registro.min;
      const max = registro.max;
      const preco = registro.preco;

      if (typeof min !== 'number' || !Number.isInteger(min) || min < 1) {
        return false;
      }

      if (
        max !== null &&
        max !== undefined &&
        (typeof max !== 'number' || !Number.isInteger(max) || max < min)
      ) {
        return false;
      }

      if (typeof preco !== 'number' || preco < 0 || Number.isNaN(preco)) {
        return false;
      }

      faixas.push({
        min,
        max: max === undefined ? null : (max as number | null),
        preco,
      });
    }

    if (faixas.length === 0) {
      return true;
    }

    const ordenadas = [...faixas].sort((a, b) => a.min - b.min);

    for (let i = 0; i < ordenadas.length; i++) {
      const atual = ordenadas[i];
      if (atual.max != null && atual.max < atual.min) {
        return false;
      }
      if (i > 0) {
        const anterior = ordenadas[i - 1];
        const limiteAnterior =
          anterior.max ?? Number.POSITIVE_INFINITY;
        if (atual.min <= limiteAnterior) {
          return false;
        }
      }
    }

    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} deve ser um array de objetos { min, max?, preco } sem sobreposição de faixas.`;
  }
}
