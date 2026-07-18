import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class VincularFornecedorItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  fornecedor_id: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(99_999_999.99)
  preco_custo: number;

  @IsOptional()
  @IsString()
  @MaxLength(191)
  codigo_ref?: string;

  @IsBoolean()
  padrao: boolean;
}

export class VincularFornecedoresEnvelopeDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => VincularFornecedorItemDto)
  fornecedores: VincularFornecedorItemDto[];
}
