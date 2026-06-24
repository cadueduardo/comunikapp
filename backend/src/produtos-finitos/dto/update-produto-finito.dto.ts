import { PartialType } from '@nestjs/swagger';
import { CreateProdutoFinitoDto } from './create-produto-finito.dto';

export class UpdateProdutoFinitoDto extends PartialType(CreateProdutoFinitoDto) {}
