-- AlterTable
ALTER TABLE `orcamento` ADD COLUMN `altura_produto` DECIMAL(10, 2) NULL,
    ADD COLUMN `area_produto` DECIMAL(10, 2) NULL,
    ADD COLUMN `largura_produto` DECIMAL(10, 2) NULL,
    ADD COLUMN `quantidade_produto` DECIMAL(10, 2) NULL,
    ADD COLUMN `unidade_medida_produto` VARCHAR(191) NULL;
