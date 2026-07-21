import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export const TIPOS_DOCUMENTO_CONTA_PAGAR = [
  'NF',
  'RECIBO',
  'FATURA',
  'OUTRO',
] as const;

export class ContaPagarParcelaDto {
  @IsInt({ message: 'numero_parcela deve ser inteiro' })
  @Min(1, { message: 'numero_parcela deve ser >= 1' })
  @Type(() => Number)
  numero_parcela: number;

  @IsNumber({}, { message: 'valor_previsto deve ser um número' })
  @Min(0.01, { message: 'valor_previsto deve ser maior que zero' })
  @Type(() => Number)
  valor_previsto: number;

  @IsDateString({}, { message: 'data_vencimento deve ser uma data válida' })
  data_vencimento: string;
}

export class CreateContaPagarDto {
  @IsString()
  @IsNotEmpty({ message: 'fornecedor_id é obrigatório' })
  fornecedor_id: string;

  @IsOptional()
  @IsString()
  pedido_id?: string;

  @IsString()
  @IsIn([...TIPOS_DOCUMENTO_CONTA_PAGAR], {
    message: 'tipo_documento deve ser NF, RECIBO, FATURA ou OUTRO',
  })
  tipo_documento: (typeof TIPOS_DOCUMENTO_CONTA_PAGAR)[number];

  @IsString()
  @IsNotEmpty({ message: 'numero_documento é obrigatório' })
  @MaxLength(100)
  numero_documento: string;

  @IsDateString({}, { message: 'data_emissao deve ser uma data válida' })
  data_emissao: string;

  @IsOptional()
  @IsDateString({}, { message: 'data_competencia deve ser uma data válida' })
  data_competencia?: string;

  @IsNumber({}, { message: 'valor_total deve ser um número' })
  @Min(0.01, { message: 'valor_total deve ser maior que zero' })
  @Type(() => Number)
  valor_total: number;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  observacao?: string;

  @IsOptional()
  @IsString()
  @MaxLength(191)
  chave_idempotente?: string;

  @IsArray({ message: 'parcelas deve ser uma lista' })
  @ArrayMinSize(1, { message: 'Informe ao menos uma parcela' })
  @ValidateNested({ each: true })
  @Type(() => ContaPagarParcelaDto)
  parcelas: ContaPagarParcelaDto[];
}

export class CancelarContaPagarDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  motivo?: string;
}
