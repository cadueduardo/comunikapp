-- AlterTable
ALTER TABLE `pedido_compra_item_apropriacoes` MODIFY `destino_tipo` ENUM('OS', 'ITEM_OS', 'ESTOQUE', 'CENTRO_CUSTO', 'ADMINISTRATIVO') NOT NULL;

-- CreateTable
CREATE TABLE `contas_pagar` (
    `id` VARCHAR(191) NOT NULL,
    `loja_id` VARCHAR(191) NOT NULL,
    `fornecedor_id` VARCHAR(191) NOT NULL,
    `pedido_id` VARCHAR(191) NULL,
    `tipo_documento` VARCHAR(191) NOT NULL,
    `numero_documento` VARCHAR(191) NOT NULL,
    `data_emissao` DATETIME(3) NOT NULL,
    `data_competencia` DATETIME(3) NULL,
    `valor_total` DECIMAL(12, 2) NOT NULL,
    `valor_pago` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `status` ENUM('PREVISTA', 'ABERTA', 'PARCIAL_PAGO', 'PAGA', 'VENCIDA', 'CANCELADA') NOT NULL DEFAULT 'PREVISTA',
    `observacao` TEXT NULL,
    `chave_idempotente` VARCHAR(191) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    INDEX `contas_pagar_loja_id_status_idx`(`loja_id`, `status`),
    INDEX `contas_pagar_fornecedor_id_idx`(`fornecedor_id`),
    INDEX `contas_pagar_pedido_id_idx`(`pedido_id`),
    UNIQUE INDEX `contas_pagar_loja_id_fornecedor_id_tipo_documento_numero_doc_key`(`loja_id`, `fornecedor_id`, `tipo_documento`, `numero_documento`),
    UNIQUE INDEX `contas_pagar_loja_id_chave_idempotente_key`(`loja_id`, `chave_idempotente`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contas_pagar_parcelas` (
    `id` VARCHAR(191) NOT NULL,
    `loja_id` VARCHAR(191) NOT NULL,
    `conta_pagar_id` VARCHAR(191) NOT NULL,
    `numero_parcela` INTEGER NOT NULL,
    `valor_previsto` DECIMAL(12, 2) NOT NULL,
    `valor_pago` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `data_vencimento` DATETIME(3) NOT NULL,
    `status` ENUM('PREVISTO', 'PARCIAL_PAGO', 'PAGO', 'VENCIDO', 'CANCELADA') NOT NULL DEFAULT 'PREVISTO',
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    INDEX `contas_pagar_parcelas_loja_id_idx`(`loja_id`),
    INDEX `contas_pagar_parcelas_conta_pagar_id_idx`(`conta_pagar_id`),
    UNIQUE INDEX `contas_pagar_parcelas_conta_pagar_id_numero_parcela_key`(`conta_pagar_id`, `numero_parcela`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pagamentos_fornecedor` (
    `id` VARCHAR(191) NOT NULL,
    `loja_id` VARCHAR(191) NOT NULL,
    `conta_pagar_id` VARCHAR(191) NOT NULL,
    `parcela_id` VARCHAR(191) NULL,
    `valor` DECIMAL(12, 2) NOT NULL,
    `data_pagamento` DATETIME(3) NOT NULL,
    `metodo` VARCHAR(191) NOT NULL,
    `referencia` VARCHAR(191) NULL,
    `usuario_id` VARCHAR(191) NOT NULL,
    `estornado` BOOLEAN NOT NULL DEFAULT false,
    `estornado_em` DATETIME(3) NULL,
    `estornado_por` VARCHAR(191) NULL,
    `motivo_estorno` TEXT NULL,
    `chave_idempotente` VARCHAR(191) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `pagamentos_fornecedor_loja_id_idx`(`loja_id`),
    INDEX `pagamentos_fornecedor_conta_pagar_id_idx`(`conta_pagar_id`),
    INDEX `pagamentos_fornecedor_parcela_id_idx`(`parcela_id`),
    INDEX `pagamentos_fornecedor_usuario_id_idx`(`usuario_id`),
    UNIQUE INDEX `pagamentos_fornecedor_loja_id_chave_idempotente_key`(`loja_id`, `chave_idempotente`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pagamentos_fornecedor_apropriacoes` (
    `id` VARCHAR(191) NOT NULL,
    `loja_id` VARCHAR(191) NOT NULL,
    `pagamento_id` VARCHAR(191) NOT NULL,
    `destino_tipo` ENUM('OS', 'ITEM_OS', 'ESTOQUE', 'CENTRO_CUSTO', 'ADMINISTRATIVO') NOT NULL,
    `os_id` VARCHAR(191) NULL,
    `item_os_id` VARCHAR(191) NULL,
    `centro_custo` VARCHAR(191) NULL,
    `pedido_item_apropriacao_id` VARCHAR(191) NULL,
    `valor` DECIMAL(12, 2) NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `pagamentos_fornecedor_apropriacoes_loja_id_idx`(`loja_id`),
    INDEX `pagamentos_fornecedor_apropriacoes_pagamento_id_idx`(`pagamento_id`),
    INDEX `pagamentos_fornecedor_apropriacoes_os_id_idx`(`os_id`),
    INDEX `pagamentos_fornecedor_apropriacoes_item_os_id_idx`(`item_os_id`),
    INDEX `pagamentos_fornecedor_apropriacoes_pedido_item_apropriacao_i_idx`(`pedido_item_apropriacao_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `contas_pagar` ADD CONSTRAINT `contas_pagar_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contas_pagar` ADD CONSTRAINT `contas_pagar_fornecedor_id_fkey` FOREIGN KEY (`fornecedor_id`) REFERENCES `fornecedor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contas_pagar` ADD CONSTRAINT `contas_pagar_pedido_id_fkey` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos_compra`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contas_pagar_parcelas` ADD CONSTRAINT `contas_pagar_parcelas_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contas_pagar_parcelas` ADD CONSTRAINT `contas_pagar_parcelas_conta_pagar_id_fkey` FOREIGN KEY (`conta_pagar_id`) REFERENCES `contas_pagar`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pagamentos_fornecedor` ADD CONSTRAINT `pagamentos_fornecedor_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pagamentos_fornecedor` ADD CONSTRAINT `pagamentos_fornecedor_conta_pagar_id_fkey` FOREIGN KEY (`conta_pagar_id`) REFERENCES `contas_pagar`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pagamentos_fornecedor` ADD CONSTRAINT `pagamentos_fornecedor_parcela_id_fkey` FOREIGN KEY (`parcela_id`) REFERENCES `contas_pagar_parcelas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pagamentos_fornecedor` ADD CONSTRAINT `pagamentos_fornecedor_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pagamentos_fornecedor_apropriacoes` ADD CONSTRAINT `pagamentos_fornecedor_apropriacoes_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pagamentos_fornecedor_apropriacoes` ADD CONSTRAINT `pagamentos_fornecedor_apropriacoes_pagamento_id_fkey` FOREIGN KEY (`pagamento_id`) REFERENCES `pagamentos_fornecedor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pagamentos_fornecedor_apropriacoes` ADD CONSTRAINT `pagamentos_fornecedor_apropriacoes_os_id_fkey` FOREIGN KEY (`os_id`) REFERENCES `ordens_servico`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pagamentos_fornecedor_apropriacoes` ADD CONSTRAINT `pagamentos_fornecedor_apropriacoes_item_os_id_fkey` FOREIGN KEY (`item_os_id`) REFERENCES `itens_os`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pagamentos_fornecedor_apropriacoes` ADD CONSTRAINT `pagamentos_fornecedor_apropriacoes_pedido_item_apropriacao__fkey` FOREIGN KEY (`pedido_item_apropriacao_id`) REFERENCES `pedido_compra_item_apropriacoes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

