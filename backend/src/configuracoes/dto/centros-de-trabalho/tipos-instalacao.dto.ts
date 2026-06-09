import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

const emptyToUndefined = ({ value }: { value: unknown }) =>
  value === '' || value === null ? undefined : value;

const regrasCobrancaInstalacao = [
  'FIXO',
  'POR_M2',
  'POR_ML',
  'POR_UNIDADE',
  'POR_HORA',
  'MANUAL',
] as const;

export class CreateTipoInstalacaoDto {
  @IsString()
  @Length(1, 100)
  nome: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  descricao?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value ?? true)
  ativo?: boolean;

  @IsOptional()
  @IsString()
  @IsIn(regrasCobrancaInstalacao)
  @Transform(({ value }) => value || 'FIXO')
  regra_cobranca?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999999.99)
  @Type(() => Number)
  @Transform(emptyToUndefined)
  preco_padrao?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999999.99)
  @Type(() => Number)
  @Transform(emptyToUndefined)
  custo_mao_obra_padrao?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999999.99)
  @Type(() => Number)
  @Transform(emptyToUndefined)
  custo_deslocamento_padrao?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10080)
  @Type(() => Number)
  @Transform(emptyToUndefined)
  tempo_estimado_min?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(99)
  @Type(() => Number)
  @Transform(emptyToUndefined)
  quantidade_pessoas_padrao?: number;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value ?? true)
  exige_endereco?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value ?? false)
  exige_agendamento?: boolean;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  observacoes_padrao?: string;
}

export class UpdateTipoInstalacaoDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  nome?: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  descricao?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @IsOptional()
  @IsString()
  @IsIn(regrasCobrancaInstalacao)
  regra_cobranca?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999999.99)
  @Type(() => Number)
  @Transform(emptyToUndefined)
  preco_padrao?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999999.99)
  @Type(() => Number)
  @Transform(emptyToUndefined)
  custo_mao_obra_padrao?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999999.99)
  @Type(() => Number)
  @Transform(emptyToUndefined)
  custo_deslocamento_padrao?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10080)
  @Type(() => Number)
  @Transform(emptyToUndefined)
  tempo_estimado_min?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(99)
  @Type(() => Number)
  @Transform(emptyToUndefined)
  quantidade_pessoas_padrao?: number;

  @IsOptional()
  @IsBoolean()
  exige_endereco?: boolean;

  @IsOptional()
  @IsBoolean()
  exige_agendamento?: boolean;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  observacoes_padrao?: string;
}
