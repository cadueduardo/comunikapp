import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { StatusFinanceiroOcorrencia } from '@prisma/client';

export class FilaPrecificacaoQueryDto {
  @IsOptional()
  @IsEnum(StatusFinanceiroOcorrencia)
  status?: StatusFinanceiroOcorrencia;

  @IsOptional()
  @IsString()
  busca?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pagina?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  por_pagina?: number = 25;
}
