-- AlterTable
ALTER TABLE `setores_produtivos` ADD COLUMN `horas_produtivas_mensais` INTEGER NULL,
    ADD COLUMN `percentual_rateio_geral` DECIMAL(5, 2) NULL;

-- AlterTable
ALTER TABLE `custoindireto` ADD COLUMN `setor_id` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `funcao` ADD COLUMN `setor_id` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `maquina` ADD COLUMN `setor_id` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `servico_manual` ADD COLUMN `setor_id` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `CustoIndireto_setor_id_idx` ON `custoindireto`(`setor_id`);

-- CreateIndex
CREATE INDEX `Funcao_setor_id_idx` ON `funcao`(`setor_id`);

-- CreateIndex
CREATE INDEX `Maquina_setor_id_idx` ON `maquina`(`setor_id`);

-- CreateIndex
CREATE INDEX `ServicoManual_setor_id_idx` ON `servico_manual`(`setor_id`);

-- AddForeignKey
ALTER TABLE `custoindireto` ADD CONSTRAINT `CustoIndireto_setor_id_fkey` FOREIGN KEY (`setor_id`) REFERENCES `setores_produtivos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `funcao` ADD CONSTRAINT `Funcao_setor_id_fkey` FOREIGN KEY (`setor_id`) REFERENCES `setores_produtivos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `maquina` ADD CONSTRAINT `Maquina_setor_id_fkey` FOREIGN KEY (`setor_id`) REFERENCES `setores_produtivos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `servico_manual` ADD CONSTRAINT `ServicoManual_setor_id_fkey` FOREIGN KEY (`setor_id`) REFERENCES `setores_produtivos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
