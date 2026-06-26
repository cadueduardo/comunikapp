/**
 * Mapeia campos de instalação do produto (API/backend) para o formulário de orçamento.
 */
function formatarValorMoedaParaFormulario(valor: unknown): string {
  if (valor == null || valor === '') return '';
  if (typeof valor === 'number' && Number.isFinite(valor)) {
    return valor.toString();
  }
  const texto = String(valor).trim();
  if (!texto) return '';
  const normalizado =
    texto.includes(',') && texto.includes('.')
      ? texto.replace(/\./g, '').replace(',', '.')
      : texto.replace(',', '.');
  const numero = Number(normalizado);
  if (!Number.isFinite(numero)) return '';
  return numero.toString();
}

export function mapInstalacaoProdutoBackendParaFormulario(
  produto: Record<string, unknown>,
): Record<string, string | boolean> {
  return {
    instalacao_necessaria: Boolean(produto.instalacao_necessaria),
    instalacao_tipo_id: String(produto.instalacao_tipo_id ?? ''),
    instalacao_regra_cobranca: String(produto.instalacao_regra_cobranca ?? 'FIXO'),
    instalacao_valor_unitario: formatarValorMoedaParaFormulario(
      produto.instalacao_valor_unitario,
    ),
    instalacao_usar_endereco_entrega: produto.instalacao_usar_endereco_entrega !== false,
    instalacao_endereco_snapshot: String(produto.instalacao_endereco_snapshot ?? ''),
    instalacao_cep: String(produto.instalacao_cep ?? ''),
    instalacao_logradouro: String(produto.instalacao_logradouro ?? ''),
    instalacao_numero: String(produto.instalacao_numero ?? ''),
    instalacao_complemento: String(produto.instalacao_complemento ?? ''),
    instalacao_bairro: String(produto.instalacao_bairro ?? ''),
    instalacao_cidade: String(produto.instalacao_cidade ?? ''),
    instalacao_estado: String(produto.instalacao_estado ?? ''),
    instalacao_preco_cobrado: formatarValorMoedaParaFormulario(
      produto.instalacao_preco_cobrado,
    ),
    instalacao_custo_mao_obra: formatarValorMoedaParaFormulario(
      produto.instalacao_custo_mao_obra,
    ),
    instalacao_custo_deslocamento: formatarValorMoedaParaFormulario(
      produto.instalacao_custo_deslocamento,
    ),
    instalacao_tempo_estimado_min:
      produto.instalacao_tempo_estimado_min != null
        ? String(produto.instalacao_tempo_estimado_min)
        : '',
    instalacao_quantidade_pessoas:
      produto.instalacao_quantidade_pessoas != null
        ? String(produto.instalacao_quantidade_pessoas)
        : '',
    instalacao_observacoes: String(produto.instalacao_observacoes ?? ''),
  };
}

type NormalizarNumero = (valor: unknown) => number;
type FixDecimal = (valor: unknown, precision?: number) => number;

/** Mapeia instalação do formulário para o payload do backend. */
export function mapInstalacaoProdutoFormularioParaBackend(
  produto: Record<string, unknown>,
  normalizarNumero: NormalizarNumero,
  fixDecimal: FixDecimal,
): Record<string, unknown> {
  const instalacaoNecessaria = Boolean(produto.instalacao_necessaria);
  return {
    instalacao_necessaria: instalacaoNecessaria,
    instalacao_tipo_id: produto.instalacao_tipo_id || undefined,
    instalacao_regra_cobranca:
      produto.instalacao_regra_cobranca || (instalacaoNecessaria ? 'FIXO' : undefined),
    instalacao_valor_unitario: instalacaoNecessaria
      ? fixDecimal(normalizarNumero(produto.instalacao_valor_unitario))
      : undefined,
    instalacao_usar_endereco_entrega: produto.instalacao_usar_endereco_entrega !== false,
    instalacao_endereco_snapshot: produto.instalacao_endereco_snapshot || undefined,
    instalacao_cep: produto.instalacao_cep || undefined,
    instalacao_logradouro: produto.instalacao_logradouro || undefined,
    instalacao_numero: produto.instalacao_numero || undefined,
    instalacao_complemento: produto.instalacao_complemento || undefined,
    instalacao_bairro: produto.instalacao_bairro || undefined,
    instalacao_cidade: produto.instalacao_cidade || undefined,
    instalacao_estado: produto.instalacao_estado || undefined,
    instalacao_preco_cobrado: instalacaoNecessaria
      ? fixDecimal(normalizarNumero(produto.instalacao_preco_cobrado))
      : 0,
    instalacao_custo_mao_obra: instalacaoNecessaria
      ? fixDecimal(normalizarNumero(produto.instalacao_custo_mao_obra))
      : 0,
    instalacao_custo_deslocamento: instalacaoNecessaria
      ? fixDecimal(normalizarNumero(produto.instalacao_custo_deslocamento))
      : 0,
    instalacao_tempo_estimado_min: instalacaoNecessaria
      ? normalizarNumero(produto.instalacao_tempo_estimado_min) || undefined
      : undefined,
    instalacao_quantidade_pessoas: instalacaoNecessaria
      ? normalizarNumero(produto.instalacao_quantidade_pessoas) || undefined
      : undefined,
    instalacao_observacoes: produto.instalacao_observacoes || undefined,
  };
}
