import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CalcularItemProdutoDto {
  @IsString()
  insumo_id: string;

  @IsNumber()
  @Min(0.001)
  quantidade: number;
}

export class CalcularMaquinaProdutoDto {
  @IsString()
  maquina_id: string;

  @IsNumber()
  @Min(0)
  horas_utilizadas: number;
}

export class CalcularFuncaoProdutoDto {
  @IsString()
  funcao_id: string;

  @IsNumber()
  @Min(0)
  horas_trabalhadas: number;
}

export class CalcularProdutoDto {
  @IsString()
  @MaxLength(255)
  nome_servico: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  descricao?: string;

  @IsNumber()
  @Min(0)
  horas_producao: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  quantidade_produto?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CalcularItemProdutoDto)
  itens: CalcularItemProdutoDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CalcularMaquinaProdutoDto)
  maquinas?: CalcularMaquinaProdutoDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CalcularFuncaoProdutoDto)
  funcoes?: CalcularFuncaoProdutoDto[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  margem_lucro_customizada?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  impostos_customizados?: number;
}
