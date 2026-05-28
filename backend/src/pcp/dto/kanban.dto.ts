import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsDateString,
  Min,
  Max,
  Length,
} from 'class-validator';
import { Transform } from 'class-transformer';

export enum StatusSetorProdutivo {
  PENDENTE = 'PENDENTE',
  EM_ANDAMENTO = 'EM_ANDAMENTO',
  CONCLUIDA = 'CONCLUIDA',
  PAUSADA = 'PAUSADA',
  CANCELADA = 'CANCELADA',
}

export enum TipoApontamento {
  INICIO = 'INICIO',
  PAUSA = 'PAUSA',
  RETOMADA = 'RETOMADA',
  CONCLUSAO = 'CONCLUSAO',
  REFUGO = 'REFUGO',
}

export class IniciarProducaoDto {
  @IsString()
  operadorId: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  observacoes?: string;
}

export class ConcluirEtapaDto {
  @IsString()
  operadorId: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  observacoes?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(999999)
  quantidadeProduzida?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(999999)
  quantidadeRefugo?: number;
}

export class PausarProducaoDto {
  @IsString()
  operadorId: string;

  @IsString()
  @Length(1, 200)
  motivo: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  observacoes?: string;
}

export class KanbanQueryDto {
  @IsOptional()
  @IsString()
  setorId?: string;

  @IsOptional()
  @IsEnum(StatusSetorProdutivo)
  status?: StatusSetorProdutivo;

  @IsOptional()
  @IsString()
  operadorId?: string;

  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @IsOptional()
  @IsDateString()
  dataFim?: string;
}

export enum StatusKanbanOS {
  FILA = 'FILA',
  PRODUCAO = 'PRODUCAO',
  CONCLUIDA = 'CONCLUIDA',
  REJEITADA = 'REJEITADA',
}

export class AtualizarStatusOSDto {
  @IsEnum(StatusKanbanOS)
  status: StatusKanbanOS;
}
