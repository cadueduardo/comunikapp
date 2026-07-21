-- Snapshot comercial do fornecedor usado como parâmetro no orçamento.
-- Migration estritamente aditiva: registros históricos permanecem sem
-- fornecedor inferido para não atribuir retrospectivamente uma escolha.
ALTER TABLE `ItemInsumo`
  ADD COLUMN `fornecedor_previsto_id` VARCHAR(191) NULL,
  ADD COLUMN `fornecedor_nome_snapshot` VARCHAR(191) NULL,
  ADD COLUMN `codigo_ref_snapshot` VARCHAR(191) NULL,
  ADD COLUMN `preco_compra_snapshot` DECIMAL(10, 2) NULL;

CREATE INDEX `ItemInsumo_fornecedor_previsto_id_idx`
  ON `ItemInsumo`(`fornecedor_previsto_id`);

ALTER TABLE `ItemInsumo`
  ADD CONSTRAINT `ItemInsumo_fornecedor_previsto_id_fkey`
  FOREIGN KEY (`fornecedor_previsto_id`) REFERENCES `fornecedor`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
