import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { StatusInstalacaoOs } from '@prisma/client';

export class ListarOsInstalacaoQueryDto {
  @IsOptional()
  @IsEnum(StatusInstalacaoOs)
  status?: StatusInstalacaoOs;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  busca?: string;
}
