import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateInsumoDto } from './create-insumo.dto';

class EditableInsumoDto extends OmitType(CreateInsumoDto, [
  'fornecedorId',
  'custo_unitario',
] as const) {}

export class UpdateInsumoDto extends PartialType(EditableInsumoDto) {}
