-- CreateTable
CREATE TABLE `Insumo` (
    `id` VARCHAR(191) NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `unidade_medida` VARCHAR(191) NOT NULL,
    `custo_por_unidade` DECIMAL(10, 2) NOT NULL,
    `fornecedor` VARCHAR(191) NULL,
    `observacoes` TEXT NULL,
    `loja_id` VARCHAR(191) NOT NULL,

    INDEX `Insumo_loja_id_idx`(`loja_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Insumo` ADD CONSTRAINT `Insumo_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `Loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
