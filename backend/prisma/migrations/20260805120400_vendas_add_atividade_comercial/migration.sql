-- M5.1 — atividade_comercial (próxima ação comercial)

CREATE TABLE `atividade_comercial` (
    `id` VARCHAR(191) NOT NULL,
    `loja_id` VARCHAR(191) NOT NULL,
    `cliente_id` VARCHAR(191) NULL,
    `orcamento_id` VARCHAR(191) NULL,
    `contato_id` VARCHAR(191) NULL,
    `responsavel_id` VARCHAR(191) NOT NULL,
    `criado_por` VARCHAR(191) NOT NULL,
    `concluida_por` VARCHAR(191) NULL,
    `tipo` VARCHAR(32) NOT NULL,
    `titulo` VARCHAR(200) NOT NULL,
    `descricao` TEXT NULL,
    `origem` VARCHAR(64) NULL,
    `prazo` DATETIME(3) NOT NULL,
    `prazo_desejado` DATETIME(3) NULL,
    `concluida_em` DATETIME(3) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `atividade_comercial_loja_id_responsavel_id_prazo_idx` ON `atividade_comercial`(`loja_id`, `responsavel_id`, `prazo`);
CREATE INDEX `atividade_comercial_loja_id_responsavel_id_concluida_em_idx` ON `atividade_comercial`(`loja_id`, `responsavel_id`, `concluida_em`);
CREATE INDEX `atividade_comercial_loja_id_cliente_id_idx` ON `atividade_comercial`(`loja_id`, `cliente_id`);
CREATE INDEX `atividade_comercial_loja_id_criado_em_idx` ON `atividade_comercial`(`loja_id`, `criado_em`);
CREATE INDEX `atividade_comercial_cliente_id_idx` ON `atividade_comercial`(`cliente_id`);
CREATE INDEX `atividade_comercial_orcamento_id_idx` ON `atividade_comercial`(`orcamento_id`);
CREATE INDEX `atividade_comercial_contato_id_idx` ON `atividade_comercial`(`contato_id`);
CREATE INDEX `atividade_comercial_responsavel_id_idx` ON `atividade_comercial`(`responsavel_id`);
CREATE INDEX `atividade_comercial_criado_por_idx` ON `atividade_comercial`(`criado_por`);
CREATE INDEX `atividade_comercial_concluida_por_idx` ON `atividade_comercial`(`concluida_por`);

ALTER TABLE `atividade_comercial` ADD CONSTRAINT `atividade_comercial_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `atividade_comercial` ADD CONSTRAINT `atividade_comercial_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `cliente`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `atividade_comercial` ADD CONSTRAINT `atividade_comercial_orcamento_id_fkey` FOREIGN KEY (`orcamento_id`) REFERENCES `orcamento`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `atividade_comercial` ADD CONSTRAINT `atividade_comercial_contato_id_fkey` FOREIGN KEY (`contato_id`) REFERENCES `cliente_contato`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `atividade_comercial` ADD CONSTRAINT `atividade_comercial_responsavel_id_fkey` FOREIGN KEY (`responsavel_id`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `atividade_comercial` ADD CONSTRAINT `atividade_comercial_criado_por_fkey` FOREIGN KEY (`criado_por`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `atividade_comercial` ADD CONSTRAINT `atividade_comercial_concluida_por_fkey` FOREIGN KEY (`concluida_por`) REFERENCES `usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
