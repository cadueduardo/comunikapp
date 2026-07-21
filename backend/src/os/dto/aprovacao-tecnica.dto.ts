import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
  ArrayNotEmpty,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MotivoForcarLiberacaoFinanceira } from '../constants/forcar-liberacao-financeira.constants';

/**
 * Prazo individual de um item da OS, enviado pelo modal de aprovacao.
 * Cada serviço/produto da OS pode ter seu proprio par (inicio, fim).
 */
export class PrazoItemAprovacaoDto {
  @IsString()
  item_id: string;

  @IsOptional()
  @IsDateString()
  data_inicio_producao?: string;

  // Em fluxo padrao a data_prazo_produto e obrigatoria por item, mas a
  // validacao final fica no service (porque depende de eFluxoPadrao).
  @IsOptional()
  @IsDateString()
  data_prazo_produto?: string;
}

export class AprovarTecnicaDto {
  @IsBoolean()
  aprovado: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observacoes?: string;

  // Prazos por item da OS, definidos no proprio modal de aprovacao.
  // Em fluxo padrao todos os itens da OS precisam ter data_prazo_produto.
  // Em fluxo retroativo o array pode ser omitido (a OS ja andou).
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrazoItemAprovacaoDto)
  prazos_itens?: PrazoItemAprovacaoDto[];

  /** Se informado, libera apenas estes itens (liberação parcial). */
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  item_ids?: string[];

  /**
   * Override: aprovar tecnicamente mesmo com OS em
   * AGUARDANDO_APROVACAO_FINANCEIRA (entrada não liquidada).
   */
  @IsOptional()
  @IsBoolean()
  forcar_liberacao_financeira?: boolean;

  @ValidateIf((o) => o.forcar_liberacao_financeira === true && o.aprovado)
  @IsEnum(MotivoForcarLiberacaoFinanceira)
  motivo_forcar_financeiro?: MotivoForcarLiberacaoFinanceira;

  /** Obrigatório (mín. 10 no service) quando motivo = OUTRO; opcional nos demais. */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  motivo_forcar_detalhe?: string;
}

export class AgendarInstalacaoDto {
  @IsString()
  data_instalacao: string; // ISO string

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observacoes?: string;
}

export class ItemAprovacaoInfo {
  item_id: string;
  produto_servico: string;
  data_inicio_producao?: Date | null;
  data_prazo_produto?: Date | null;
  status_liberacao_pcp?: string | null;
  responsabilidade_arte?: string | null;
  status_arte?: string | null;
  modo_fulfillment?: string | null;
  personalizacao_modo?: string | null;
  tipo_item?: string | null;
  requer_pcp_fabrica?: boolean;
  elegivel_pcp?: boolean;
  motivos_bloqueio?: string[];
}

export class AprovacaoTecnicaResponseDto {
  id: string;
  status: string;
  aprovacao_tecnica_status: string;
  aprovacao_tecnica_por?: string;
  aprovacao_tecnica_em?: Date;
  aprovacao_tecnica_obs?: string;
  data_instalacao_agendada?: Date;
  observacoes_instalacao?: string;
  // Prazo guarda-chuva da OS (limite global). Cada item pode ter seu proprio
  // prazo individual menor ou igual.
  data_prazo?: Date | null;
  // Lista de itens da OS com seus prazos atuais, para o modal pre-preencher
  // o card de cada servico.
  itens?: ItemAprovacaoInfo[];
  validacoes: {
    estoque_ok: boolean;
    arte_anexada: boolean;
    dados_completos: boolean;
    prazo_viavel: boolean;
    alertas: string[];
  };
}
