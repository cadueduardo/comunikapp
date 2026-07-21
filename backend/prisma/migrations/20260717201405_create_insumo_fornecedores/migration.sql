-- Fase 1 aditiva: cria a matriz sem alterar a unicidade legada de `insumos`.
CREATE TABLE `insumo_fornecedores` (
  `loja_id` VARCHAR(191) NOT NULL,
  `insumo_id` VARCHAR(191) NOT NULL,
  `fornecedor_id` VARCHAR(191) NOT NULL,
  `preco_custo` DECIMAL(10, 2) NOT NULL,
  `codigo_ref` VARCHAR(191) NULL,
  `padrao` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  INDEX `insumo_fornecedores_fornecedor_id_idx`(`fornecedor_id`),
  INDEX `insumo_fornecedores_loja_id_insumo_id_idx`(`loja_id`, `insumo_id`),
  INDEX `insumo_fornecedores_loja_id_fornecedor_id_idx`(`loja_id`, `fornecedor_id`),
  PRIMARY KEY (`insumo_id`, `fornecedor_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `insumo_fornecedores`
  ADD CONSTRAINT `insumo_fornecedores_loja_id_fkey`
  FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `insumo_fornecedores`
  ADD CONSTRAINT `insumo_fornecedores_insumo_id_fkey`
  FOREIGN KEY (`insumo_id`) REFERENCES `insumos`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `insumo_fornecedores`
  ADD CONSTRAINT `insumo_fornecedores_fornecedor_id_fkey`
  FOREIGN KEY (`fornecedor_id`) REFERENCES `fornecedor`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
