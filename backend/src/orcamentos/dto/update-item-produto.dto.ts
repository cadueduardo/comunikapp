import { PartialType } from '@nestjs/mapped-types';
import { CreateItemProdutoDto } from './create-item-produto.dto';

export class UpdateItemProdutoDto extends PartialType(CreateItemProdutoDto) {} 