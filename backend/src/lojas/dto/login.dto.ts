import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsOptional()
  captchaToken?: string;

  /** Slug esperado do host `{slug}.comunikapp.com.br` (omitido no apex). */
  @IsString()
  @IsOptional()
  slug?: string;
}
