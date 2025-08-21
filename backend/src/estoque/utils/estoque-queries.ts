export const MOVIMENTACOES_BASE_SELECT = `
  SELECT 
    m.id,
    m.estoqueId,
    m.tipo,
    m.quantidade,
    m.quantidadeAnterior,
    m.quantidadeAtual,
    m.documentoReferencia,
    m.responsavel,
    m.lojaId,
    m.dataMovimentacao,
    m.observacoes,
    COALESCE(i.nome, '') as insumoNome,
    COALESCE(l.codigo, '') as localizacaoCodigo
      FROM estoque_movimentacoes m
      LEFT JOIN estoque_itens i ON i.id = m.estoqueId
        LEFT JOIN estoque_localizacoes l ON l.id = i.localizacaoId
`;
