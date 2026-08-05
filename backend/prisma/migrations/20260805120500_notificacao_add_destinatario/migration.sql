-- M5.2 — destinatário por usuário em notificacao (DV-08)

ALTER TABLE `notificacao` ADD COLUMN `usuario_id` VARCHAR(191) NULL;
ALTER TABLE `notificacao` ADD COLUMN `lida_em` DATETIME(3) NULL;
ALTER TABLE `notificacao` ADD COLUMN `url_destino` VARCHAR(512) NULL;
ALTER TABLE `notificacao` ADD COLUMN `chave_dedup` VARCHAR(191) NULL;

CREATE UNIQUE INDEX `notificacao_loja_id_chave_dedup_key` ON `notificacao`(`loja_id`, `chave_dedup`);
CREATE INDEX `notificacao_usuario_id_idx` ON `notificacao`(`usuario_id`);
CREATE INDEX `notificacao_loja_id_usuario_id_visualizada_idx` ON `notificacao`(`loja_id`, `usuario_id`, `visualizada`);

ALTER TABLE `notificacao` ADD CONSTRAINT `notificacao_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
