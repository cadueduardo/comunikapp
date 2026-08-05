-- M5 — idempotência do Novo atendimento

CREATE TABLE `atendimento_idempotencia` (
    `id` VARCHAR(191) NOT NULL,
    `loja_id` VARCHAR(191) NOT NULL,
    `usuario_id` VARCHAR(191) NOT NULL,
    `chave_operacao` VARCHAR(200) NOT NULL,
    `payload_hash` CHAR(64) NOT NULL,
    `resultado` JSON NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE UNIQUE INDEX `atendimento_idempotencia_loja_id_usuario_id_chave_operacao_key` ON `atendimento_idempotencia`(`loja_id`, `usuario_id`, `chave_operacao`);
CREATE INDEX `atendimento_idempotencia_loja_id_criado_em_idx` ON `atendimento_idempotencia`(`loja_id`, `criado_em`);
CREATE INDEX `atendimento_idempotencia_usuario_id_idx` ON `atendimento_idempotencia`(`usuario_id`);

ALTER TABLE `atendimento_idempotencia` ADD CONSTRAINT `atendimento_idempotencia_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `atendimento_idempotencia` ADD CONSTRAINT `atendimento_idempotencia_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
