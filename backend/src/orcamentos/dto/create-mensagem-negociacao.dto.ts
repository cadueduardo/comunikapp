import { IsString, IsOptional, IsEnum, IsBoolean, IsArray } from 'class-validator';

export enum TipoMensagem {
  CLIENTE = 'CLIENTE',
  VENDEDOR = 'VENDEDOR',
  SISTEMA = 'SISTEMA'
}

export class CreateMensagemNegociacaoDto {
  @IsString()
  mensagem: string;

  @IsEnum(TipoMensagem)
  tipo: TipoMensagem;

  @IsOptional()
  @IsString()
  autor_nome?: string;

  @IsOptional()
  @IsString()
  autor_email?: string;

  @IsOptional()
  @IsBoolean()
  visualizada?: boolean;

  @IsOptional()
  @IsArray()
  anexos?: string[]; // Array de URLs de arquivos

  @IsOptional()
  @IsString()
  observacoes?: string;
} 