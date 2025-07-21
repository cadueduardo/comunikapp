-- AlterTable
ALTER TABLE `orcamento` ADD COLUMN `observacoes_cliente` TEXT NULL,
    ADD COLUMN `status_aprovacao` VARCHAR(191) NULL DEFAULT 'PENDENTE';
