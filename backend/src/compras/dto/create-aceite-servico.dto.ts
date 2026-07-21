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
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class AceiteServicoItemDto {
  @IsString()
  @IsNotEmpty({ message: 'pedido_item_id é obrigatório' })
  pedido_item_id: string;

  @IsOptional()
  @IsNumber({}, { message: 'quantidade_aceita deve ser um número' })
  @Min(0, { message: 'quantidade_aceita não pode ser negativa' })
  @Type(() => Number)
  quantidade_aceita?: number;

  @IsOptional()
  @IsNumber({}, { message: 'percentual_aceito deve ser um número' })
  @Min(0)
  @Max(100)
  @Type(() => Number)
  percentual_aceito?: number;

  @IsOptional()
  @IsNumber({}, { message: 'valor_aceito deve ser um número' })
  @Min(0)
  @Type(() => Number)
  valor_aceito?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observacao?: string;
}

export class CreateAceiteServicoDto {
  @IsOptional()
  @IsDateString({}, { message: 'periodo_inicio deve ser uma data válida' })
  periodo_inicio?: string;

  @IsOptional()
  @IsDateString({}, { message: 'periodo_fim deve ser uma data válida' })
  periodo_fim?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  aceite_final?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  observacao?: string;

  @IsOptional()
  @IsString()
  @MaxLength(191)
  chave_idempotente?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  confirmar?: boolean;

  @IsArray({ message: 'itens deve ser uma lista' })
  @ArrayMinSize(1, { message: 'Informe ao menos um item no aceite' })
  @ValidateNested({ each: true })
  @Type(() => AceiteServicoItemDto)
  itens: AceiteServicoItemDto[];
}

export class CancelarAceiteServicoDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  motivo?: string;
}
