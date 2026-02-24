import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { usuario_funcao } from '@prisma/client';

export class CreateUsuarioDto {
  @IsString()
  @MinLength(3)
  nome_completo!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  telefone?: string;

  @IsEnum(usuario_funcao)
  funcao!: usuario_funcao;

  @IsString()
  loja_id!: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  senha?: string;
}
