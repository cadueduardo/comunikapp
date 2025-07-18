/*
  Warnings:

  - A unique constraint covering the columns `[loja_id,nome,fornecedorId]` on the table `insumos` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `fator_conversao` to the `insumos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quantidade_compra` to the `insumos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unidade_uso` to the `insumos` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `insumos` ADD COLUMN `ativo` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `fator_conversao` DECIMAL(10, 4) NOT NULL DEFAULT 1.0000,
    ADD COLUMN `quantidade_compra` DECIMAL(10, 3) NOT NULL DEFAULT 1.000,
    ADD COLUMN `unidade_uso` VARCHAR(191) NOT NULL DEFAULT 'un';

-- CreateTable
CREATE TABLE `historico_preco_insumos` (
    `id` VARCHAR(191) NOT NULL,
    `insumo_id` VARCHAR(191) NOT NULL,
    `custo_anterior` DECIMAL(10, 2) NOT NULL,
    `custo_novo` DECIMAL(10, 2) NOT NULL,
    `data_alteracao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `motivo` TEXT NULL,
    `alterado_por` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `insumos_loja_id_nome_fornecedorId_key` ON `insumos`(`loja_id`, `nome`, `fornecedorId`);

-- AddForeignKey
ALTER TABLE `historico_preco_insumos` ADD CONSTRAINT `historico_preco_insumos_insumo_id_fkey` FOREIGN KEY (`insumo_id`) REFERENCES `insumos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
