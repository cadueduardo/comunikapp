import { IsString, IsNotEmpty, IsArray, IsNumber, IsPositive, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ItemCalculoDto {
  @IsString()
  @IsNotEmpty()
  insumo_id: string;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  quantidade: number;
}

export class MaquinaCalculoDto {
  @IsString()
  @IsNotEmpty()
  maquina_id: string;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  horas_utilizadas: number;
}

export class FuncaoCalculoDto {
  @IsString()
  @IsNotEmpty()
  funcao_id: string;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  horas_trabalhadas: number;
}

export class CalcularOrcamentoDto {
  @IsString()
  @IsNotEmpty()
  nome_servico: string;

  @IsString()
  @IsOptional()
  descricao?: string;

  // Medidas do produto
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  largura_produto?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  altura_produto?: number;

  @IsString()
  @IsOptional()
  unidade_medida_produto?: string; // "mm", "cm", "m", "m2", etc.

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  area_produto?: number; // Área em m² calculada automaticamente

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemCalculoDto)
  itens: ItemCalculoDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MaquinaCalculoDto)
  maquinas: MaquinaCalculoDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FuncaoCalculoDto)
  funcoes: FuncaoCalculoDto[];

  @IsString()
  @IsOptional()
  cliente_id?: string;

  // Parâmetros opcionais para sobrescrever configurações padrão da loja
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  margem_lucro_customizada?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  impostos_customizados?: number;

  // Flag para simulação de cenários
  @IsOptional()
  modo_simulacao?: boolean;
} 