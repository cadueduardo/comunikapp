import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { CategoriaOcorrencia, TipoOcorrencia } from '@prisma/client';

export class ConcluirLoteInstaladorDto {
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  fotos_evidencia?: string[];

  @IsOptional()
  @IsUrl()
  assinatura_url?: string;
}

export class RegistrarOcorrenciaInstaladorDto {
  @IsString()
  @IsNotEmpty()
  os_id: string;

  @IsOptional()
  @IsString()
  item_instalacao_id?: string;

  @IsEnum(TipoOcorrencia)
  tipo: TipoOcorrencia;

  @IsOptional()
  @IsEnum(CategoriaOcorrencia)
  categoria?: CategoriaOcorrencia;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  quantidade?: number;

  @IsString()
  @MinLength(3)
  @MaxLength(5000)
  descricao: string;
}
