import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

export interface EstampaMetadadoAncoraContrato {
  campoDefId: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

const CHAVES_PERMITIDAS = new Set([
  'campoDefId',
  'x',
  'y',
  'width',
  'height',
]);

@ValidatorConstraint({ name: 'metadadosAncorasEstampa', async: false })
export class MetadadosAncorasEstampaValidator
  implements ValidatorConstraintInterface
{
  validate(value: unknown): boolean {
    if (value === undefined || value === null) {
      return true;
    }

    if (!Array.isArray(value)) {
      return false;
    }

    for (const item of value) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return false;
      }

      const registro = item as Record<string, unknown>;
      const chaves = Object.keys(registro);

      if (
        chaves.length !== CHAVES_PERMITIDAS.size ||
        !chaves.every((k) => CHAVES_PERMITIDAS.has(k))
      ) {
        return false;
      }

      const campoDefId = registro.campoDefId;
      const x = registro.x;
      const y = registro.y;
      const width = registro.width;
      const height = registro.height;

      if (typeof campoDefId !== 'string' || campoDefId.trim().length === 0) {
        return false;
      }

      if (
        typeof x !== 'number' ||
        typeof y !== 'number' ||
        typeof width !== 'number' ||
        typeof height !== 'number' ||
        !Number.isFinite(x) ||
        !Number.isFinite(y) ||
        !Number.isFinite(width) ||
        !Number.isFinite(height)
      ) {
        return false;
      }

      if (width <= 0 || height <= 0) {
        return false;
      }
    }

    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} deve ser um array de objetos { campoDefId, x, y, width, height } com valores numéricos válidos.`;
  }
}
