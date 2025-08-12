export type MovimentacaoRow = {
  id: string;
  item_id: string;
  tipo: string;
  quantidade: number | string;
  quantidade_anterior: number | string;
  quantidade_atual: number | string;
  documento_referencia?: string | null;
  responsavel?: string | null;
  loja_id: string;
  criado_em: any;
  observacoes?: string | null;
  insumoNome?: string;
  localizacaoCodigo?: string;
};

export function mapMovimentacao(row: MovimentacaoRow) {
  return {
    id: row.id,
    estoqueId: row.item_id,
    insumoNome: row.insumoNome ?? '',
    localizacaoCodigo: row.localizacaoCodigo ?? '',
    localizacaoCompleta: row.localizacaoCodigo ?? '',
    tipo: row.tipo,
    quantidade: Number(row.quantidade || 0),
    quantidadeAnterior: Number(row.quantidade_anterior || 0),
    quantidadePosterior: Number(row.quantidade_atual || 0),
    documentoRef: row.documento_referencia ?? null,
    orcamentoId: null,
    usuarioId: row.responsavel ?? 'sistema',
    usuarioNome: 'Administrador',
    lojaId: row.loja_id,
    dataMovimentacao: row.criado_em,
    observacoes: row.observacoes ?? null,
    createdAt: row.criado_em,
  };
}
