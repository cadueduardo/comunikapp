/*
  Warnings:

  - You are about to drop the column `createdAt` on the `usuario` table. All the data in the column will be lost.
  - You are about to drop the column `lojaId` on the `usuario` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `usuario` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `usuario` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `usuario` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `usuario` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `usuario` table. All the data in the column will be lost.
  - Added the required column `atualizado_em` to the `Usuario` table without a default value. This is not possible if the table is not empty.
  - Added the required column `loja_id` to the `Usuario` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nome_completo` to the `Usuario` table without a default value. This is not possible if the table is not empty.
  - Added the required column `senha` to the `Usuario` table without a default value. This is not possible if the table is not empty.
  - Added the required column `telefone` to the `Usuario` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `usuario` DROP FOREIGN KEY `Usuario_lojaId_fkey`;

-- AlterTable
ALTER TABLE `usuario` DROP COLUMN `createdAt`,
    DROP COLUMN `lojaId`,
    DROP COLUMN `name`,
    DROP COLUMN `password`,
    DROP COLUMN `phone`,
    DROP COLUMN `role`,
    DROP COLUMN `updatedAt`,
    ADD COLUMN `atualizado_em` DATETIME(3) NOT NULL,
    ADD COLUMN `codigo_verificacao_email` VARCHAR(191) NULL,
    ADD COLUMN `codigo_verificacao_email_expiracao` DATETIME(3) NULL,
    ADD COLUMN `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `email_verificado` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `funcao` ENUM('ADMINISTRADOR', 'FINANCEIRO', 'PRODUCAO', 'VENDAS', 'ESTOQUE') NOT NULL DEFAULT 'VENDAS',
    ADD COLUMN `loja_id` VARCHAR(191) NOT NULL,
    ADD COLUMN `nome_completo` VARCHAR(191) NOT NULL,
    ADD COLUMN `senha` VARCHAR(191) NOT NULL,
    ADD COLUMN `telefone` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE INDEX `Usuario_loja_id_idx` ON `Usuario`(`loja_id`);

-- AddForeignKey
ALTER TABLE `Usuario` ADD CONSTRAINT `Usuario_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `Loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
