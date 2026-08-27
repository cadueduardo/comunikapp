-- RBAC de Usuários: revogação por conta, concorrência de perfil e auditoria da loja.
ALTER TABLE `usuario`
  ADD COLUMN `session_version` INTEGER NOT NULL DEFAULT 0;

ALTER TABLE `perfil_acesso`
  ADD COLUMN `versao` INTEGER NOT NULL DEFAULT 1;

CREATE TABLE `loja_audit_log` (
  `id` VARCHAR(191) NOT NULL,
  `occurred_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `loja_id` VARCHAR(191) NOT NULL,
  `ator_id` VARCHAR(191) NULL,
  `action` VARCHAR(96) NOT NULL,
  `resource_type` VARCHAR(64) NOT NULL,
  `resource_id` VARCHAR(191) NULL,
  `previous_state` JSON NULL,
  `new_state` JSON NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` VARCHAR(512) NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `loja_audit_log_loja_id_occurred_at_idx` ON `loja_audit_log`(`loja_id`, `occurred_at`);
CREATE INDEX `loja_audit_log_ator_id_occurred_at_idx` ON `loja_audit_log`(`ator_id`, `occurred_at`);
CREATE INDEX `loja_audit_log_resource_type_resource_id_idx` ON `loja_audit_log`(`resource_type`, `resource_id`);

ALTER TABLE `loja_audit_log`
  ADD CONSTRAINT `loja_audit_log_loja_id_fkey`
  FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `loja_audit_log`
  ADD CONSTRAINT `loja_audit_log_ator_id_fkey`
  FOREIGN KEY (`ator_id`) REFERENCES `usuario`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
