import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { CampoVariavelTipo } from '@prisma/client';

export class CampoVariavelDefDto {
  @ApiProperty({ example: 'nome', description: 'Chave estável (snake_case)' })
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  @Matches(/^[a-z][a-z0-9_]*$/, {
    message: 'chave deve iniciar com letra minúscula e usar snake_case',
  })
  chave: string;

  @ApiProperty({ example: 'Nome' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  label: string;

  @ApiProperty({ enum: CampoVariavelTipo, default: CampoVariavelTipo.TEXTO })
  @IsEnum(CampoVariavelTipo)
  tipo: CampoVariavelTipo;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  obrigatorio?: boolean;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  max_caracteres?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  fonte_sugerida?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  ordem?: number;

  @ApiPropertyOptional({ example: 'Digite o nome' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  placeholder?: string;
}
