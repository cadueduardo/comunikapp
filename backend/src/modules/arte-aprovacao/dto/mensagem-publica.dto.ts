import { IsString, IsOptional } from 'class-validator';

export class CreateMensagemPublicoDto {
  @IsString()
  versao_id: string;

  @IsString()
  mensagem: string;

  @IsOptional()
  @IsString()
  produto_id?: string;

  @IsOptional()
  @IsString()
  autor_nome?: string;

  @IsOptional()
  @IsString()
  autor_email?: string;
}
