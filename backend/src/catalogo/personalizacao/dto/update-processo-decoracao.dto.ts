import { PartialType } from '@nestjs/mapped-types';
import { CreateProcessoDecoracaoDto } from './create-processo-decoracao.dto';

export class UpdateProcessoDecoracaoDto extends PartialType(
  CreateProcessoDecoracaoDto,
) {}
