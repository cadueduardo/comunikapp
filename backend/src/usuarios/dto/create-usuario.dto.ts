import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { FuncaoUsuario } from '@prisma/client';

export class CreateUsuarioDto {
  @IsString()
  @MinLength(3)
  nome_completo!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  telefone?: string;

  @IsEnum(FuncaoUsuario)
  funcao!: FuncaoUsuario;

  @IsString()
  loja_id!: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  senha?: string;
}


