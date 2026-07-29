import {
  IsJWT,
  IsString,
  Matches,
} from 'class-validator';

export class ConfirmAdminTwoFactorDto {
  @IsJWT({ message: 'Token de configuração inválido.' })
  setupToken: string;

  @IsString()
  @Matches(/^\d{6}$/, { message: 'O código 2FA deve ter 6 dígitos.' })
  code: string;
}
