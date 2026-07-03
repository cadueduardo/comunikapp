export type StatusFinanceiroOcorrencia =
  | 'PENDENTE_PRECIFICACAO'
  | 'PRECIFICADO'
  | 'FATURADO'
  | 'ABONADO'
  | 'CANCELADO';

export type StatusInstalacaoOs =
  | 'EM_ANDAMENTO'
  | 'AGUARDANDO_RELATORIO_TECNICO'
  | 'CONCLUIDA';

export interface OsInstalacaoGridProgresso {
  concluidos: number;
  total: number;
  alocados: number;
  saldo: number;
}

export interface OsInstalacaoGridItem {
  os_id: string;
  numero: string;
  cliente_nome: string | null;
  nome_servico: string;
  status_instalacao_os: StatusInstalacaoOs | null;
  data_instalacao_agendada: string | null;
  proxima_visita: string | null;
  progresso: OsInstalacaoGridProgresso;
  /** Trava financeira (mesma regra da expedição). */
  bloqueio_financeiro: boolean;
  link_financeiro: string | null;
  relatorio_tecnico?: {
    pdf_url: string;
    pdf_token: string;
    gerado_em: string;
  } | null;
  pendente_aprovacao_financeira?: boolean;
  requer_atencao_instalacao?: boolean;
  ultima_atividade_instalacao?: string | null;
}

export interface ListarOsInstalacaoResposta {
  total: number;
  itens: OsInstalacaoGridItem[];
}

export type StatusInstalacao =
  | 'AGUARDANDO'
  | 'EM_ANDAMENTO'
  | 'CONCLUIDO'
  | 'LOGISTICA_NEGATIVA';

export type TipoOcorrencia =
  | 'VISITA_IMPRODUTIVA'
  | 'MATERIAL_EXTRA'
  | 'SERVICO_ADICIONAL'
  | 'RETRABALHO';

export type OrigemConclusaoLote = 'CAMPO' | 'GESTAO';

export type MotivoSemAssinaturaLote =
  | 'CLIENTE_AUSENTE'
  | 'CLIENTE_RECUSOU_ASSINAR'
  | 'ASSINATURA_CANAL_ALTERNATIVO'
  | 'INSTALADOR_SEM_APP'
  | 'EVIDENCIA_SUFICIENTE'
  | 'OUTROS';

export interface LoteInstaladorResumo {
  id: string;
  cep: string | null;
  logradouro: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  uf: string;
  quantidade_alocada: number;
  status_instalacao: StatusInstalacao;
  data_previsao: string | null;
  data_execucao: string | null;
  turno_previsao?: TurnoPrevisaoInstalacao | null;
  equipe_instalacao?: string | null;
  responsavel_local?: string | null;
  informar_equipe?: boolean;
  aguardando_reagendamento?: boolean;
  fotos_evidencia: string[] | null;
  assinatura_url: string | null;
  origem_conclusao_lote?: OrigemConclusaoLote | null;
  motivo_sem_assinatura?: MotivoSemAssinaturaLote | null;
  observacao_conclusao_gestao?: string | null;
  conclusao_gestao_em?: string | null;
  criado_em: string;
  item_os: {
    produto_servico: string | null;
    os: {
      id: string;
      numero: string;
      nome_servico: string;
    };
  };
}

export interface LoteInstaladorDetalhe extends LoteInstaladorResumo {
  item_os_id: string;
  ocorrencias: OcorrenciaInstalador[];
}

export interface OcorrenciaInstalador {
  id: string;
  tipo: TipoOcorrencia;
  categoria: string;
  quantidade: number;
  descricao: string;
  criado_em: string;
}

export interface OcorrenciaGestao extends OcorrenciaInstalador {
  status_financeiro: StatusFinanceiroOcorrencia;
  custo_interno: number | null;
  preco_cliente: number | null;
  custo_sugerido: number | null;
  preco_sugerido: number | null;
  versao: number;
  os_aditiva_id: string | null;
  fotos_evidencia: string[];
  item_instalacao?: {
    id: string;
    logradouro: string;
    numero: string;
  } | null;
}

export interface LoteGestao extends Omit<LoteInstaladorResumo, 'fotos_evidencia'> {
  fotos_evidencia: string[];
  atualizado_em: string;
  item_os: {
    produto_servico: string | null;
    os: {
      id: string;
      numero: string;
      nome_servico: string;
      cliente?: { nome: string } | null;
    };
  };
}

export interface ItemSaldoInstalacao {
  item_os_id: string;
  produto_servico: string | null;
  quantidade_total: number;
  quantidade_alocada: number;
  saldo_disponivel: number;
}

