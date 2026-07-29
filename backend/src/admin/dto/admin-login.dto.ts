import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class AdminLoginDto {
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  @MaxLength(320)
  email: string;

  @IsString()
  @MinLength(1, { message: 'Informe a senha.' })
  @MaxLength(128)
  password: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{6}$/, { message: 'O código 2FA deve ter 6 dígitos.' })
  twoFactorCode?: string;
}

