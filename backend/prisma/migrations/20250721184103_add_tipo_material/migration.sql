-- AlterTable
ALTER TABLE `insumos` ADD COLUMN `tipoMaterialId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `TipoMaterial` (
    `id` VARCHAR(191) NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `descricao` VARCHAR(191) NULL,
    `logica_consumo` ENUM('area', 'perimetro', 'quantidade_fixa', 'custom') NOT NULL DEFAULT 'area',
    `parametros_padrao` JSON NULL,
    `loja_id` VARCHAR(191) NOT NULL,

    INDEX `TipoMaterial_loja_id_idx`(`loja_id`),
    UNIQUE INDEX `TipoMaterial_loja_id_nome_key`(`loja_id`, `nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `insumos` ADD CONSTRAINT `insumos_tipoMaterialId_fkey` FOREIGN KEY (`tipoMaterialId`) REFERENCES `TipoMaterial`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TipoMaterial` ADD CONSTRAINT `TipoMaterial_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `Loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
