import type { PosCalculoTrocaFornecedor } from '../interfaces/pos-calculo.interface';

const ACOES_SUBSTITUICAO = [
  'SUBSTITUIR_FORNECEDOR',
  'CANCELAR_POR_SUBSTITUICAO',
] as const;

export type AcaoSubstituicaoFornecedor = (typeof ACOES_SUBSTITUICAO)[number];

export function isAcaoSubstituicaoFornecedor(
  acao: string,
): acao is AcaoSubstituicaoFornecedor {
  return (ACOES_SUBSTITUICAO as readonly string[]).includes(acao);
}

export interface HistoricoSubstituicaoEntrada {
  entidadeId: string;
  acao: string;
  criadoEm: Date | string;
  dados: unknown;
}

export interface PedidoFornecedorMeta {
  id: string;
  numero: string;
  fornecedorId: string;
  fornecedorNome: string;
}

export interface DesvioPrevistoEntrada {
  pedidoId: string;
  pedidoNumero: string;
  fornecedorEfetivoId: string;
  fornecedorEfetivoNome: string;
  fornecedorPrevistoId: string;
  fornecedorPrevistoNome?: string;
}

export function extrairDadosSubstituicao(dados: unknown): {
  motivo?: string;
  pedidoSubstituidoId?: string;
  pedidoSubstitutoId?: string;
  fornecedorAnteriorId?: string;
  fornecedorId?: string;
} {
  if (!dados || typeof dados !== 'object') {
    return {};
  }

  const registro = dados as Record<string, unknown>;

  return {
    motivo: typeof registro.motivo === 'string' ? registro.motivo : undefined,
    pedidoSubstituidoId:
      typeof registro.pedido_substituido_id === 'string'
        ? registro.pedido_substituido_id
        : undefined,
    pedidoSubstitutoId:
      typeof registro.pedido_substituto_id === 'string'
        ? registro.pedido_substituto_id
        : undefined,
    fornecedorAnteriorId:
      typeof registro.fornecedor_anterior_id === 'string'
        ? registro.fornecedor_anterior_id
        : undefined,
    fornecedorId:
      typeof registro.fornecedor_id === 'string'
        ? registro.fornecedor_id
        : undefined,
  };
}

export function normalizarEmHistorico(valor: Date | string): string {
  if (valor instanceof Date) {
    return valor.toISOString();
  }
  const parsed = Date.parse(valor);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : valor;
}

export function montarTrocasSubstituicaoHistorico(
  historicos: HistoricoSubstituicaoEntrada[],
  pedidos: Map<string, PedidoFornecedorMeta>,
  fornecedores: Map<string, string>,
): PosCalculoTrocaFornecedor[] {
  const substituir = historicos.filter(
    (historico) => historico.acao === 'SUBSTITUIR_FORNECEDOR',
  );
  const cancelar = historicos.filter(
    (historico) => historico.acao === 'CANCELAR_POR_SUBSTITUICAO',
  );

  const paresSubstituir = new Set<string>();
  const resultado: PosCalculoTrocaFornecedor[] = [];

  for (const historico of substituir) {
    const dados = extrairDadosSubstituicao(historico.dados);
    const pedidoId = historico.entidadeId;
    const pedido = pedidos.get(pedidoId);
    const fornecedorPrevistoId = dados.fornecedorAnteriorId;
    const fornecedorEfetivoId = dados.fornecedorId;

    if (dados.pedidoSubstituidoId) {
      paresSubstituir.add(`${dados.pedidoSubstituidoId}:${pedidoId}`);
    }

    resultado.push({
      tipo: 'SUBSTITUICAO_PEDIDO',
      pedido_id: pedidoId,
      pedido_numero: pedido?.numero,
      fornecedor_previsto_id: fornecedorPrevistoId,
      fornecedor_previsto_nome: fornecedorPrevistoId
        ? fornecedores.get(fornecedorPrevistoId)
        : undefined,
      fornecedor_efetivo_id: fornecedorEfetivoId,
      fornecedor_efetivo_nome: fornecedorEfetivoId
        ? fornecedores.get(fornecedorEfetivoId)
        : undefined,
      motivo: dados.motivo,
      em: normalizarEmHistorico(historico.criadoEm),
    });
  }

  for (const historico of cancelar) {
    const dados = extrairDadosSubstituicao(historico.dados);
    const canceladoId = historico.entidadeId;
    const substitutoId = dados.pedidoSubstitutoId;

    if (
      substitutoId &&
      paresSubstituir.has(`${canceladoId}:${substitutoId}`)
    ) {
      continue;
    }

    const pedidoAlvoId = substitutoId ?? canceladoId;
    const pedido = pedidos.get(pedidoAlvoId);
    const cancelado = pedidos.get(canceladoId);
    const substituto = substitutoId ? pedidos.get(substitutoId) : undefined;

    resultado.push({
      tipo: 'SUBSTITUICAO_PEDIDO',
      pedido_id: pedidoAlvoId,
      pedido_numero: pedido?.numero,
      fornecedor_previsto_id: cancelado?.fornecedorId,
      fornecedor_previsto_nome: cancelado?.fornecedorNome,
      fornecedor_efetivo_id:
        substituto?.fornecedorId ?? cancelado?.fornecedorId,
      fornecedor_efetivo_nome:
        substituto?.fornecedorNome ?? cancelado?.fornecedorNome,
      motivo: dados.motivo,
      em: normalizarEmHistorico(historico.criadoEm),
    });
  }

  return resultado;
}

export function montarDesviosPrevistos(
  entradas: DesvioPrevistoEntrada[],
  pedidosComSubstituicao: Set<string>,
): PosCalculoTrocaFornecedor[] {
  const vistos = new Set<string>();
  const resultado: PosCalculoTrocaFornecedor[] = [];

  for (const entrada of entradas) {
    if (pedidosComSubstituicao.has(entrada.pedidoId)) {
      continue;
    }
    if (
      !entrada.fornecedorPrevistoId ||
      entrada.fornecedorPrevistoId === entrada.fornecedorEfetivoId
    ) {
      continue;
    }

    const chave = `${entrada.pedidoId}:${entrada.fornecedorPrevistoId}:${entrada.fornecedorEfetivoId}`;
    if (vistos.has(chave)) {
      continue;
    }
    vistos.add(chave);

    resultado.push({
      tipo: 'DESVIO_PREVISTO',
      pedido_id: entrada.pedidoId,
      pedido_numero: entrada.pedidoNumero,
      fornecedor_previsto_id: entrada.fornecedorPrevistoId,
      fornecedor_previsto_nome: entrada.fornecedorPrevistoNome,
      fornecedor_efetivo_id: entrada.fornecedorEfetivoId,
      fornecedor_efetivo_nome: entrada.fornecedorEfetivoNome,
    });
  }

  return resultado;
}

export function combinarTrocasFornecedor(
  substituicoes: PosCalculoTrocaFornecedor[],
  desvios: PosCalculoTrocaFornecedor[],
): PosCalculoTrocaFornecedor[] {
  return [...substituicoes, ...desvios].sort((a, b) => {
    const instanteA = a.em ? Date.parse(a.em) : 0;
    const instanteB = b.em ? Date.parse(b.em) : 0;
    return instanteB - instanteA;
  });
}
