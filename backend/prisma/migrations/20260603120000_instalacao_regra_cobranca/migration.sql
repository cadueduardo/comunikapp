-- Add installation charging rule to installation types and snapshot fields to quote products.

ALTER TABLE `tipo_instalacao`
  ADD COLUMN `regra_cobranca` VARCHAR(24) NOT NULL DEFAULT 'FIXO';

ALTER TABLE `ProdutoOrcamento`
  ADD COLUMN `instalacao_regra_cobranca` VARCHAR(24) NULL,
  ADD COLUMN `instalacao_valor_unitario` DECIMAL(12, 2) NULL;
