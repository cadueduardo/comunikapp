import { TipoFornecedor } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateFornecedoreDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(191)
  nome: string;

  @IsOptional()
  @IsString()
  @MaxLength(191)
  razao_social?: string;

  @IsOptional()
  @IsString()
  @MaxLength(191)
  cnpj_cpf?: string;

  @IsOptional()
  @IsEnum(TipoFornecedor)
  tipo?: TipoFornecedor;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(191)
  contato_nome?: string;

  @IsOptional()
  @IsString()
  @MaxLength(191)
  telefone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(191)
  whatsapp?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(191)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(191)
  cep?: string;

  @IsOptional()
  @IsString()
  @MaxLength(191)
  endereco?: string;

  @IsOptional()
  @IsString()
  @MaxLength(191)
  numero?: string;

  @IsOptional()
  @IsString()
  @MaxLength(191)
  complemento?: string;

  @IsOptional()
  @IsString()
  @MaxLength(191)
  bairro?: string;

  @IsOptional()
  @IsString()
  @MaxLength(191)
  cidade?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  estado?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  especialidades?: string[];
}
