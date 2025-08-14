import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { FuncaoUsuario, StatusConta } from '@prisma/client';

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
  @IsEnum(FuncaoUsuario)
  funcao?: FuncaoUsuario;

  @IsOptional()
  @IsEnum(StatusConta)
  status?: StatusConta;
}


