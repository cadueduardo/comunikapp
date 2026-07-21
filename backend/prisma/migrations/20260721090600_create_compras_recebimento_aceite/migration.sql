-- CreateTable
CREATE TABLE `recebimentos_compra` (
    `id` VARCHAR(191) NOT NULL,
    `loja_id` VARCHAR(191) NOT NULL,
    `pedido_id` VARCHAR(191) NOT NULL,
    `numero` VARCHAR(191) NOT NULL,
    `status` ENUM('RASCUNHO', 'CONFIRMADO', 'CANCELADO', 'ESTORNADO') NOT NULL DEFAULT 'RASCUNHO',
    `data_recebimento` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `responsavel_id` VARCHAR(191) NOT NULL,
    `observacao` TEXT NULL,
    `chave_idempotente` VARCHAR(191) NULL,
    `movimento_estoque_ok` BOOLEAN NOT NULL DEFAULT false,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    INDEX `recebimentos_compra_loja_id_status_idx`(`loja_id`, `status`),
    INDEX `recebimentos_compra_pedido_id_idx`(`pedido_id`),
    INDEX `recebimentos_compra_responsavel_id_idx`(`responsavel_id`),
    UNIQUE INDEX `recebimentos_compra_loja_id_numero_key`(`loja_id`, `numero`),
    UNIQUE INDEX `recebimentos_compra_loja_id_chave_idempotente_key`(`loja_id`, `chave_idempotente`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `recebimento_compra_itens` (
    `id` VARCHAR(191) NOT NULL,
    `loja_id` VARCHAR(191) NOT NULL,
    `recebimento_id` VARCHAR(191) NOT NULL,
    `pedido_item_id` VARCHAR(191) NOT NULL,
    `quantidade_recebida` DECIMAL(12, 3) NOT NULL,
    `quantidade_aceita` DECIMAL(12, 3) NOT NULL,
    `quantidade_recusada` DECIMAL(12, 3) NOT NULL,
    `localizacao_id` VARCHAR(191) NULL,
    `estoque_item_id` VARCHAR(191) NULL,
    `lote_codigo` VARCHAR(191) NULL,
    `observacao` VARCHAR(191) NULL,
    `movimento_ref` VARCHAR(191) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `recebimento_compra_itens_loja_id_idx`(`loja_id`),
    INDEX `recebimento_compra_itens_recebimento_id_idx`(`recebimento_id`),
    INDEX `recebimento_compra_itens_pedido_item_id_idx`(`pedido_item_id`),
    INDEX `recebimento_compra_itens_localizacao_id_idx`(`localizacao_id`),
    INDEX `recebimento_compra_itens_estoque_item_id_idx`(`estoque_item_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `aceites_servico` (
    `id` VARCHAR(191) NOT NULL,
    `loja_id` VARCHAR(191) NOT NULL,
    `pedido_id` VARCHAR(191) NOT NULL,
    `numero` VARCHAR(191) NOT NULL,
    `status` ENUM('RASCUNHO', 'CONFIRMADO', 'CANCELADO', 'ESTORNADO') NOT NULL DEFAULT 'RASCUNHO',
    `periodo_inicio` DATETIME(3) NULL,
    `periodo_fim` DATETIME(3) NULL,
    `responsavel_id` VARCHAR(191) NOT NULL,
    `aceite_final` BOOLEAN NOT NULL DEFAULT false,
    `observacao` TEXT NULL,
    `chave_idempotente` VARCHAR(191) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    INDEX `aceites_servico_loja_id_status_idx`(`loja_id`, `status`),
    INDEX `aceites_servico_pedido_id_idx`(`pedido_id`),
    INDEX `aceites_servico_responsavel_id_idx`(`responsavel_id`),
    UNIQUE INDEX `aceites_servico_loja_id_numero_key`(`loja_id`, `numero`),
    UNIQUE INDEX `aceites_servico_loja_id_chave_idempotente_key`(`loja_id`, `chave_idempotente`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `aceite_servico_itens` (
    `id` VARCHAR(191) NOT NULL,
    `loja_id` VARCHAR(191) NOT NULL,
    `aceite_id` VARCHAR(191) NOT NULL,
    `pedido_item_id` VARCHAR(191) NOT NULL,
    `quantidade_aceita` DECIMAL(12, 3) NULL,
    `percentual_aceito` DECIMAL(5, 2) NULL,
    `valor_aceito` DECIMAL(12, 2) NULL,
    `observacao` VARCHAR(191) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `aceite_servico_itens_loja_id_idx`(`loja_id`),
    INDEX `aceite_servico_itens_aceite_id_idx`(`aceite_id`),
    INDEX `aceite_servico_itens_pedido_item_id_idx`(`pedido_item_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `recebimentos_compra` ADD CONSTRAINT `recebimentos_compra_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recebimentos_compra` ADD CONSTRAINT `recebimentos_compra_pedido_id_fkey` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos_compra`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recebimentos_compra` ADD CONSTRAINT `recebimentos_compra_responsavel_id_fkey` FOREIGN KEY (`responsavel_id`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recebimento_compra_itens` ADD CONSTRAINT `recebimento_compra_itens_recebimento_id_fkey` FOREIGN KEY (`recebimento_id`) REFERENCES `recebimentos_compra`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recebimento_compra_itens` ADD CONSTRAINT `recebimento_compra_itens_pedido_item_id_fkey` FOREIGN KEY (`pedido_item_id`) REFERENCES `pedido_compra_itens`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aceites_servico` ADD CONSTRAINT `aceites_servico_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aceites_servico` ADD CONSTRAINT `aceites_servico_pedido_id_fkey` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos_compra`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aceites_servico` ADD CONSTRAINT `aceites_servico_responsavel_id_fkey` FOREIGN KEY (`responsavel_id`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aceite_servico_itens` ADD CONSTRAINT `aceite_servico_itens_aceite_id_fkey` FOREIGN KEY (`aceite_id`) REFERENCES `aceites_servico`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aceite_servico_itens` ADD CONSTRAINT `aceite_servico_itens_pedido_item_id_fkey` FOREIGN KEY (`pedido_item_id`) REFERENCES `pedido_compra_itens`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
