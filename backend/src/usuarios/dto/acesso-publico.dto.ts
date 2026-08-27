import { IsEmail, IsString, Length, MinLength } from 'class-validator';

export class ReenviarCodigoDto {
  @IsEmail()
  email!: string;
}

export class DefinirSenhaInicialDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(6, 6)
  codigo!: string;

  @IsString()
  @MinLength(8, { message: 'A senha deve ter no mínimo 8 caracteres.' })
  senha!: string;
}

export class SolicitarRedefinicaoSenhaDto {
  @IsEmail()
  email!: string;
}

export class RedefinirSenhaDto {
  @IsString()
  @MinLength(16)
  token!: string;

  @IsString()
  @MinLength(8, { message: 'A senha deve ter no mínimo 8 caracteres.' })
  senha!: string;
}
