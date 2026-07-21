import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { PedidoItemDto } from './pedido-item.dto';

export class SubstituirFornecedorDto {
  @IsString()
  @IsNotEmpty({ message: 'fornecedor_id é obrigatório' })
  fornecedor_id: string;

  @IsString()
  @IsNotEmpty({ message: 'motivo é obrigatório para substituir o fornecedor' })
  @MaxLength(2000)
  motivo: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  fornecedor_fora_matriz_justificativa?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PedidoItemDto)
  itens?: PedidoItemDto[];
}
