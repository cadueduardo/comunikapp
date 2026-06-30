import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { INSUMOS_ACEITOS_VALORES } from '../constants/insumos-aceitos.constants';

@ValidatorConstraint({ name: 'insumosAceitos', async: false })
export class InsumosAceitosValidator implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (!Array.isArray(value) || value.length === 0) {
      return false;
    }

    const permitidos = new Set<string>(INSUMOS_ACEITOS_VALORES);

    return value.every(
      (item) => typeof item === 'string' && permitidos.has(item),
    );
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} deve ser um array não vazio com valores: ${INSUMOS_ACEITOS_VALORES.join(', ')}.`;
  }
}
