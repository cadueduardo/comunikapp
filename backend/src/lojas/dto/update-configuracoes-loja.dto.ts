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

  /** Comissão padrão do vendedor (%) aplicada em novos orçamentos. Use 0 para desativar. */
  @IsString()
  @IsOptional()
  comissao_padrao?: string;

  @IsString()
  @IsOptional()
  horas_produtivas_mensais?: string;

  /** Tipo de aplicação da margem de lucro: 'markup' (por fora) ou 'margem_por_dentro' (por dentro). Padrão da loja. */
  @IsString()
  @IsOptional()
  tipo_margem_lucro?: string;
}
