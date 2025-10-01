import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class AprovarTecnicaDto {
  @IsBoolean()
  aprovado: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observacoes?: string;
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
  validacoes: {
    estoque_ok: boolean;
    arte_anexada: boolean;
    dados_completos: boolean;
    prazo_viavel: boolean;
    alertas: string[];
  };
}
