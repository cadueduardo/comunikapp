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
}
