import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class AprovarTecnicaDto {
  @IsBoolean()
  aprovado: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observacoes?: string;

  // Datas do plano de producao definidas no proprio modal de aprovacao.
  // Sao opcionais no DTO porque a aprovacao retroativa (OS ja avancada no
  // operacional) nao deve forcar o usuario a redefinir prazo. O service
  // exige data_prazo apenas em fluxo padrao.
  @IsOptional()
  @IsDateString()
  data_inicio_prevista?: string;

  @IsOptional()
  @IsDateString()
  data_prazo?: string;
}

export class AgendarInstalacaoDto {
  @IsString()
  data_instalacao: string; // ISO string

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observacoes?: string;
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
  // Prazos atuais para que o modal de aprovacao consiga pre-preencher os
  // campos editaveis (data inicio prevista e data de entrega).
  data_inicio_prevista?: Date | null;
  data_prazo?: Date | null;
  validacoes: {
    estoque_ok: boolean;
    arte_anexada: boolean;
    dados_completos: boolean;
    prazo_viavel: boolean;
    alertas: string[];
  };
}
