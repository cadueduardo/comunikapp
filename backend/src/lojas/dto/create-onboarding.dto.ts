import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
} from 'class-validator';

export class CreateOnboardingDto {
  @IsString()
  @IsNotEmpty()
  nome_loja: string;

  @IsString()
  @IsNotEmpty()
  nome_responsavel: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  telefone: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  cpf?: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  cnpj?: string;

  @IsString()
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres.' })
  @MaxLength(128, { message: 'A senha deve ter no máximo 128 caracteres.' })
  senha: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty({ message: 'Informe o codigo de convite.' })
  @MaxLength(128, {
    message: 'O codigo de convite deve ter no maximo 128 caracteres.',
  })
  codigo_convite?: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty({ message: 'Informe o token de convite.' })
  @MaxLength(256, {
    message: 'O token de convite deve ter no maximo 256 caracteres.',
  })
  token_convite?: string;
}
