-- Fase 3: a matriz passa a ser a fonte dos múltiplos fornecedores.
-- Pré-condição operacional: backfill aplicado e zero duplicatas por loja/nome.
CREATE UNIQUE INDEX `insumos_loja_id_nome_key`
  ON `insumos`(`loja_id`, `nome`);

DROP INDEX `insumos_loja_id_nome_fornecedorId_key` ON `insumos`;
