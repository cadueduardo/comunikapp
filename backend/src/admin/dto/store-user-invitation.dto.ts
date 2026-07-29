import { usuario_funcao } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateStoreUserInvitationDto {
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  nome!: string;

  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  @MaxLength(320)
  email!: string;

  @IsEnum(usuario_funcao)
  funcao!: usuario_funcao;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  telefone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  mensagem?: string;

  /** Obrigatório quando a loja não está ATIVA e o ator é SUPER_ADMIN. */
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(1000)
  exceptionReason?: string;
}

export class UpdateStoreUserInvitationDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  nome?: string;

  @IsOptional()
  @IsEnum(usuario_funcao)
  funcao?: usuario_funcao;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  telefone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  mensagem?: string;
}

export class ValidateStoreUserInvitationDto {
  @IsString()
  @MinLength(32)
  @MaxLength(256)
  token!: string;
}

export class AcceptStoreUserInvitationDto {
  @IsString()
  @MinLength(32)
  @MaxLength(256)
  token!: string;

  @IsString()
  @MinLength(12, {
    message: 'A senha deve ter no mínimo 12 caracteres.',
  })
  @MaxLength(128, {
    message: 'A senha deve ter no máximo 128 caracteres.',
  })
  password!: string;
}
