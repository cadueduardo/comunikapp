-- CreateTable: fechamento financeiro da OS (Fase 5 pós-cálculo)
CREATE TABLE `fechamentos_financeiros_os` (
    `id` VARCHAR(191) NOT NULL,
    `loja_id` VARCHAR(191) NOT NULL,
    `os_id` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDENTE', 'EM_CONCILIACAO', 'FECHADO', 'REABERTO') NOT NULL DEFAULT 'PENDENTE',
    `fechado_em` DATETIME(3) NULL,
    `fechado_por` VARCHAR(191) NULL,
    `reaberto_em` DATETIME(3) NULL,
    `reaberto_por` VARCHAR(191) NULL,
    `motivo_reabertura` TEXT NULL,
    `versao` INTEGER NOT NULL DEFAULT 1,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    INDEX `fechamentos_financeiros_os_loja_id_idx`(`loja_id`),
    INDEX `fechamentos_financeiros_os_os_id_idx`(`os_id`),
    INDEX `fechamentos_financeiros_os_status_idx`(`status`),
    INDEX `fechamentos_financeiros_os_fechado_por_idx`(`fechado_por`),
    INDEX `fechamentos_financeiros_os_reaberto_por_idx`(`reaberto_por`),
    UNIQUE INDEX `fechamentos_financeiros_os_loja_id_os_id_key`(`loja_id`, `os_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `fechamentos_financeiros_os` ADD CONSTRAINT `fechamentos_financeiros_os_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fechamentos_financeiros_os` ADD CONSTRAINT `fechamentos_financeiros_os_os_id_fkey` FOREIGN KEY (`os_id`) REFERENCES `ordens_servico`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fechamentos_financeiros_os` ADD CONSTRAINT `fechamentos_financeiros_os_fechado_por_fkey` FOREIGN KEY (`fechado_por`) REFERENCES `usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fechamentos_financeiros_os` ADD CONSTRAINT `fechamentos_financeiros_os_reaberto_por_fkey` FOREIGN KEY (`reaberto_por`) REFERENCES `usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
