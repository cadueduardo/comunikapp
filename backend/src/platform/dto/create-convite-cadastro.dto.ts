import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateConviteCadastroDto {
  @IsString()
  @IsNotEmpty({ message: 'Informe o nome do convidado.' })
  @MaxLength(255, { message: 'O nome deve ter no maximo 255 caracteres.' })
  nome: string;

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
