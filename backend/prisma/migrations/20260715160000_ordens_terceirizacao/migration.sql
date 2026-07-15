CREATE TABLE `ordens_terceirizacao` (
  `id` VARCHAR(191) NOT NULL,
  `loja_id` VARCHAR(191) NOT NULL,
  `item_os_id` VARCHAR(191) NOT NULL,
  `fornecedor_id` VARCHAR(191) NOT NULL,
  `status` ENUM('A_COTAR', 'COTADO', 'PEDIDO_ENVIADO', 'EM_PRODUCAO', 'PRONTO', 'EM_TRANSITO', 'RECEBIDO', 'ENTREGUE', 'CANCELADO') NOT NULL DEFAULT 'A_COTAR',
  `custo_unitario` DECIMAL(12, 2) NULL,
  `custo_setup` DECIMAL(12, 2) NULL,
  `custo_frete` DECIMAL(12, 2) NULL,
  `custo_total` DECIMAL(12, 2) NULL,
  `prazo_dias` INTEGER NULL,
  `data_prevista` DATETIME(3) NULL,
  `observacoes` TEXT NULL,
  `pedido_enviado_em` DATETIME(3) NULL,
  `iniciado_em` DATETIME(3) NULL,
  `concluido_em` DATETIME(3) NULL,
  `recebido_em` DATETIME(3) NULL,
  `entregue_em` DATETIME(3) NULL,
  `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `atualizado_em` DATETIME(3) NOT NULL,

  UNIQUE INDEX `ordens_terceirizacao_item_os_id_key`(`item_os_id`),
  INDEX `ordens_terceirizacao_loja_id_status_idx`(`loja_id`, `status`),
  INDEX `ordens_terceirizacao_fornecedor_id_status_idx`(`fornecedor_id`, `status`),
  INDEX `ordens_terceirizacao_data_prevista_idx`(`data_prevista`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `ordens_terceirizacao`
  ADD CONSTRAINT `ordens_terceirizacao_loja_id_fkey`
  FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `ordens_terceirizacao`
  ADD CONSTRAINT `ordens_terceirizacao_item_os_id_fkey`
  FOREIGN KEY (`item_os_id`) REFERENCES `itens_os`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `ordens_terceirizacao`
  ADD CONSTRAINT `ordens_terceirizacao_fornecedor_id_fkey`
  FOREIGN KEY (`fornecedor_id`) REFERENCES `fornecedor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
