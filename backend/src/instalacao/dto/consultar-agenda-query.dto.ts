import {
  IsDateString,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'dataFimMaiorOuIgualInicio', async: false })
class DataFimMaiorOuIgualInicioConstraint
  implements ValidatorConstraintInterface
{
  validate(dataFim: string, args: ValidationArguments): boolean {
    const objeto = args.object as ConsultarAgendaQueryDto;
    if (!objeto.data_inicio || !dataFim) {
      return true;
    }
    return new Date(dataFim).getTime() >= new Date(objeto.data_inicio).getTime();
  }

  defaultMessage(): string {
    return 'data_fim deve ser igual ou posterior a data_inicio.';
  }
}

export class ConsultarAgendaQueryDto {
  @IsDateString({}, { message: 'data_inicio deve ser uma data válida (ISO 8601).' })
  data_inicio: string;

  @IsDateString({}, { message: 'data_fim deve ser uma data válida (ISO 8601).' })
  @Validate(DataFimMaiorOuIgualInicioConstraint)
  data_fim: string;
}
