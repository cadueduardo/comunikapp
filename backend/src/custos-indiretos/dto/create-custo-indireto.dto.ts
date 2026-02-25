import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateCustoIndiretoDto {
  @IsString()
  nome: string;

  @IsString()
  categoria: string;

  @IsNumber()
  valor_mensal: number;

  @IsOptional()
  @IsString()
  descricao?: string; // Será mapeado para observacoes no serviço

  /** Setor ao qual o custo pertence. Se vazio, custo geral (rateado entre setores) */
  @IsOptional()
  @IsString()
  setor_id?: string;
}
