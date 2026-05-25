/**
 * Tipos do endpoint GET /home-operacional/alertas.
 *
 * Catalogo dos alertas iniciais previstos no plano e na Fase 0:
 *   - orcamento_parado (atencao)
 *   - orcamento_aprovado_sem_os (atencao)
 *   - os_aguardando_aprovacao_tecnica (atencao)
 *   - os_liberada_sem_workflow (critico)
 *   - estoque_abaixo_minimo (atencao)
 *   - os_sem_materiais (critico)
 *   - trabalho_pronto_sem_recebimento (atencao) -- implementado na Fase 6.E.
 *
 * Contrato em docs/fase-0-home-operacional/02-contratos-home-operacional.md
 * secao 6.
 */

export type NivelAlerta = 'critico' | 'atencao' | 'informativo';

export type OrigemAlerta =
  | 'orcamentos'
  | 'os'
  | 'estoque'
  | 'financeiro'
  | 'pcp';

export interface AcaoAlertaLink {
  tipo: 'link';
  label: string;
  href: string;
}

export interface AcaoAlertaEndpoint {
  tipo: 'endpoint';
  label: string;
  metodo: 'POST' | 'PATCH' | 'GET';
  endpoint: string;
}

export type AcaoAlerta = AcaoAlertaLink | AcaoAlertaEndpoint;

export interface Alerta {
  // Identificador estavel para o front poder dispensar/animar sem flicker.
  // Usa prefixo da categoria + chave da entidade (ex.: orcamento_parado_orc_120).
  id: string;
  nivel: NivelAlerta;
  titulo: string;
  descricao?: string;
  origem: OrigemAlerta;
  criado_em: string; // ISO-8601
  acao?: AcaoAlerta;
}

export interface AlertasPorNivel {
  critico: number;
  atencao: number;
  informativo: number;
}

export interface AlertasResponseData {
  total: number;
  por_nivel: AlertasPorNivel;
  alertas: Alerta[];
}
