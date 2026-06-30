import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class BetaFeedbackDto {
  @IsString()
  @IsNotEmpty({ message: 'Descreva o problema encontrado.' })
  @MaxLength(4000, {
    message: 'A descricao deve ter no maximo 4000 caracteres.',
  })
  descricao: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000, {
    message: 'A expectativa deve ter no maximo 2000 caracteres.',
  })
  expectativa?: string;

  @IsString()
  @IsNotEmpty({ message: 'Informe a pagina acessada.' })
  @MaxLength(2048, {
    message: 'A URL da pagina deve ter no maximo 2048 caracteres.',
  })
  pagina_url: string;

  @IsString()
  @IsNotEmpty({ message: 'Informe a rota da pagina.' })
  @MaxLength(512, {
    message: 'A rota da pagina deve ter no maximo 512 caracteres.',
  })
  pagina_path: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  pagina_titulo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  versao_plataforma?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  user_agent?: string;
}
