import { IsString, IsEmail, IsEnum, IsOptional, IsNotEmpty } from 'class-validator';
import { TipoPessoa, StatusCliente } from '@prisma/client';

export class CreateClienteDto {
  @IsNotEmpty()
  @IsString()
  nome: string;

  @IsEnum(TipoPessoa)
  tipo_pessoa: TipoPessoa;

  @IsNotEmpty()
  @IsString()
  documento: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  telefone?: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;

  @IsOptional()
  @IsString()
  cep?: string;

  @IsOptional()
  @IsString()
  endereco?: string;

  @IsOptional()
  @IsString()
  numero?: string;

  @IsOptional()
  @IsString()
  complemento?: string;

  @IsOptional()
  @IsString()
  bairro?: string;

  @IsOptional()
  @IsString()
  cidade?: string;

  @IsOptional()
  @IsString()
  estado?: string;

  @IsOptional()
  @IsString()
  razao_social?: string;

  @IsOptional()
  @IsString()
  nome_fantasia?: string;

  @IsOptional()
  @IsString()
  inscricao_estadual?: string;

  @IsOptional()
  @IsString()
  responsavel?: string;

  @IsOptional()
  @IsString()
  cargo_responsavel?: string;

  @IsOptional()
  @IsString()
  observacoes?: string;

  @IsOptional()
  @IsEnum(StatusCliente)
  status_cliente?: StatusCliente;

  @IsOptional()
  @IsString()
  origem?: string;

  @IsOptional()
  @IsString()
  segmento?: string;
} 