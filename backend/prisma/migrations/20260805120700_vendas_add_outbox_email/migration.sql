-- M5 — outbox de e-mail interno comercial (DV-08)

CREATE TABLE `outbox_email_vendas` (
    `id` VARCHAR(191) NOT NULL,
    `loja_id` VARCHAR(191) NOT NULL,
    `chave_dedup` VARCHAR(191) NOT NULL,
    `evento` VARCHAR(64) NOT NULL,
    `canal` VARCHAR(16) NOT NULL DEFAULT 'email',
    `destinatario_usuario_id` VARCHAR(191) NULL,
    `destinatario_email_hash` CHAR(64) NOT NULL,
    `assunto_sanitizado` VARCHAR(200) NOT NULL,
    `template_codigo` VARCHAR(64) NOT NULL,
    `payload_sanitizado` JSON NOT NULL,
    `estado` VARCHAR(24) NOT NULL,
    `tentativas` INTEGER NOT NULL DEFAULT 0,
    `max_tentativas` INTEGER NOT NULL DEFAULT 5,
    `proxima_tentativa_em` DATETIME(3) NOT NULL,
    `processado_em` DATETIME(3) NULL,
    `bloqueado_em` DATETIME(3) NULL,
    `bloqueado_por` VARCHAR(64) NULL,
    `ultimo_erro_sanitizado` VARCHAR(500) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE UNIQUE INDEX `outbox_email_vendas_loja_id_chave_dedup_key` ON `outbox_email_vendas`(`loja_id`, `chave_dedup`);
CREATE INDEX `outbox_email_vendas_estado_proxima_tentativa_em_criado_em_idx` ON `outbox_email_vendas`(`estado`, `proxima_tentativa_em`, `criado_em`);
CREATE INDEX `outbox_email_vendas_destinatario_usuario_id_idx` ON `outbox_email_vendas`(`destinatario_usuario_id`);
CREATE INDEX `outbox_email_vendas_loja_id_idx` ON `outbox_email_vendas`(`loja_id`);

ALTER TABLE `outbox_email_vendas` ADD CONSTRAINT `outbox_email_vendas_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `outbox_email_vendas` ADD CONSTRAINT `outbox_email_vendas_destinatario_usuario_id_fkey` FOREIGN KEY (`destinatario_usuario_id`) REFERENCES `usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
