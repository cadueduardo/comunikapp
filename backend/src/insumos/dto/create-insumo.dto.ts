import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsInt,
  Min,
} from 'class-validator';

export class CreateInsumoDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsString()
  @IsNotEmpty()
  categoriaId: string;

  @IsString()
  @IsNotEmpty()
  fornecedorId: string;

  @IsString()
  @IsNotEmpty()
  unidade_medida: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  custo_unitario: number;

  @IsOptional()
  @IsString()
  codigo_interno?: string;
  
  @IsOptional()
  @IsInt()
  @Min(0)
  estoque_minimo?: number;

  @IsOptional()
  @IsString()
  descricao_tecnica?: string;

  @IsOptional()
  @IsString()
  observacoes?: string;
} 