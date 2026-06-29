import {
  FinalidadeAnexo,
  PoliticaCobrancaArte,
  ResponsabilidadeArte,
  OrigemItemServicoManual,
} from '@/lib/arte-orcamento.constants';

export const ARTE_PRODUTO_DEFAULTS = {
  responsabilidade_arte: ResponsabilidadeArte.NAO_APLICAVEL,
  politica_cobranca_arte: PoliticaCobrancaArte.NAO_APLICAVEL,
  finalidade_anexo: '' as const,
  complexidade_arte: '',
  arte_custo_automatico: false,
  arte_horas_calculadas: null as number | null,
  arte_custo_calculado: null as number | null,
  arte_referencia_servico_id: null as string | null,
};

export function mapArteProdutoBackendParaFormulario(produto: Record<string, unknown>) {
  return {
    responsabilidade_arte: String(
      produto.responsabilidade_arte || ResponsabilidadeArte.NAO_APLICAVEL,
    ),
    politica_cobranca_arte: String(
      produto.politica_cobranca_arte || PoliticaCobrancaArte.NAO_APLICAVEL,
    ),
    finalidade_anexo: (() => {
      const salva = produto.finalidade_anexo
        ? String(produto.finalidade_anexo)
        : '';
      if (salva) return salva;
      if (!produto.arquivo_geometria_url) return '';
      return (
        resolverFinalidadeAnexoDefault(
          String(produto.responsabilidade_arte || ''),
          String(produto.geometria_origem || ''),
          null,
        ) || ''
      );
    })(),
    complexidade_arte: produto.complexidade_arte
      ? String(produto.complexidade_arte)
      : '',
    arte_custo_automatico: Boolean(produto.arte_custo_automatico),
    arte_horas_calculadas:
      produto.arte_horas_calculadas != null
        ? Number(produto.arte_horas_calculadas)
        : null,
    arte_custo_calculado:
      produto.arte_custo_calculado != null
        ? Number(produto.arte_custo_calculado)
        : null,
    arte_referencia_servico_id: produto.arte_referencia_servico_id
      ? String(produto.arte_referencia_servico_id)
      : null,
  };
}

export function mapArteServicosBackendParaFormulario(
  servicosManuais: Array<Record<string, unknown>> | undefined,
) {
  return (servicosManuais || []).map((serv) => ({
    servico_id: String(serv.servico_id || ''),
    horas_trabalhadas: String(
      serv.horas_trabalhadas ?? serv.tempo_horas ?? '1',
    ),
    origem: serv.origem
      ? String(serv.origem)
      : OrigemItemServicoManual.MANUAL,
    custo_hora: serv.custo_hora,
    custo_total: serv.custo_total,
    descricao: serv.descricao ? String(serv.descricao) : undefined,
  }));
}

export function mapArteProdutoFormularioParaBackend(
  produto: Record<string, unknown>,
) {
  const finalidade = produto.finalidade_anexo
    ? String(produto.finalidade_anexo)
    : null;

  return {
    responsabilidade_arte:
      produto.responsabilidade_arte || ResponsabilidadeArte.NAO_APLICAVEL,
    politica_cobranca_arte:
      produto.politica_cobranca_arte || PoliticaCobrancaArte.NAO_APLICAVEL,
    finalidade_anexo: finalidade &&
      (Object.values(FinalidadeAnexo) as string[]).includes(finalidade)
      ? finalidade
      : null,
    complexidade_arte: produto.complexidade_arte || null,
    arte_custo_automatico: Boolean(produto.arte_custo_automatico),
    arte_referencia_servico_id: produto.arte_referencia_servico_id || null,
    arte_horas_calculadas: produto.arte_horas_calculadas ?? null,
    arte_custo_calculado: produto.arte_custo_calculado ?? null,
  };
}

export function mapArteServicoFormularioParaBackend(
  servico: Record<string, unknown>,
  normalizarNumero: (v: unknown) => number,
) {
  return {
    servico_id: servico.servico_id,
    tempo_horas: normalizarNumero(servico.horas_trabalhadas),
    horas_trabalhadas: normalizarNumero(servico.horas_trabalhadas),
    custo_hora: normalizarNumero(servico.custo_hora),
    custo_total: normalizarNumero(servico.custo_total),
    origem: servico.origem || OrigemItemServicoManual.MANUAL,
    exibir_no_pdf:
      servico.origem === OrigemItemServicoManual.ARTE_AUTOMATICA
        ? servico.exibir_no_pdf
        : undefined,
    descricao: servico.descricao,
  };
}

/** Default de finalidade conforme spec (§5.1). Não sobrescreve valor já escolhido. */
export function resolverFinalidadeAnexoDefault(
  responsabilidade: string | null | undefined,
  geometriaOrigem: string | null | undefined,
  finalidadeAtual?: string | null,
): string | null {
  const atual = finalidadeAtual ? String(finalidadeAtual).trim() : '';
  if (atual && (Object.values(FinalidadeAnexo) as string[]).includes(atual)) {
    return atual;
  }

  const origem = String(geometriaOrigem || '').toUpperCase();

  if (origem === 'DXF') {
    return FinalidadeAnexo.DESENHO_TECNICO;
  }

  if (origem === 'IMAGEM' || origem === 'MANUAL' || origem === 'PDF') {
    if (responsabilidade === ResponsabilidadeArte.CLIENTE_FORNECE) {
      return FinalidadeAnexo.ARTE_PRODUCAO;
    }
    if (
      responsabilidade === ResponsabilidadeArte.EMPRESA_CRIA ||
      responsabilidade === ResponsabilidadeArte.EMPRESA_ADAPTA
    ) {
      return FinalidadeAnexo.REFERENCIA_VISUAL;
    }
  }

  return null;
}

export function textoAjudaFinalidadeAnexo(
  finalidade: string | null | undefined,
  responsabilidade: string | null | undefined,
): string | null {
  if (!finalidade) return null;
  if (finalidade === FinalidadeAnexo.REFERENCIA_VISUAL && arteRequerTrabalhoInterno(responsabilidade)) {
    return 'Briefing para o designer — a equipe ainda criará a arte final na OS.';
  }
  if (finalidade === FinalidadeAnexo.ARTE_PRODUCAO) {
    return 'Arquivo tratado como arte pronta para produção.';
  }
  if (finalidade === FinalidadeAnexo.DESENHO_TECNICO) {
    return 'Especificação técnica (ex.: DXF) — não é a arte gráfica final.';
  }
  return null;
}

function arteRequerTrabalhoInterno(responsabilidade?: string | null): boolean {
  return (
    responsabilidade === ResponsabilidadeArte.EMPRESA_CRIA ||
    responsabilidade === ResponsabilidadeArte.EMPRESA_ADAPTA
  );
}
