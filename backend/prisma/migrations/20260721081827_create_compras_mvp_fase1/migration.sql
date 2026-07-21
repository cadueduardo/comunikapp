-- CreateTable
CREATE TABLE `solicitacoes_compra` (
    `id` VARCHAR(191) NOT NULL,
    `loja_id` VARCHAR(191) NOT NULL,
    `numero` VARCHAR(191) NOT NULL,
    `status` ENUM('RASCUNHO', 'SOLICITADA', 'APROVADA', 'CONVERTIDA', 'REJEITADA', 'DEVOLVIDA', 'CANCELADA') NOT NULL DEFAULT 'RASCUNHO',
    `prioridade` ENUM('BAIXA', 'NORMAL', 'ALTA', 'URGENTE') NOT NULL DEFAULT 'NORMAL',
    `origem_tipo` ENUM('MANUAL', 'ORDEM_SERVICO', 'ITEM_OS', 'ORDEM_TERCEIRIZACAO', 'ESTOQUE', 'MANUTENCAO', 'ADMINISTRATIVO') NOT NULL DEFAULT 'MANUAL',
    `origem_id` VARCHAR(191) NULL,
    `solicitante_id` VARCHAR(191) NOT NULL,
    `justificativa` TEXT NULL,
    `data_necessaria` DATETIME(3) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    INDEX `solicitacoes_compra_loja_id_status_idx`(`loja_id`, `status`),
    INDEX `solicitacoes_compra_loja_id_origem_tipo_origem_id_idx`(`loja_id`, `origem_tipo`, `origem_id`),
    INDEX `solicitacoes_compra_solicitante_id_idx`(`solicitante_id`),
    UNIQUE INDEX `solicitacoes_compra_loja_id_numero_key`(`loja_id`, `numero`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `solicitacao_compra_itens` (
    `id` VARCHAR(191) NOT NULL,
    `loja_id` VARCHAR(191) NOT NULL,
    `solicitacao_id` VARCHAR(191) NOT NULL,
    `tipo` ENUM('MATERIAL', 'SERVICO', 'DESPESA') NOT NULL,
    `insumo_id` VARCHAR(191) NULL,
    `descricao` VARCHAR(191) NOT NULL,
    `quantidade` DECIMAL(12, 3) NOT NULL,
    `unidade` VARCHAR(191) NOT NULL,
    `item_os_id` VARCHAR(191) NULL,
    `ordem_terceirizacao_id` VARCHAR(191) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `solicitacao_compra_itens_loja_id_idx`(`loja_id`),
    INDEX `solicitacao_compra_itens_solicitacao_id_idx`(`solicitacao_id`),
    INDEX `solicitacao_compra_itens_insumo_id_idx`(`insumo_id`),
    INDEX `solicitacao_compra_itens_item_os_id_idx`(`item_os_id`),
    INDEX `solicitacao_compra_itens_ordem_terceirizacao_id_idx`(`ordem_terceirizacao_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pedidos_compra` (
    `id` VARCHAR(191) NOT NULL,
    `loja_id` VARCHAR(191) NOT NULL,
    `numero` VARCHAR(191) NOT NULL,
    `fornecedor_id` VARCHAR(191) NOT NULL,
    `status` ENUM('RASCUNHO', 'EM_APROVACAO', 'APROVADO', 'REJEITADO', 'ENVIADO', 'PARCIAL', 'ATENDIDO', 'CONCLUIDO', 'CANCELADO') NOT NULL DEFAULT 'RASCUNHO',
    `pedido_substituido_id` VARCHAR(191) NULL,
    `motivo_substituicao` TEXT NULL,
    `moeda` VARCHAR(3) NOT NULL DEFAULT 'BRL',
    `subtotal` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `desconto` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `frete` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `total` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `data_emissao` DATETIME(3) NULL,
    `data_prevista` DATETIME(3) NULL,
    `condicao_pagamento` VARCHAR(255) NULL,
    `observacoes` TEXT NULL,
    `aprovado_por` VARCHAR(191) NULL,
    `aprovado_em` DATETIME(3) NULL,
    `enviado_em` DATETIME(3) NULL,
    `cancelado_em` DATETIME(3) NULL,
    `cancelado_por` VARCHAR(191) NULL,
    `motivo_cancelamento` TEXT NULL,
    `versao` INTEGER NOT NULL DEFAULT 1,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    INDEX `pedidos_compra_loja_id_status_idx`(`loja_id`, `status`),
    INDEX `pedidos_compra_loja_id_fornecedor_id_idx`(`loja_id`, `fornecedor_id`),
    INDEX `pedidos_compra_pedido_substituido_id_idx`(`pedido_substituido_id`),
    UNIQUE INDEX `pedidos_compra_loja_id_numero_key`(`loja_id`, `numero`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pedido_compra_itens` (
    `id` VARCHAR(191) NOT NULL,
    `loja_id` VARCHAR(191) NOT NULL,
    `pedido_id` VARCHAR(191) NOT NULL,
    `solicitacao_item_id` VARCHAR(191) NULL,
    `tipo` ENUM('MATERIAL', 'SERVICO', 'DESPESA') NOT NULL,
    `insumo_id` VARCHAR(191) NULL,
    `ordem_terceirizacao_id` VARCHAR(191) NULL,
    `descricao_snapshot` VARCHAR(191) NOT NULL,
    `codigo_ref_snapshot` VARCHAR(191) NULL,
    `quantidade` DECIMAL(12, 3) NOT NULL,
    `unidade_snapshot` VARCHAR(191) NOT NULL,
    `preco_unitario` DECIMAL(12, 4) NOT NULL,
    `desconto` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `frete_rateado` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `total` DECIMAL(12, 2) NOT NULL,
    `quantidade_recebida` DECIMAL(12, 3) NOT NULL DEFAULT 0,
    `quantidade_aceita` DECIMAL(12, 3) NOT NULL DEFAULT 0,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    INDEX `pedido_compra_itens_loja_id_idx`(`loja_id`),
    INDEX `pedido_compra_itens_pedido_id_idx`(`pedido_id`),
    INDEX `pedido_compra_itens_solicitacao_item_id_idx`(`solicitacao_item_id`),
    INDEX `pedido_compra_itens_insumo_id_idx`(`insumo_id`),
    INDEX `pedido_compra_itens_ordem_terceirizacao_id_idx`(`ordem_terceirizacao_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pedido_compra_item_apropriacoes` (
    `id` VARCHAR(191) NOT NULL,
    `loja_id` VARCHAR(191) NOT NULL,
    `pedido_item_id` VARCHAR(191) NOT NULL,
    `destino_tipo` ENUM('OS', 'ITEM_OS', 'ESTOQUE', 'CENTRO_CUSTO') NOT NULL,
    `os_id` VARCHAR(191) NULL,
    `item_os_id` VARCHAR(191) NULL,
    `centro_custo` VARCHAR(191) NULL,
    `percentual` DECIMAL(5, 2) NULL,
    `valor_previsto` DECIMAL(12, 2) NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    INDEX `pedido_compra_item_apropriacoes_loja_id_idx`(`loja_id`),
    INDEX `pedido_compra_item_apropriacoes_pedido_item_id_idx`(`pedido_item_id`),
    INDEX `pedido_compra_item_apropriacoes_os_id_idx`(`os_id`),
    INDEX `pedido_compra_item_apropriacoes_item_os_id_idx`(`item_os_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `compras_historico` (
    `id` VARCHAR(191) NOT NULL,
    `loja_id` VARCHAR(191) NOT NULL,
    `entidade_tipo` VARCHAR(64) NOT NULL,
    `entidade_id` VARCHAR(191) NOT NULL,
    `acao` VARCHAR(64) NOT NULL,
    `status_anterior` VARCHAR(32) NULL,
    `status_novo` VARCHAR(32) NULL,
    `dados` JSON NULL,
    `usuario_id` VARCHAR(191) NULL,
    `ip` VARCHAR(191) NULL,
    `user_agent` VARCHAR(512) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `compras_historico_loja_id_entidade_tipo_entidade_id_idx`(`loja_id`, `entidade_tipo`, `entidade_id`),
    INDEX `compras_historico_loja_id_criado_em_idx`(`loja_id`, `criado_em`),
    INDEX `compras_historico_usuario_id_idx`(`usuario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `solicitacoes_compra` ADD CONSTRAINT `solicitacoes_compra_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `solicitacoes_compra` ADD CONSTRAINT `solicitacoes_compra_solicitante_id_fkey` FOREIGN KEY (`solicitante_id`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `solicitacao_compra_itens` ADD CONSTRAINT `solicitacao_compra_itens_solicitacao_id_fkey` FOREIGN KEY (`solicitacao_id`) REFERENCES `solicitacoes_compra`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `solicitacao_compra_itens` ADD CONSTRAINT `solicitacao_compra_itens_insumo_id_fkey` FOREIGN KEY (`insumo_id`) REFERENCES `insumos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `solicitacao_compra_itens` ADD CONSTRAINT `solicitacao_compra_itens_item_os_id_fkey` FOREIGN KEY (`item_os_id`) REFERENCES `itens_os`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `solicitacao_compra_itens` ADD CONSTRAINT `solicitacao_compra_itens_ordem_terceirizacao_id_fkey` FOREIGN KEY (`ordem_terceirizacao_id`) REFERENCES `ordens_terceirizacao`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedidos_compra` ADD CONSTRAINT `pedidos_compra_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedidos_compra` ADD CONSTRAINT `pedidos_compra_fornecedor_id_fkey` FOREIGN KEY (`fornecedor_id`) REFERENCES `fornecedor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedidos_compra` ADD CONSTRAINT `pedidos_compra_pedido_substituido_id_fkey` FOREIGN KEY (`pedido_substituido_id`) REFERENCES `pedidos_compra`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedido_compra_itens` ADD CONSTRAINT `pedido_compra_itens_pedido_id_fkey` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos_compra`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedido_compra_itens` ADD CONSTRAINT `pedido_compra_itens_solicitacao_item_id_fkey` FOREIGN KEY (`solicitacao_item_id`) REFERENCES `solicitacao_compra_itens`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedido_compra_itens` ADD CONSTRAINT `pedido_compra_itens_insumo_id_fkey` FOREIGN KEY (`insumo_id`) REFERENCES `insumos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedido_compra_itens` ADD CONSTRAINT `pedido_compra_itens_ordem_terceirizacao_id_fkey` FOREIGN KEY (`ordem_terceirizacao_id`) REFERENCES `ordens_terceirizacao`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedido_compra_item_apropriacoes` ADD CONSTRAINT `pedido_compra_item_apropriacoes_pedido_item_id_fkey` FOREIGN KEY (`pedido_item_id`) REFERENCES `pedido_compra_itens`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedido_compra_item_apropriacoes` ADD CONSTRAINT `pedido_compra_item_apropriacoes_os_id_fkey` FOREIGN KEY (`os_id`) REFERENCES `ordens_servico`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedido_compra_item_apropriacoes` ADD CONSTRAINT `pedido_compra_item_apropriacoes_item_os_id_fkey` FOREIGN KEY (`item_os_id`) REFERENCES `itens_os`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `compras_historico` ADD CONSTRAINT `compras_historico_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `compras_historico` ADD CONSTRAINT `compras_historico_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
