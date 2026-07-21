import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class EstornarPagamentoDto {
  @IsString()
  @IsNotEmpty({ message: 'motivo é obrigatório para estorno' })
  @MaxLength(2000)
  motivo: string;

  @IsOptional()
  @IsString()
  @MaxLength(191)
  chave_idempotente?: string;
}
