-- AlterTable
ALTER TABLE `funcao` ADD COLUMN `eficiencia_percent` DECIMAL(5, 2) NULL,
    ADD COLUMN `fator_acompanhamento` DECIMAL(10, 3) NULL,
    ADD COLUMN `horas_por_m2` DECIMAL(10, 3) NULL,
    ADD COLUMN `horas_por_unidade` DECIMAL(10, 3) NULL,
    ADD COLUMN `tipo_calculo` ENUM('ACOMPANHA_MAQUINA', 'POR_M2', 'POR_UNIDADE', 'MANUAL') NOT NULL DEFAULT 'MANUAL';

-- AlterTable
ALTER TABLE `maquina` ADD COLUMN `eficiencia_percent` DECIMAL(5, 2) NULL,
    ADD COLUMN `modo_producao` ENUM('M2_H', 'ML_H', 'MANUAL') NOT NULL DEFAULT 'M2_H',
    ADD COLUMN `setup_min` DECIMAL(10, 2) NULL,
    ADD COLUMN `velocidade_m2_h` DECIMAL(10, 2) NULL;

-- CreateTable
CREATE TABLE `modo_impressao` (
    `id` VARCHAR(191) NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `maquina_id` VARCHAR(191) NOT NULL,
    `loja_id` VARCHAR(191) NOT NULL,
    `velocidade_m2_h` DECIMAL(10, 2) NULL,
    `largura_mm` DECIMAL(10, 2) NULL,
    `resolucao_dpi` INTEGER NULL,
    `cores` VARCHAR(191) NULL,
    `observacoes` TEXT NULL,

    INDEX `ModoImpressao_maquina_id_idx`(`maquina_id`),
    INDEX `ModoImpressao_loja_id_idx`(`loja_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `servico_manual` (
    `id` VARCHAR(191) NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `descricao` TEXT NULL,
    `custo_hora` DECIMAL(10, 2) NOT NULL,
    `loja_id` VARCHAR(191) NOT NULL,
    `tipo_calculo` ENUM('ACOMPANHA_MAQUINA', 'POR_M2', 'POR_UNIDADE', 'MANUAL') NOT NULL DEFAULT 'MANUAL',
    `horas_por_m2` DECIMAL(10, 3) NULL,
    `horas_por_unidade` DECIMAL(10, 3) NULL,
    `eficiencia_percent` DECIMAL(5, 2) NULL,

    INDEX `ServicoManual_loja_id_idx`(`loja_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `modo_impressao` ADD CONSTRAINT `ModoImpressao_maquina_id_fkey` FOREIGN KEY (`maquina_id`) REFERENCES `maquina`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `modo_impressao` ADD CONSTRAINT `ModoImpressao_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `servico_manual` ADD CONSTRAINT `ServicoManual_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

