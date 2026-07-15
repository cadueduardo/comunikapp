-- Fase 3: decisão comercial e snapshot de custos de terceirização por produto.
ALTER TABLE `ProdutoOrcamento`
  ADD COLUMN `modo_fulfillment` ENUM('PICK', 'MAKE', 'HIBRIDO', 'OUTSOURCE') NULL,
  ADD COLUMN `fornecedor_terceirizado_id` VARCHAR(191) NULL,
  ADD COLUMN `terceirizacao_custo_unitario` DECIMAL(12, 2) NULL,
  ADD COLUMN `terceirizacao_custo_setup` DECIMAL(12, 2) NULL,
  ADD COLUMN `terceirizacao_custo_frete` DECIMAL(12, 2) NULL,
  ADD COLUMN `terceirizacao_custo_total` DECIMAL(12, 2) NULL,
  ADD COLUMN `terceirizacao_prazo_dias` INTEGER NULL,
  ADD COLUMN `terceirizacao_observacoes` TEXT NULL;

CREATE INDEX `ProdutoOrcamento_modo_fulfillment_idx`
  ON `ProdutoOrcamento`(`modo_fulfillment`);

CREATE INDEX `ProdutoOrcamento_fornecedor_terceirizado_id_idx`
  ON `ProdutoOrcamento`(`fornecedor_terceirizado_id`);

ALTER TABLE `ProdutoOrcamento`
  ADD CONSTRAINT `ProdutoOrcamento_fornecedor_terceirizado_id_fkey`
  FOREIGN KEY (`fornecedor_terceirizado_id`) REFERENCES `fornecedor`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
