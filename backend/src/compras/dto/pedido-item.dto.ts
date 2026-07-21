import { TipoItemCompra } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

export class PedidoItemDto {
  @IsEnum(TipoItemCompra, {
    message: 'Tipo do item deve ser MATERIAL, SERVICO ou DESPESA',
  })
  tipo: TipoItemCompra;

  @IsOptional()
  @IsString()
  solicitacao_item_id?: string;

  @ValidateIf((o: PedidoItemDto) => o.tipo === TipoItemCompra.MATERIAL)
  @IsString({ message: 'insumo_id é obrigatório para itens MATERIAL' })
  @IsNotEmpty({ message: 'insumo_id é obrigatório para itens MATERIAL' })
  insumo_id?: string;

  @IsOptional()
  @IsString()
  ordem_terceirizacao_id?: string;

  @IsString()
  @IsNotEmpty({ message: 'descricao_snapshot é obrigatória' })
  @MaxLength(500)
  descricao_snapshot: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  codigo_ref_snapshot?: string;

  @IsNumber({}, { message: 'quantidade deve ser um número' })
  @IsPositive({ message: 'quantidade deve ser positiva' })
  @Type(() => Number)
  quantidade: number;

  @IsString()
  @IsNotEmpty({ message: 'unidade_snapshot é obrigatória' })
  @MaxLength(32)
  unidade_snapshot: string;

  @IsNumber({}, { message: 'preco_unitario deve ser um número' })
  @Min(0, { message: 'preco_unitario não pode ser negativo' })
  @Type(() => Number)
  preco_unitario: number;

  @IsOptional()
  @IsNumber({}, { message: 'desconto deve ser um número' })
  @Min(0, { message: 'desconto não pode ser negativo' })
  @Type(() => Number)
  desconto?: number;

  @IsOptional()
  @IsNumber({}, { message: 'frete_rateado deve ser um número' })
  @Min(0, { message: 'frete_rateado não pode ser negativo' })
  @Type(() => Number)
  frete_rateado?: number;
}
