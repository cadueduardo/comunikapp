import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export const TIPOS_ATIVIDADE = [
  'retorno',
  'follow_up',
  'ligacao',
  'visita',
  'proposta',
  'demanda',
  'outro',
] as const;

export type TipoAtividade = (typeof TIPOS_ATIVIDADE)[number];

export const ORIGENS_ATIVIDADE = [
  'telefone',
  'whatsapp_manual',
  'email',
  'presencial',
  'indicacao',
  'outro',
] as const;

export class CriarAtividadeDto {
  @IsIn([...TIPOS_ATIVIDADE])
  tipo!: TipoAtividade;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  titulo!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  descricao?: string;

  @IsDateString()
  prazo!: string;

  @IsOptional()
  @IsDateString()
  prazo_desejado?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  origem?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  cliente_id?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  orcamento_id?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  contato_id?: string;

  /** Só gestor com GERENCIAR pode atribuir a outro. */
  @IsOptional()
  @IsString()
  @MinLength(1)
  responsavel_id?: string;
}

export class AtualizarAtividadeDto {
  @IsOptional()
  @IsIn([...TIPOS_ATIVIDADE])
  tipo?: TipoAtividade;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  titulo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  descricao?: string | null;

  @IsOptional()
  @IsDateString()
  prazo?: string;

  @IsOptional()
  @IsDateString()
  prazo_desejado?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  origem?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(1)
  responsavel_id?: string;
}

export class ListarAtividadesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;

  @IsOptional()
  @IsIn(['abertas', 'concluidas', 'todas'])
  status?: 'abertas' | 'concluidas' | 'todas' = 'abertas';

  @IsOptional()
  @IsString()
  responsavel_id?: string;

  @IsOptional()
  @IsString()
  cliente_id?: string;
}
