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
import { MetadadosAncorasEstampaValidator } from '../../common/validators/metadados-ancoras-estampa.validator';
import { EstampaMetadadoAncoraDto } from './estampa-metadado-ancora.dto';

export class CreateEstampaDto {
  @ApiProperty({ example: 'Estampa Aniversário' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  nome: string;

  @ApiPropertyOptional({ example: 'EST-ANIV-01' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  codigo?: string;

  @ApiProperty({ description: 'Processo de decoração (mesma loja)' })
  @IsString()
  @MinLength(1)
  processo_id: string;

  @ApiPropertyOptional({ description: 'Conjunto de campos variáveis (mesma loja)' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  conjunto_campos_id?: string;

  @ApiPropertyOptional({ example: 8.0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  preco_adicional?: number;

  @ApiPropertyOptional({
    type: [EstampaMetadadoAncoraDto],
    description: 'Âncoras das variáveis sobre a arte-mestra',
  })
  @IsOptional()
  @IsArray()
  @Validate(MetadadosAncorasEstampaValidator)
  metadados?: EstampaMetadadoAncoraDto[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
