import { IsString, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateConfiguracoesLojaDto {
  @IsString()
  @IsOptional()
  logo_url?: string;

  @IsString()
  @IsOptional()
  cabecalho_orcamento?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  custo_maodeobra_hora?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  custo_maquinaria_hora?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  custos_indiretos_mensais?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  margem_lucro_padrao?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  impostos_padrao?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  horas_produtivas_mensais?: number;
} 