-- AlterTable
ALTER TABLE `fornecedor` ADD COLUMN `bairro` VARCHAR(191) NULL,
    ADD COLUMN `cep` VARCHAR(191) NULL,
    ADD COLUMN `cidade` VARCHAR(191) NULL,
    ADD COLUMN `cnpj_cpf` VARCHAR(191) NULL,
    ADD COLUMN `complemento` VARCHAR(191) NULL,
    ADD COLUMN `contato_nome` VARCHAR(191) NULL,
    ADD COLUMN `email` VARCHAR(191) NULL,
    ADD COLUMN `endereco` VARCHAR(191) NULL,
    ADD COLUMN `especialidades` JSON NULL,
    ADD COLUMN `estado` VARCHAR(191) NULL,
    ADD COLUMN `numero` VARCHAR(191) NULL,
    ADD COLUMN `razao_social` VARCHAR(191) NULL,
    ADD COLUMN `telefone` VARCHAR(191) NULL,
    ADD COLUMN `tipo` ENUM('INSUMO', 'TERCEIRIZADO', 'AMBOS') NOT NULL DEFAULT 'INSUMO',
    ADD COLUMN `whatsapp` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `itens_os` ADD COLUMN `fornecedor_id` VARCHAR(191) NULL,
    MODIFY `modo_fulfillment` ENUM('PICK', 'MAKE', 'HIBRIDO', 'OUTSOURCE') NULL DEFAULT 'PICK';

-- CreateIndex
CREATE INDEX `itens_os_fornecedor_id_idx` ON `itens_os`(`fornecedor_id`);

-- AddForeignKey
ALTER TABLE `itens_os` ADD CONSTRAINT `ItemOS_fornecedor_id_fkey` FOREIGN KEY (`fornecedor_id`) REFERENCES `fornecedor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
