import { IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyTwoFactorLoginDto {
  @IsString()
  @IsNotEmpty()
  temporaryToken: string;

  @IsString()
  @Length(6, 6)
  code: string;
}
