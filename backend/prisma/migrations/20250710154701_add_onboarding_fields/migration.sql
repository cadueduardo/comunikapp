/*
  Warnings:

  - You are about to drop the column `cnpj` on the `loja` table. All the data in the column will be lost.
  - You are about to drop the column `ativo` on the `usuario` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[documento]` on the table `Loja` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `documento` to the `Loja` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tipo_pessoa` to the `Loja` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `Loja_cnpj_key` ON `loja`;

-- AlterTable
ALTER TABLE `loja` DROP COLUMN `cnpj`,
    ADD COLUMN `documento` VARCHAR(191) NOT NULL,
    ADD COLUMN `status` ENUM('PENDENTE_VERIFICACAO', 'ATIVO', 'INATIVO', 'BLOQUEADO') NOT NULL DEFAULT 'PENDENTE_VERIFICACAO',
    ADD COLUMN `tipo_pessoa` ENUM('PESSOA_FISICA', 'PESSOA_JURIDICA') NOT NULL;

-- AlterTable
ALTER TABLE `usuario` DROP COLUMN `ativo`,
    ADD COLUMN `status` ENUM('PENDENTE_VERIFICACAO', 'ATIVO', 'INATIVO', 'BLOQUEADO') NOT NULL DEFAULT 'PENDENTE_VERIFICACAO';

-- CreateIndex
CREATE UNIQUE INDEX `Loja_documento_key` ON `Loja`(`documento`);
