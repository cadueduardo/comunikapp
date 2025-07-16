/*
  Warnings:

  - You are about to drop the column `altura` on the `itemorcamento` table. All the data in the column will be lost.
  - You are about to drop the column `area_calculada` on the `itemorcamento` table. All the data in the column will be lost.
  - You are about to drop the column `largura` on the `itemorcamento` table. All the data in the column will be lost.
  - You are about to drop the column `unidade_medida` on the `itemorcamento` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `itemorcamento` DROP COLUMN `altura`,
    DROP COLUMN `area_calculada`,
    DROP COLUMN `largura`,
    DROP COLUMN `unidade_medida`;

-- AlterTable
ALTER TABLE `orcamento` ADD COLUMN `altura_produto` DECIMAL(10, 3) NULL,
    ADD COLUMN `area_produto` DECIMAL(10, 3) NULL,
    ADD COLUMN `largura_produto` DECIMAL(10, 3) NULL,
    ADD COLUMN `unidade_medida_produto` VARCHAR(191) NULL;
