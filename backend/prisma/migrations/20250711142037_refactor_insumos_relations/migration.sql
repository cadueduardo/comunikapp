/*
  Warnings:

  - You are about to drop the column `custo_por_unidade` on the `insumo` table. All the data in the column will be lost.
  - You are about to drop the column `fornecedor` on the `insumo` table. All the data in the column will be lost.
  - Added the required column `categoriaId` to the `Insumo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `custo_unitario` to the `Insumo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fornecedorId` to the `Insumo` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `insumo` DROP COLUMN `custo_por_unidade`,
    DROP COLUMN `fornecedor`,
    ADD COLUMN `categoriaId` VARCHAR(191) NOT NULL,
    ADD COLUMN `codigo_interno` VARCHAR(191) NULL,
    ADD COLUMN `custo_unitario` DOUBLE NOT NULL,
    ADD COLUMN `descricao_tecnica` TEXT NULL,
    ADD COLUMN `estoque_minimo` INTEGER NULL,
    ADD COLUMN `fornecedorId` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `CategoriaInsumo` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `loja_id` VARCHAR(191) NOT NULL,

    INDEX `CategoriaInsumo_loja_id_idx`(`loja_id`),
    UNIQUE INDEX `CategoriaInsumo_loja_id_nome_key`(`loja_id`, `nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Fornecedor` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `loja_id` VARCHAR(191) NOT NULL,

    INDEX `Fornecedor_loja_id_idx`(`loja_id`),
    UNIQUE INDEX `Fornecedor_loja_id_nome_key`(`loja_id`, `nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Insumo_categoriaId_idx` ON `Insumo`(`categoriaId`);

-- CreateIndex
CREATE INDEX `Insumo_fornecedorId_idx` ON `Insumo`(`fornecedorId`);

-- AddForeignKey
ALTER TABLE `Insumo` ADD CONSTRAINT `Insumo_categoriaId_fkey` FOREIGN KEY (`categoriaId`) REFERENCES `CategoriaInsumo`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Insumo` ADD CONSTRAINT `Insumo_fornecedorId_fkey` FOREIGN KEY (`fornecedorId`) REFERENCES `Fornecedor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CategoriaInsumo` ADD CONSTRAINT `CategoriaInsumo_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `Loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Fornecedor` ADD CONSTRAINT `Fornecedor_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `Loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
