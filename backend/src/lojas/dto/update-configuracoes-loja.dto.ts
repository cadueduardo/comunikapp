import { IsString, IsOptional, IsNumber } from 'class-validator';

export class UpdateConfiguracoesLojaDto {
  @IsString()
  @IsOptional()
  logo_url?: string;

  @IsString()
  @IsOptional()
  cabecalho_orcamento?: string;

  @IsNumber()
  @IsOptional()
  custo_maodeobra_hora?: number;

  @IsNumber()
  @IsOptional()
  custo_maquinaria_hora?: number;

  @IsNumber()
  @IsOptional()
  custos_indiretos_mensais?: number;

  @IsNumber()
  @IsOptional()
  margem_lucro_padrao?: number;

  @IsNumber()
  @IsOptional()
  impostos_padrao?: number;
} 