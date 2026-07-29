import { IsString, MaxLength, MinLength } from 'class-validator';

export class ValidateAdminInvitationDto {
  @IsString()
  @MinLength(32)
  @MaxLength(256)
  token: string;
}

