import { StatusOrdemTerceirizacao } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class AtualizarStatusTerceirizacaoDto {
  @IsEnum(StatusOrdemTerceirizacao)
  status: StatusOrdemTerceirizacao;

  @IsOptional()
  @IsString()
  @MaxLength(50000)
  observacoes?: string;
}
