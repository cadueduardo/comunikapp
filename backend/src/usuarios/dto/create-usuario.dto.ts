import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
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

  /**
   * Obrigatória na criação pela loja. Convites sem senha (link por e-mail)
   * passam exclusivamente pela Gestão ComunikApp (`store_user_invitation`).
   */
  @IsString()
  @MinLength(8, {
    message: 'A senha deve ter no mínimo 8 caracteres.',
  })
  senha!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @Matches(/^[a-z0-9_-]+$/i, { each: true })
  perfilIds?: string[];
}
