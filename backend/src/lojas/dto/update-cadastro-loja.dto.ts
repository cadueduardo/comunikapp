import {
  IsString,
  IsOptional,
  IsEmail,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';

/**
 * Cadastro / identidade / endereço / slug da loja (pré-NF).
 * Separado dos parâmetros de negócio (margem/impostos).
 */
export class UpdateCadastroLojaDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(191)
  nome?: string;

  @IsOptional()
  @IsString()
  @MaxLength(191)
  razao_social?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(191)
  nome_fantasia?: string | null;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  telefone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  cnpj?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  cpf?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  inscricao_estadual?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  inscricao_municipal?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(48)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message:
      'Slug inválido. Use apenas letras minúsculas, números e hífens (3–48 caracteres).',
  })
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  cep?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(191)
  logradouro?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  numero?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(191)
  complemento?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(191)
  bairro?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(191)
  cidade?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  uf?: string | null;
}
