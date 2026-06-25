-- Módulo Expedição e Pós-Produção (100% aditivo)
-- Adiciona campo retrabalho na OS e tabela expedicoes_logistica

-- AlterTable
ALTER TABLE `ordens_servico` ADD COLUMN `retrabalho` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `expedicoes_logistica` (
    `id` VARCHAR(191) NOT NULL,
    `loja_id` VARCHAR(191) NOT NULL,
    `os_id` VARCHAR(191) NOT NULL,
    `modalidade` ENUM('RETIRADA_CLIENTE', 'ENTREGA_TRANSPORTADORA', 'ENTREGA_FROTA_PROPRIA', 'INSTALACAO_NO_LOCAL') NOT NULL DEFAULT 'RETIRADA_CLIENTE',
    `status` ENUM('AGUARDANDO_SEPARACAO', 'PRONTO_PARA_RETIRADA', 'EM_ROTA_DE_ENTREGA', 'AGUARDANDO_INSTALACAO', 'ENTREGUE_FINALIZADO', 'ARQUIVADO', 'DEVOLVIDA') NOT NULL DEFAULT 'AGUARDANDO_SEPARACAO',
    `codigo_rastreio` VARCHAR(100) NULL,
    `data_expedida` DATETIME(3) NULL,
    `data_conclusao` DATETIME(3) NULL,
    `recebedor_nome` VARCHAR(150) NULL,
    `recebedor_doc` VARCHAR(50) NULL,
    `url_assinatura` TEXT NULL,
    `observacoes` TEXT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    INDEX `expedicoes_logistica_loja_id_idx`(`loja_id`),
    INDEX `expedicoes_logistica_loja_id_status_idx`(`loja_id`, `status`),
    INDEX `expedicoes_logistica_loja_id_os_id_idx`(`loja_id`, `os_id`),
    INDEX `expedicoes_logistica_os_id_idx`(`os_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `ordens_servico_loja_id_retrabalho_idx` ON `ordens_servico`(`loja_id`, `retrabalho`);

-- AddForeignKey
ALTER TABLE `expedicoes_logistica` ADD CONSTRAINT `expedicoes_logistica_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expedicoes_logistica` ADD CONSTRAINT `expedicoes_logistica_os_id_fkey` FOREIGN KEY (`os_id`) REFERENCES `ordens_servico`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
