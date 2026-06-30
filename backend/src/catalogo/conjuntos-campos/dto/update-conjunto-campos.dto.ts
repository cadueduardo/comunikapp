import { PartialType } from '@nestjs/mapped-types';
import { CreateConjuntoCamposDto } from './create-conjunto-campos.dto';

export class UpdateConjuntoCamposDto extends PartialType(
  CreateConjuntoCamposDto,
) {}
