/*
  Warnings:

  - Added the required column `atualizado_em` to the `insumos` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `insumos` ADD COLUMN `atualizado_em` DATETIME(3) NOT NULL,
    ADD COLUMN `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
