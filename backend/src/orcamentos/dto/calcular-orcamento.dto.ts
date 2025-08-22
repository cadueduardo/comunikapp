import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsNumber,
  IsPositive,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ItemCalculoDto {
  @ApiProperty({ description: 'ID do insumo (item) utilizado no orçamento' })
  @IsString()
  @IsNotEmpty()
  insumo_id: string;

  @ApiProperty({ description: 'Quantidade utilizada do insumo', example: 1 })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  quantidade: number;

  // Campos opcionais para lógica personalizada
  @ApiPropertyOptional({ description: 'Área do produto em m², quando aplicável', example: 1.2 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  area_produto?: number;

  @ApiPropertyOptional({ description: 'Largura do produto na unidade informada', example: 100 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  largura_produto?: number;

  @ApiPropertyOptional({ description: 'Altura do produto na unidade informada', example: 120 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  altura_produto?: number;
}

export class MaquinaCalculoDto {
  @ApiProperty({ description: 'ID da máquina usada no orçamento' })
  @IsString()
  @IsNotEmpty()
  maquina_id: string;

  @ApiPropertyOptional({ description: 'Horas utilizadas na máquina (se omitido, usa automação)', example: 0.5 })
  @IsNumber()
  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  horas_utilizadas?: number;
}

export class FuncaoCalculoDto {
  @ApiProperty({ description: 'ID da função/mão de obra usada no orçamento' })
  @IsString()
  @IsNotEmpty()
  funcao_id: string;

  @ApiPropertyOptional({ description: 'Horas trabalhadas (se omitido, usa automação)', example: 0.5 })
  @IsNumber()
  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  horas_trabalhadas?: number;
}

export class CalcularOrcamentoDto {
  @ApiProperty({ description: 'Nome do serviço/produto cotado' })
  @IsString()
  @IsNotEmpty()
  nome_servico: string;

  @ApiPropertyOptional({ description: 'Descrição do serviço' })
  @IsString()
  @IsOptional()
  descricao?: string;

  @ApiProperty({ description: 'Horas de produção base informadas' })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  horas_producao: number;

  @ApiPropertyOptional({ description: 'Quantidade de produtos/serviços', example: 2 })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  quantidade_produto?: number;

  @ApiProperty({ description: 'Lista de materiais (insumos) do orçamento', type: [ItemCalculoDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemCalculoDto)
  itens: ItemCalculoDto[];

  @ApiPropertyOptional({ description: 'Cliente associado (ID)', example: 'cli_123' })
  @IsString()
  @IsOptional()
  cliente_id?: string;

  // Parâmetros opcionais para sobrescrever configurações padrão da loja
  @ApiPropertyOptional({ description: 'Margem de lucro (percentual)', example: 20 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  margem_lucro_customizada?: number;

  @ApiPropertyOptional({ description: 'Impostos (percentual)', example: 25 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  impostos_customizados?: number;

  @ApiPropertyOptional({ description: 'Máquinas envolvidas no orçamento', type: [MaquinaCalculoDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MaquinaCalculoDto)
  maquinas?: MaquinaCalculoDto[];

  @ApiPropertyOptional({ description: 'Funções/mão de obra do orçamento', type: [FuncaoCalculoDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => FuncaoCalculoDto)
  funcoes?: FuncaoCalculoDto[];
}
