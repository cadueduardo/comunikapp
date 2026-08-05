-- M4.4 — isola a idempotência de transferência por tenant.
-- A migration M4.2 já foi aplicada e não deve ser editada.

DROP INDEX `cliente_transferencia_carteira_chave_operacao_key`
  ON `cliente_transferencia_carteira`;

CREATE UNIQUE INDEX `cliente_transferencia_carteira_loja_id_chave_operacao_key`
  ON `cliente_transferencia_carteira`(`loja_id`, `chave_operacao`);
