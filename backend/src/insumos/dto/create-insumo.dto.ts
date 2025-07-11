import { IsString, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateInsumoDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsString()
  @IsNotEmpty()
  unidade_medida: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  custo_por_unidade: number;

  @IsOptional()
  @IsString()
  fornecedor?: string;

  @IsOptional()
  @IsString()
  observacoes?: string;
} 