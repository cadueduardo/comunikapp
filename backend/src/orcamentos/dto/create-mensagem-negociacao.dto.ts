import { IsString, IsOptional, IsEnum } from 'class-validator';

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
  observacoes?: string;
} 