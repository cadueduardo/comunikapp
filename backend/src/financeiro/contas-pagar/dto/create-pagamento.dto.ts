import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { DestinoApropriacaoCompra } from '@prisma/client';

export const METODOS_PAGAMENTO_FORNECEDOR = [
  'PIX',
  'TED',
  'BOLETO',
  'DINHEIRO',
  'CARTAO',
  'OUTRO',
] as const;

export class PagamentoApropriacaoDto {
  @IsEnum(DestinoApropriacaoCompra, {
    message:
      'destino_tipo deve ser OS, ITEM_OS, ESTOQUE, CENTRO_CUSTO ou ADMINISTRATIVO',
  })
  destino_tipo: DestinoApropriacaoCompra;

  @IsOptional()
  @IsString()
  os_id?: string;

  @IsOptional()
  @IsString()
  item_os_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  centro_custo?: string;

  @IsOptional()
  @IsString()
  pedido_item_apropriacao_id?: string;

  @IsNumber({}, { message: 'valor deve ser um número' })
  @Min(0.01, { message: 'valor da apropriação deve ser maior que zero' })
  @Type(() => Number)
  valor: number;
}

export class CreatePagamentoDto {
  @IsNumber({}, { message: 'valor deve ser um número' })
  @Min(0.01, { message: 'valor deve ser maior que zero' })
  @Type(() => Number)
  valor: number;

  @IsDateString({}, { message: 'data_pagamento deve ser uma data válida' })
  data_pagamento: string;

  @IsString()
  @IsIn([...METODOS_PAGAMENTO_FORNECEDOR], {
    message: 'metodo deve ser PIX, TED, BOLETO, DINHEIRO, CARTAO ou OUTRO',
  })
  metodo: (typeof METODOS_PAGAMENTO_FORNECEDOR)[number];

  @IsOptional()
  @IsString()
  parcela_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  referencia?: string;

  @IsOptional()
  @IsString()
  @MaxLength(191)
  chave_idempotente?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PagamentoApropriacaoDto)
  apropriacoes?: PagamentoApropriacaoDto[];
}
