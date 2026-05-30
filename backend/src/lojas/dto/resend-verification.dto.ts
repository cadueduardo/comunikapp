import { IsEmail } from 'class-validator';

export class ResendVerificationDto {
  @IsEmail({}, { message: 'Informe um e-mail valido.' })
  email: string;
}
