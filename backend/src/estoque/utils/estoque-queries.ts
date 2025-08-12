export const MOVIMENTACOES_BASE_SELECT = `
  SELECT 
    m.id,
    m.item_id,
    m.tipo,
    m.quantidade,
    m.quantidade_anterior,
    m.quantidade_atual,
    m.documento_referencia,
    m.responsavel,
    m.loja_id,
    m.criado_em,
    m.observacoes,
    COALESCE(i.nome, '') as insumoNome,
    COALESCE(l.codigo, '') as localizacaoCodigo
  FROM movimentacoes_estoque m
  LEFT JOIN itens_estoque i ON i.id = m.item_id
  LEFT JOIN localizacoes l ON l.id = i.localizacao_id
`;
