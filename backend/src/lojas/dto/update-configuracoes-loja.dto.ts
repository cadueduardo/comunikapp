import { IsString, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateConfiguracoesLojaDto {
  @IsString()
  @IsOptional()
  logo_url?: string;

  @IsString()
  @IsOptional()
  cabecalho_orcamento?: string;



  @IsString()
  @IsOptional()
  custo_maquinaria_hora?: string;

  @IsString()
  @IsOptional()
  custos_indiretos_mensais?: string;

  @IsString()
  @IsOptional()
  margem_lucro_padrao?: string;

  @IsString()
  @IsOptional()
  impostos_padrao?: string;

  @IsString()
  @IsOptional()
  horas_produtivas_mensais?: string;
} 