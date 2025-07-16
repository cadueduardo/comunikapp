import { IsString, IsEnum, IsOptional } from 'class-validator';

export enum AcaoCliente {
  APROVAR = 'APROVAR',
  REJEITAR = 'REJEITAR',
  NEGOCIAR = 'NEGOCIAR',
}

export class AcaoClienteDto {
  @IsEnum(AcaoCliente)
  acao: AcaoCliente;

  @IsString()
  @IsOptional()
  observacoes?: string;
} 