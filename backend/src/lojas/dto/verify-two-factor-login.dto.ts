import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class VerifyTwoFactorLoginDto {
  @IsString()
  @IsNotEmpty()
  temporaryToken: string;

  @IsString()
  @Length(6, 6)
  code: string;

  /** Slug esperado do host (Fatia B). */
  @IsString()
  @IsOptional()
  slug?: string;
}
