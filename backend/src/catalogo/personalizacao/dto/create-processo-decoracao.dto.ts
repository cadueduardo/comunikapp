import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  Validate,
} from 'class-validator';
import { FaixasPrecoValidator } from '../../common/validators/faixas-preco.validator';
import { InsumosAceitosValidator } from '../../common/validators/insumos-aceitos.validator';
import { INSUMOS_ACEITOS_VALORES } from '../../common/constants/insumos-aceitos.constants';
import { FaixaPrecoDto } from './faixa-preco.dto';

export class CreateProcessoDecoracaoDto {
  @ApiProperty({ example: 'Silk 1 cor' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nome: string;

  @ApiPropertyOptional({ example: 'SILK-1C' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  codigo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  exige_arte_aprovada?: boolean;

  @ApiProperty({
    example: ['TEXTO', 'ARQUIVO'],
    enum: INSUMOS_ACEITOS_VALORES,
    isArray: true,
  })
  @IsArray()
  @Validate(InsumosAceitosValidator)
  insumos_aceitos: string[];

  @ApiPropertyOptional({ example: 12.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  preco_base?: number;

  @ApiPropertyOptional({
    example: 45.0,
    description: 'Custo fixo de setup por linha',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  custo_setup?: number;

  @ApiPropertyOptional({
    type: [FaixaPrecoDto],
    example: [
      { min: 1, max: 10, preco: 5 },
      { min: 11, max: null, preco: 3 },
    ],
  })
  @IsOptional()
  @IsArray()
  @Validate(FaixasPrecoValidator)
  faixas_preco?: FaixaPrecoDto[];

  @ApiPropertyOptional({ example: 'Serigrafia' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  setor_pcp_sugerido?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
