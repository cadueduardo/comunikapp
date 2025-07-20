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

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  horas_producao: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  quantidade_produto?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemCalculoDto)
  itens: ItemCalculoDto[];

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

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MaquinaCalculoDto)
  maquinas?: MaquinaCalculoDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => FuncaoCalculoDto)
  funcoes?: FuncaoCalculoDto[];
} 