export interface CriarLoteInstalacaoPayload {
  item_os_id: string;
  quantidade_alocada: number;
  cep?: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
  data_previsao?: string;
  turno_previsao?: TurnoPrevisaoInstalacao;
  equipe_instalacao?: string;
  responsavel_local?: string;
  informar_equipe?: boolean;
}

export interface CriarLoteInstalacaoResposta {
  criado: boolean;
  item_os_id?: string;
  item_instalacao_id?: string;
  quantidade_alocada?: number;
}

export type TurnoPrevisaoInstalacao = 'MANHA' | 'TARDE' | 'INTEIRO';

export interface LotePainelOs extends LoteInstaladorResumo {
  fotos_evidencia: string[];
  atualizado_em: string;
  turno_previsao: TurnoPrevisaoInstalacao | null;
  equipe_instalacao: string | null;
  responsavel_local: string | null;
  informar_equipe: boolean;
  aguardando_reagendamento: boolean;
  item_os_id?: string;
  item_os: { produto_servico: string | null };
}

export interface AprovarConclusaoLoteGestaoPayload {
  fotos_evidencia?: string[];
  assinatura_url?: string;
  motivo_sem_assinatura?: MotivoSemAssinaturaLote;
  observacao_conclusao_gestao?: string;
}

export interface PainelOsInstalacao {
      os: {
        id: string;
        numero: string;
        nome_servico: string;
        cliente_nome: string | null;
        status_instalacao_os: StatusInstalacaoOs | null;
      };
  itens_saldo?: ItemSaldoInstalacao[];
  lotes: LotePainelOs[];
  ocorrencias: OcorrenciaGestao[];
}

export interface AgendaInstalacaoEvento {
  lote_id: string;
  os_id: string;
  os_numero: string;
  cliente_nome: string | null;
  nome_servico: string;
  status_instalacao_os: StatusInstalacaoOs | null;
  data_previsao: string;
  turno_previsao: TurnoPrevisaoInstalacao | null;
  equipe_instalacao: string | null;
  status_instalacao: StatusInstalacao;
  endereco: {
    cep: string | null;
    logradouro: string;
    numero: string;
    complemento: string | null;
    bairro: string;
    cidade: string;
    uf: string;
  };
  endereco_resumido: string;
}

export interface ConsultarAgendaResposta {
  data_inicio: string;
  data_fim: string;
  total: number;
  eventos: AgendaInstalacaoEvento[];
}

export interface ConflitoAgendaLoteResumo {
  lote_id: string;
  os_numero: string;
  cliente_nome: string | null;
}

export interface ConflitoAgendaItem {
  data: string;
  equipe_instalacao: string;
  total_lotes_sobrepostos: number;
  lotes: ConflitoAgendaLoteResumo[];
}

export interface ConsultarConflitosAgendaResposta {
  data_inicio: string;
  data_fim: string;
  total_conflitos: number;
  conflitos: ConflitoAgendaItem[];
}

export type VistaCalendarioInstalacao = 'semana' | 'mes' | 'dia';

export interface EnderecoLoteForm {
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  quantidade_alocada: number;
  data_previsao: string;
  turno_previsao: TurnoPrevisaoInstalacao | '';
  equipe_instalacao: string;
  responsavel_local: string;
  informar_equipe: boolean;
}

export interface ResultadoBuscaCep {
  sucesso: boolean;
  endereco?: {
    cep: string;
    logradouro: string;
    complemento: string;
    bairro: string;
    cidade: string;
    uf: string;
  };
  erro?: string;
  permitir_preenchimento_manual: boolean;
}

export interface SplitFiscalOs {
  os_id: string;
  total_nfe: number;
  total_nfs: number;
  total_geral: number;
  instrucao_nfe: string;
  instrucao_nfs: string;
  detalhes: Array<{
    origem: string;
    descricao: string;
    tipo_faturamento: 'PRODUTO' | 'SERVICO';
    valor: number;
  }>;
}

export interface RelatorioTecnicoEmitido {
  id: string;
  pdf_url: string;
  pdf_token: string;
  total_nfe: number;
  total_nfs: number;
  gerado_em: string;
}

export interface RelatorioTecnicoResposta {
  os_id: string;
  orcamento_id: string;
  cobranca_id: string;
  parcela_saldo_liberada: boolean;
  valor_cobranca_extra: number;
  parcela_extra_id?: string;
  relatorio_gerado_em: string;
  pdf_disponivel: boolean;
  pdf_url?: string;
  pdf_token?: string;
  split_fiscal?: SplitFiscalOs;
}

export interface MargemRealOs {
  os_id: string;
  valor_orcado: number;
  custo_orcado: number;
  custos_extras_campo: number;
  custo_operacional_instalacao?: number;
  receita_extras_campo?: number;
  receita_os_aditivas?: number;
  receita_total?: number;
  lucro_real: number;
  margem_percentual: number;
}

