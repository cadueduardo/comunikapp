import { PartialType } from '@nestjs/mapped-types';
import { CreateCustoIndiretoDto } from './create-custo-indireto.dto';

export class UpdateCustoIndiretoDto extends PartialType(CreateCustoIndiretoDto) {} 