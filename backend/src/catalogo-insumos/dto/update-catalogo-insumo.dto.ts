import { PartialType } from '@nestjs/swagger';
import { CreateCatalogoInsumoDto } from './create-catalogo-insumo.dto';

export class UpdateCatalogoInsumoDto extends PartialType(CreateCatalogoInsumoDto) {}
