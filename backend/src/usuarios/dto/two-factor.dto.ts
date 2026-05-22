import { IsNotEmpty, IsString, Length } from 'class-validator';

export class ConfirmTwoFactorDto {
  @IsString()
  @Length(6, 6)
  code: string;
}

export class DisableTwoFactorDto {
  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @Length(6, 6)
  code: string;
}
