/*
  Warnings:

  - You are about to drop the `categoriainsumo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `insumo` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `categoriainsumo` DROP FOREIGN KEY `CategoriaInsumo_loja_id_fkey`;

-- DropForeignKey
ALTER TABLE `insumo` DROP FOREIGN KEY `Insumo_categoriaId_fkey`;

-- DropForeignKey
ALTER TABLE `insumo` DROP FOREIGN KEY `Insumo_fornecedorId_fkey`;

-- DropForeignKey
ALTER TABLE `insumo` DROP FOREIGN KEY `Insumo_loja_id_fkey`;

-- DropTable
DROP TABLE `categoriainsumo`;

-- DropTable
DROP TABLE `insumo`;

-- CreateTable
CREATE TABLE `insumos` (
    `id` VARCHAR(191) NOT NULL,
    `loja_id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `descricao_tecnica` VARCHAR(191) NULL,
    `unidade_medida` VARCHAR(191) NOT NULL,
    `custo_unitario` DECIMAL(10, 2) NOT NULL,
    `estoque_minimo` INTEGER NULL,
    `codigo_interno` VARCHAR(191) NULL,
    `observacoes` VARCHAR(191) NULL,
    `categoriaId` VARCHAR(191) NOT NULL,
    `fornecedorId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categorias` (
    `id` VARCHAR(191) NOT NULL,
    `loja_id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `categorias_loja_id_nome_key`(`loja_id`, `nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `insumos` ADD CONSTRAINT `insumos_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `Loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `insumos` ADD CONSTRAINT `insumos_categoriaId_fkey` FOREIGN KEY (`categoriaId`) REFERENCES `categorias`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `insumos` ADD CONSTRAINT `insumos_fornecedorId_fkey` FOREIGN KEY (`fornecedorId`) REFERENCES `Fornecedor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `categorias` ADD CONSTRAINT `categorias_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `Loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
