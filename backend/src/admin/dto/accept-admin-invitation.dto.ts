import {
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class AcceptAdminInvitationDto {
  @IsString()
  @MinLength(32)
  @MaxLength(256)
  token: string;

  @IsString()
  @MinLength(12, {
    message: 'A senha deve ter no mínimo 12 caracteres.',
  })
  @MaxLength(128, {
    message: 'A senha deve ter no máximo 128 caracteres.',
  })
  password: string;
}

