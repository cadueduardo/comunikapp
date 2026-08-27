import { Transform } from 'class-transformer';
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
   * Se omitida, a loja envia convite: o convidado define a senha em
   * `/primeiro-acesso`. Convites da Gestão ComunikApp continuam em
   * `store_user_invitation`.
   */
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value,
  )
  @IsString()
  @MinLength(8, {
    message: 'A senha deve ter no mínimo 8 caracteres.',
  })
  senha?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @Matches(/^[a-z0-9_-]+$/i, { each: true })
  perfilIds?: string[];
}