export interface FilaPrecificacaoItem {
  id: string;
  os_id: string;
  os_numero: string;
  cliente_nome: string | null;
  tipo: TipoOcorrencia;
  descricao: string;
  quantidade: number;
  status_financeiro: StatusFinanceiroOcorrencia;
  custo_sugerido: number | null;
  preco_sugerido: number | null;
  custo_interno: number | null;
  preco_cliente: number | null;
  versao: number;
  criado_em: string;
  item_instalacao: {
    id: string;
    logradouro: string;
    numero: string;
    cidade: string;
  } | null;
}

export interface FilaPrecificacaoResposta {
  total: number;
  pagina: number;
  por_pagina: number;
  os_aditiva_habilitada?: boolean;
  itens: FilaPrecificacaoItem[];
}

export interface ContadoresOcorrenciasResposta {
  pendentes: number;
  precificados: number;
  os_aditiva_habilitada?: boolean;
}

export interface ConfiguracaoInstalacaoResposta {
  exigir_sinal_producao: boolean;
  os_aditiva_habilitada: boolean;
}

export interface OcorrenciaGestaoDetalhe {
  id: string;
  os_id: string;
  tipo: TipoOcorrencia;
  descricao: string;
  quantidade: number;
  status_financeiro: StatusFinanceiroOcorrencia;
  custo_sugerido: number | null;
  preco_sugerido: number | null;
  custo_interno: number | null;
  preco_cliente: number | null;
  versao: number;
  os_aditiva_id: string | null;
  criado_em: string;
}

export interface GerarOsAditivaResposta {
  os_aditiva_id: string;
  os_aditiva_numero: string;
  os_pai_id: string;
  orcamento_id: string;
  cobranca_id: string;
  valor_total: number;
  ocorrencias_faturadas: number;
}

export interface OsAditivaResumo {
  id: string;
  numero: string;
  valor_orcado: number;
  criado_em: string;
  cobranca_id: string | null;
  cobranca_status: string | null;
  ocorrencias_snapshot: unknown[];
}

export const ENDERECO_LOTE_VAZIO: EnderecoLoteForm = {
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  uf: '',
  quantidade_alocada: 1,
  data_previsao: '',
  turno_previsao: '',
  equipe_instalacao: '',
  responsavel_local: '',
  informar_equipe: false,
};

function formatarDataPrevisaoInput(valor: string | Date | null | undefined): string {
  if (!valor) return '';
  if (typeof valor === 'string') {
    const match = valor.trim().match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) {
      const data = new Date(`${match[1]}T12:00:00.000Z`);
      return data.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
    }
    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) return '';
    return data.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  }
  return valor.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
}

export function montarPayloadAgendaLote(dados: EnderecoLoteForm) {
  return {
    data_previsao: dados.data_previsao || undefined,
    turno_previsao: dados.turno_previsao || undefined,
    equipe_instalacao: dados.equipe_instalacao.trim() || undefined,
    responsavel_local: dados.responsavel_local.trim() || undefined,
    informar_equipe: dados.informar_equipe,
  };
}

export function loteParaEnderecoForm(
  lote: Pick<
    LoteInstaladorDetalhe,
    | 'cep'
    | 'logradouro'
    | 'numero'
    | 'complemento'
    | 'bairro'
    | 'cidade'
    | 'uf'
    | 'quantidade_alocada'
    | 'data_previsao'
    | 'turno_previsao'
    | 'equipe_instalacao'
    | 'responsavel_local'
    | 'informar_equipe'
  >,
): EnderecoLoteForm {
  return {
    cep: lote.cep ?? '',
    logradouro: lote.logradouro ?? '',
    numero: lote.numero ?? '',
    complemento: lote.complemento ?? '',
    bairro: lote.bairro ?? '',
    cidade: lote.cidade ?? '',
    uf: lote.uf ?? '',
    quantidade_alocada: lote.quantidade_alocada ?? 1,
    data_previsao: formatarDataPrevisaoInput(lote.data_previsao),
    turno_previsao: lote.turno_previsao ?? '',
    equipe_instalacao: lote.equipe_instalacao ?? '',
    responsavel_local: lote.responsavel_local ?? '',
    informar_equipe: lote.informar_equipe ?? false,
  };
}

export function formatarCepInput(valor: string): string {
  const apenasNumeros = valor.replace(/\D/g, '').slice(0, 8);
  if (apenasNumeros.length <= 5) return apenasNumeros;
  return `${apenasNumeros.slice(0, 5)}-${apenasNumeros.slice(5)}`;
}

export function normalizarFotos(valor: unknown): string[] {
  if (!Array.isArray(valor)) return [];
  return valor.filter((item): item is string => typeof item === 'string');
}
