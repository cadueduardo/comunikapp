import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  TIPOS_ATIVIDADE,
  TipoAtividade,
} from '../../atividades/dto/atividade.dto';

export class ProspectAtendimentoDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  nome!: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  telefone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(254)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  documento?: string;
}

export class CriarAtendimentoDto {
  @IsString()
  @MinLength(8)
  @MaxLength(200)
  chave_operacao!: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  cliente_id?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ProspectAtendimentoDto)
  prospect?: ProspectAtendimentoDto;

  @IsOptional()
  @IsString()
  @MinLength(1)
  contato_id?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  necessidade!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  descricao?: string;

  @IsOptional()
  @IsIn([
    'telefone',
    'whatsapp_manual',
    'email',
    'presencial',
    'indicacao',
    'outro',
  ])
  origem?: string;

  @IsDateString()
  prazo!: string;

  @IsOptional()
  @IsDateString()
  prazo_desejado?: string;

  @IsOptional()
  @IsIn([...TIPOS_ATIVIDADE])
  tipo_proxima_acao?: TipoAtividade;

  /** Se true, resposta inclui deep-link canônico (sem criar orçamento aqui). */
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  criar_orcamento?: boolean;
}
