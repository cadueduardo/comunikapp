import { IsString, IsNumber, IsOptional, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMaquinaDto {
  @IsString()
  nome: string;

  @IsString()
  @IsIn(['PLOTTER', 'ROUTER', 'IMPRESSORA', 'CORTE', 'OUTROS'])
  tipo: string;

  @IsNumber()
  @Type(() => Number)
  custo_hora: number;

  @IsString()
  @IsIn(['ATIVA', 'MANUTENCAO', 'INATIVA'])
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  capacidade?: string;

  @IsString()
  @IsOptional()
  observacoes?: string;
} 