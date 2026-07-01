import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class RegistrarLinkArteDto {
  @IsUrl({ require_protocol: true }, { message: 'URL inválida' })
  @MaxLength(2048)
  url: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  descricao?: string;
}
