-- AlterTable
ALTER TABLE `itemorcamento` ADD COLUMN `altura` DECIMAL(10, 3) NULL,
    ADD COLUMN `area_calculada` DECIMAL(10, 3) NULL,
    ADD COLUMN `largura` DECIMAL(10, 3) NULL,
    ADD COLUMN `unidade_medida` VARCHAR(191) NULL;
