import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class InteresseBetaDto {
  @IsString()
  @IsNotEmpty({ message: 'Informe seu nome.' })
  @MaxLength(255, { message: 'O nome deve ter no maximo 255 caracteres.' })
  nome: string;

  @IsEmail({}, { message: 'Informe um e-mail valido.' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Informe seu telefone.' })
  @MaxLength(32, { message: 'O telefone deve ter no maximo 32 caracteres.' })
  telefone: string;

  @IsString()
  @IsNotEmpty({ message: 'Informe o nome da sua empresa ou loja.' })
  @MaxLength(255, {
    message: 'O nome da loja deve ter no maximo 255 caracteres.',
  })
  nome_loja: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  captchaToken?: string;
}
