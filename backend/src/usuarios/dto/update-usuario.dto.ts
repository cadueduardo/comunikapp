import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { usuario_funcao, usuario_status } from '@prisma/client';

export class UpdateUsuarioDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  nome_completo?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  telefone?: string;

  @IsOptional()
  @IsEnum(usuario_funcao)
  funcao?: usuario_funcao;

  @IsOptional()
  @IsEnum(usuario_status)
  status?: usuario_status;
}


