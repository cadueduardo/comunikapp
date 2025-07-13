import { IsString, IsOptional, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateItemOrcamentoDto {
  @IsString()
  insumo_id: string;

  @IsNumber()
  @Type(() => Number)
  quantidade: number;
}

export class CreateOrcamentoDto {
  @IsString()
  nome_servico: string;

  @IsString()
  @IsOptional()
  descricao?: string;

  @IsNumber()
  @Type(() => Number)
  horas_producao: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateItemOrcamentoDto)
  itens: CreateItemOrcamentoDto[];

  @IsString()
  @IsOptional()
  cliente_id?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  margem_lucro_customizada?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  impostos_customizados?: number;
} 