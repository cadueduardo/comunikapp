-- CreateTable
CREATE TABLE `Orcamento` (
    `id` VARCHAR(191) NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,
    `numero` VARCHAR(191) NOT NULL,
    `nome_servico` VARCHAR(191) NOT NULL,
    `descricao` TEXT NULL,
    `horas_producao` DECIMAL(10, 2) NOT NULL,
    `custo_material` DECIMAL(10, 2) NOT NULL,
    `custo_mao_obra` DECIMAL(10, 2) NOT NULL,
    `custo_indireto` DECIMAL(10, 2) NOT NULL,
    `custo_total` DECIMAL(10, 2) NOT NULL,
    `margem_lucro` DECIMAL(5, 2) NOT NULL,
    `impostos` DECIMAL(5, 2) NOT NULL,
    `preco_final` DECIMAL(10, 2) NOT NULL,
    `loja_id` VARCHAR(191) NOT NULL,
    `cliente_id` VARCHAR(191) NULL,

    INDEX `Orcamento_loja_id_idx`(`loja_id`),
    INDEX `Orcamento_loja_id_numero_idx`(`loja_id`, `numero`),
    UNIQUE INDEX `Orcamento_loja_id_numero_key`(`loja_id`, `numero`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ItemOrcamento` (
    `id` VARCHAR(191) NOT NULL,
    `orcamento_id` VARCHAR(191) NOT NULL,
    `insumo_id` VARCHAR(191) NOT NULL,
    `quantidade` DECIMAL(10, 3) NOT NULL,
    `custo_unitario` DECIMAL(10, 2) NOT NULL,
    `custo_total` DECIMAL(10, 2) NOT NULL,

    INDEX `ItemOrcamento_orcamento_id_idx`(`orcamento_id`),
    INDEX `ItemOrcamento_insumo_id_idx`(`insumo_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Orcamento` ADD CONSTRAINT `Orcamento_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `Loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Orcamento` ADD CONSTRAINT `Orcamento_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `Cliente`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ItemOrcamento` ADD CONSTRAINT `ItemOrcamento_orcamento_id_fkey` FOREIGN KEY (`orcamento_id`) REFERENCES `Orcamento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ItemOrcamento` ADD CONSTRAINT `ItemOrcamento_insumo_id_fkey` FOREIGN KEY (`insumo_id`) REFERENCES `insumos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
