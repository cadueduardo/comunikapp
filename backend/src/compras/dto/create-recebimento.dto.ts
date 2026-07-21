import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class RecebimentoItemDto {
  @IsString()
  @IsNotEmpty({ message: 'pedido_item_id é obrigatório' })
  pedido_item_id: string;

  @IsNumber({}, { message: 'quantidade_recebida deve ser um número' })
  @Min(0, { message: 'quantidade_recebida não pode ser negativa' })
  @Type(() => Number)
  quantidade_recebida: number;

  @IsNumber({}, { message: 'quantidade_aceita deve ser um número' })
  @Min(0, { message: 'quantidade_aceita não pode ser negativa' })
  @Type(() => Number)
  quantidade_aceita: number;

  @IsOptional()
  @IsNumber({}, { message: 'quantidade_recusada deve ser um número' })
  @Min(0, { message: 'quantidade_recusada não pode ser negativa' })
  @Type(() => Number)
  quantidade_recusada?: number;

  @IsOptional()
  @IsString()
  localizacao_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  lote_codigo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observacao?: string;
}

export class CreateRecebimentoDto {
  @IsOptional()
  @IsDateString({}, { message: 'data_recebimento deve ser uma data válida' })
  data_recebimento?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  observacao?: string;

  @IsOptional()
  @IsString()
  @MaxLength(191)
  chave_idempotente?: string;

  /** Se true, confirma imediatamente (entrada de estoque). */
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  confirmar?: boolean;

  @IsArray({ message: 'itens deve ser uma lista' })
  @ArrayMinSize(1, { message: 'Informe ao menos um item no recebimento' })
  @ValidateNested({ each: true })
  @Type(() => RecebimentoItemDto)
  itens: RecebimentoItemDto[];
}

export class CancelarRecebimentoDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  motivo?: string;
}
