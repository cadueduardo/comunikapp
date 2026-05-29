import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateConviteCadastroDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  validade_dias?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  mensagem?: string;
}
