import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { CampoVariavelDefDto } from './campo-variavel-def.dto';

export class CreateConjuntoCamposDto {
  @ApiProperty({ example: 'Nome + Mensagem' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nome: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @ApiProperty({ type: [CampoVariavelDefDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CampoVariavelDefDto)
  campos: CampoVariavelDefDto[];
}
