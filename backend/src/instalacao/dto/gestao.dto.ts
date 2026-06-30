import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { CategoriaOcorrencia, TipoOcorrencia } from '@prisma/client';

export class AtualizarEnderecoLoteDto {
  @IsOptional()
  @IsString()
  @MaxLength(16)
  cep?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  logradouro: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  numero: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  complemento?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  bairro: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  cidade: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2)
  uf: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantidade_alocada?: number;
}

export class RegistrarOcorrenciaGestaoDto {
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
  @Min(0.01)
  quantidade?: number;

  @IsString()
  @MinLength(3)
  @MaxLength(5000)
  descricao: string;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  fotos_evidencia?: string[];
}
