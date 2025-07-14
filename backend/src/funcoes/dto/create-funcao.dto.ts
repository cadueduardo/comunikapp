import { IsString, IsOptional, IsNumber, IsUUID } from 'class-validator';

export class CreateFuncaoDto {
  @IsString()
  nome: string;

  @IsNumber()
  custo_hora: number;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsString()
  maquina_id?: string;
} 