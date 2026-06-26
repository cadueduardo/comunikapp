import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { StatusExpedicao } from '../enums/status-expedicao.enum';
import { ModalidadeExpedicao } from '../enums/modalidade-expedicao.enum';

export class ListarExpedicaoQueryDto {
  @IsOptional()
  @IsEnum(StatusExpedicao)
  status?: StatusExpedicao;

  @IsOptional()
  @IsEnum(ModalidadeExpedicao)
  modalidade?: ModalidadeExpedicao;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  busca?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  incluir_arquivados?: boolean;
}

export class AtualizarExpedicaoDto {
  @IsOptional()
  @IsEnum(ModalidadeExpedicao)
  modalidade?: ModalidadeExpedicao;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  codigo_rastreio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  observacoes?: string;
}

export class AtualizarStatusExpedicaoDto {
  @IsEnum(StatusExpedicao)
  status!: StatusExpedicao;
}

export class ConcluirEntregaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  recebedor_nome!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  recebedor_doc?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  url_assinatura?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  observacoes?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  override_financeiro?: boolean;

  @ValidateIf((dto) => dto.override_financeiro === true)
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(500)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  motivo_override_financeiro?: string;
}

export class DevolverProducaoDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(2000)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  motivo!: string;
}

export class ArquivarExpedicaoDto {
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  observacoes?: string;
}

export class TransformarTemplateDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  nome!: string;
}
