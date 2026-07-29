import { admin_role } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateAdminInvitationDto {
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  nome: string;

  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  @MaxLength(320)
  email: string;

  @IsEnum(admin_role)
  role: admin_role;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  mensagem?: string;
}

