/*
  Warnings:

  - You are about to drop the column `unidade_medida` on the `insumos` table. All the data in the column will be lost.
  - Added the required column `unidade_compra` to the `insumos` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
-- Primeiro adicionar a nova coluna
ALTER TABLE `insumos` ADD COLUMN `unidade_compra` VARCHAR(191) NOT NULL DEFAULT 'UNID';

-- Copiar dados da coluna antiga para a nova
UPDATE `insumos` SET `unidade_compra` = `unidade_medida` WHERE `unidade_medida` IS NOT NULL;

-- Remover a coluna antiga
ALTER TABLE `insumos` DROP COLUMN `unidade_medida`;
