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
  ValidateIf,
} from 'class-validator';

export class SolicitacaoItemDto {
  @IsEnum(TipoItemCompra, {
    message: 'Tipo do item deve ser MATERIAL, SERVICO ou DESPESA',
  })
  tipo: TipoItemCompra;

  @ValidateIf((o: SolicitacaoItemDto) => o.tipo === TipoItemCompra.MATERIAL)
  @IsString({ message: 'insumo_id é obrigatório para itens MATERIAL' })
  @IsNotEmpty({ message: 'insumo_id é obrigatório para itens MATERIAL' })
  insumo_id?: string;

  @ValidateIf(
    (o: SolicitacaoItemDto) =>
      o.tipo === TipoItemCompra.SERVICO || o.tipo === TipoItemCompra.DESPESA,
  )
  @IsString({ message: 'descricao é obrigatória para SERVICO/DESPESA' })
  @IsNotEmpty({ message: 'descricao é obrigatória para SERVICO/DESPESA' })
  @MaxLength(500)
  descricao?: string;

  @IsNumber({}, { message: 'quantidade deve ser um número' })
  @IsPositive({ message: 'quantidade deve ser positiva' })
  @Type(() => Number)
  quantidade: number;

  @IsString()
  @IsNotEmpty({ message: 'unidade é obrigatória' })
  @MaxLength(32)
  unidade: string;

  @IsOptional()
  @IsString()
  item_os_id?: string;

  @IsOptional()
  @IsString()
  ordem_terceirizacao_id?: string;
}
