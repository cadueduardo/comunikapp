import type {
  AprovarConclusaoLoteGestaoPayload,
  ContadoresOcorrenciasResposta,
  ConfiguracaoInstalacaoResposta,
  CriarLoteInstalacaoPayload,
  CriarLoteInstalacaoResposta,
  FilaPrecificacaoResposta,
  GerarOsAditivaResposta,
  ListarOsInstalacaoResposta,
  LoteGestao,
  MargemRealOs,
  OcorrenciaGestaoDetalhe,
  OsAditivaResumo,
  PainelOsInstalacao,
  RelatorioTecnicoEmitido,
  RelatorioTecnicoResposta,
  ResultadoBuscaCep,
  SplitFiscalOs,
  StatusFinanceiroOcorrencia,
  StatusInstalacaoOs,
  StatusInstalacao,
  TurnoPrevisaoInstalacao,
  ConsultarAgendaResposta,
  ConsultarConflitosAgendaResposta,
} from './instalacao.types';
import { InstaladorApiError } from './instalador-api';

function getAuthHeaders(): HeadersInit {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('access_token')
      : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function getAuthHeadersSemContentType(): HeadersInit {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('access_token')
      : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function tratarResposta<T>(response: Response): Promise<T> {
  if (response.ok) {
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await response.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const message = Array.isArray(body.message)
    ? body.message.join(', ')
    : String(body.message || body.error || `Erro ${response.status}`);

  throw new InstaladorApiError(message, response.status, body);
}

export const instalacaoApi = {
  async listarOsInstalacao(filtros?: {
    status?: StatusInstalacaoOs;
    busca?: string;
  }): Promise<ListarOsInstalacaoResposta> {
    const params = new URLSearchParams();
    if (filtros?.status) {
      params.set('status', filtros.status);
    }
    if (filtros?.busca?.trim()) {
      params.set('busca', filtros.busca.trim());
    }
    const query = params.toString();
    const response = await fetch(
      `/api/instalacao/os${query ? `?${query}` : ''}`,
      { headers: getAuthHeaders() },
    );
    return tratarResposta(response);
  },

  async consultarAgenda(intervalo: {
    data_inicio: string;
    data_fim: string;
  }): Promise<ConsultarAgendaResposta> {
    const params = new URLSearchParams({
      data_inicio: intervalo.data_inicio,
      data_fim: intervalo.data_fim,
    });
    const response = await fetch(`/api/instalacao/agenda?${params}`, {
      headers: getAuthHeaders(),
    });
    return tratarResposta(response);
  },

  async consultarConflitosAgenda(intervalo: {
    data_inicio: string;
    data_fim: string;
  }): Promise<ConsultarConflitosAgendaResposta> {
    const params = new URLSearchParams({
      data_inicio: intervalo.data_inicio,
      data_fim: intervalo.data_fim,
    });
    const response = await fetch(
      `/api/instalacao/agenda/conflitos?${params}`,
      { headers: getAuthHeaders() },
    );
    return tratarResposta(response);
  },

  async listarLotes(): Promise<LoteGestao[]> {
    const response = await fetch('/api/instalacao/lotes', {
      headers: getAuthHeaders(),
    });
    return tratarResposta(response);
  },

  async criarLote(
    dados: CriarLoteInstalacaoPayload,
  ): Promise<CriarLoteInstalacaoResposta> {
    const response = await fetch('/api/instalacao/lotes', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(dados),
    });
    return tratarResposta(response);
  },

  async obterPainelOs(osId: string): Promise<PainelOsInstalacao> {
    const response = await fetch(`/api/instalacao/os/${osId}/painel`, {
      headers: getAuthHeaders(),
    });
    return tratarResposta(response);
  },

  async atualizarLote(
    id: string,
    dados: {
      cep?: string;
      logradouro: string;
      numero: string;
      complemento?: string;
      bairro: string;
      cidade: string;
      uf: string;
      quantidade_alocada?: number;
      data_previsao?: string | null;
      turno_previsao?: TurnoPrevisaoInstalacao | null;
      equipe_instalacao?: string | null;
      responsavel_local?: string | null;
      informar_equipe?: boolean;
      executor_tipo?: 'EQUIPE_INTERNA' | 'PARCEIRO';
      fornecedor_instalador_id?: string | null;
      custo_incluido_cotacao?: boolean;
    },
  ): Promise<unknown> {
    const response = await fetch(`/api/instalacao/lotes/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(dados),
    });
    return tratarResposta(response);
  },

  async aprovarConclusaoLoteGestao(
    loteId: string,
    dados: AprovarConclusaoLoteGestaoPayload,
  ): Promise<unknown> {
    const response = await fetch(
      `/api/instalacao/lotes/${loteId}/aprovar-conclusao`,
      {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(dados),
      },
    );
    return tratarResposta(response);
  },

  async atualizarStatusLote(
    id: string,
    status_instalacao: StatusInstalacao,
  ): Promise<{ id: string; status_instalacao: StatusInstalacao }> {
    const response = await fetch(`/api/instalacao/lotes/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status_instalacao }),
    });
    return tratarResposta(response);
  },

  async registrarOcorrencia(dados: {
    os_id: string;
    item_instalacao_id?: string;
    tipo: string;
    descricao: string;
    quantidade?: number;
    fotos_evidencia?: string[];
    data_retorno_previsao?: string;
    turno_retorno_previsao?: TurnoPrevisaoInstalacao;
  }): Promise<unknown> {
    const response = await fetch('/api/instalacao/ocorrencias', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(dados),
    });
    return tratarResposta(response);
  },

  async buscarCep(cep: string): Promise<ResultadoBuscaCep> {
    const cepLimpo = cep.replace(/\D/g, '');
    const response = await fetch(`/api/instalacao/cep/${cepLimpo}`, {
      headers: getAuthHeaders(),
    });
    return tratarResposta(response);
  },

  async obterMargemReal(osId: string): Promise<MargemRealOs> {
    const response = await fetch(`/api/instalacao/os/${osId}/margem-real`, {
      headers: getAuthHeaders(),
    });
    return tratarResposta(response);
  },

  async gerarPreviaRelatorioTecnico(
    osId: string,
  ): Promise<{ pdf_url: string; pdf_token: string; previa: boolean }> {
    const response = await fetch(
      `/api/instalacao/os/${osId}/relatorio-tecnico/previa`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
      },
    );
    return tratarResposta(response);
  },

  async gerarRelatorioTecnico(osId: string): Promise<RelatorioTecnicoResposta> {
    const response = await fetch(`/api/instalacao/os/${osId}/relatorio-tecnico`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return tratarResposta(response);
  },

  async aprovarFinanceiroOs(
    osId: string,
  ): Promise<RelatorioTecnicoResposta & { aprovacao_financeira_em: string }> {
    const response = await fetch(
      `/api/instalacao/os/${osId}/aprovar-financeiro`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
      },
    );
    return tratarResposta(response);
  },

  async obterSplitFiscal(osId: string): Promise<SplitFiscalOs> {
    const response = await fetch(`/api/instalacao/os/${osId}/split-fiscal`, {
      headers: getAuthHeaders(),
    });
    return tratarResposta(response);
  },

  async obterRelatorioEmitido(
    osId: string,
  ): Promise<RelatorioTecnicoEmitido | null> {
    const response = await fetch(
      `/api/instalacao/os/${osId}/relatorio-tecnico`,
      { headers: getAuthHeaders() },
    );
    if (response.status === 404) return null;
    return tratarResposta(response);
  },

  async abrirRelatorioPdf(pdfToken: string): Promise<void> {
    const token = localStorage.getItem('access_token');
    const response = await fetch(
      `/api/instalacao/relatorios/${pdfToken}`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    );
    if (!response.ok) {
      throw new Error('Não foi possível baixar o PDF do relatório.');
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  },

  async uploadAnexo(arquivo: File): Promise<{ url: string; token: string }> {
    const formData = new FormData();
    formData.append('arquivo', arquivo);

    const response = await fetch('/api/instalacao/anexos/upload', {
      method: 'POST',
      headers: getAuthHeadersSemContentType(),
      body: formData,
    });
    return tratarResposta(response);
  },

  async listarFilaPrecificacao(filtros?: {
    status?: StatusFinanceiroOcorrencia;
    busca?: string;
    pagina?: number;
    por_pagina?: number;
  }): Promise<FilaPrecificacaoResposta> {
    const params = new URLSearchParams();
    if (filtros?.status) params.set('status', filtros.status);
    if (filtros?.busca?.trim()) params.set('busca', filtros.busca.trim());
    if (filtros?.pagina) params.set('pagina', String(filtros.pagina));
    if (filtros?.por_pagina) {
      params.set('por_pagina', String(filtros.por_pagina));
    }
    const query = params.toString();
    const response = await fetch(
      `/api/instalacao/ocorrencias/fila-precificacao${query ? `?${query}` : ''}`,
      { headers: getAuthHeaders() },
    );
    return tratarResposta(response);
  },

  async obterContadoresOcorrencias(): Promise<ContadoresOcorrenciasResposta> {
    const response = await fetch('/api/instalacao/ocorrencias/contadores', {
      headers: getAuthHeaders(),
    });
    return tratarResposta(response);
  },

  async precificarOcorrencia(
    id: string,
    dados: {
      custo_interno: number;
      preco_cliente: number;
      versao: number;
      observacao_gestor?: string;
    },
  ): Promise<OcorrenciaGestaoDetalhe> {
    const response = await fetch(
      `/api/instalacao/ocorrencias/${id}/precificar`,
      {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(dados),
      },
    );
    return tratarResposta(response);
  },

  async abonarOcorrencia(
    id: string,
    dados: { versao: number; observacao_gestor: string },
  ): Promise<OcorrenciaGestaoDetalhe> {
    const response = await fetch(`/api/instalacao/ocorrencias/${id}/abonar`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(dados),
    });
    return tratarResposta(response);
  },

  async gerarOsAditiva(
    osPaiId: string,
    ocorrenciaIds?: string[],
  ): Promise<GerarOsAditivaResposta> {
    const response = await fetch(
      `/api/instalacao/os/${osPaiId}/gerar-os-aditiva`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(
          ocorrenciaIds?.length ? { ocorrencia_ids: ocorrenciaIds } : {},
        ),
      },
    );
    return tratarResposta(response);
  },

  async listarOsAditivas(osPaiId: string): Promise<OsAditivaResumo[]> {
    const response = await fetch(
      `/api/instalacao/os/${osPaiId}/os-aditivas`,
      { headers: getAuthHeaders() },
    );
    return tratarResposta(response);
  },

  async obterConfiguracaoInstalacao(): Promise<ConfiguracaoInstalacaoResposta> {
    const response = await fetch('/api/instalacao/configuracao', {
      headers: getAuthHeaders(),
    });
    return tratarResposta(response);
  },

  async atualizarOsAditivaHabilitada(
    habilitada: boolean,
  ): Promise<{ os_aditiva_habilitada: boolean; ocorrencias_migradas?: number }> {
    const response = await fetch('/api/instalacao/configuracao/os-aditiva', {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ habilitada }),
    });
    return tratarResposta(response);
  },
};
