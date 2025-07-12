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
} 