-- Fundação da Gestão ComunikApp: identidade administrativa separada,
-- sessões revogáveis, convites e auditoria append-only.

ALTER TABLE `loja`
  ADD COLUMN `session_version` INTEGER NOT NULL DEFAULT 0;

CREATE TABLE `admin_user` (
  `id` VARCHAR(191) NOT NULL,
  `nome` VARCHAR(160) NOT NULL,
  `email` VARCHAR(320) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('SUPER_ADMIN', 'OPERACAO', 'SUPORTE', 'FINANCEIRO_SAAS', 'ANALISTA') NOT NULL,
  `status` ENUM('ACTIVE', 'INACTIVE', 'BLOCKED') NOT NULL DEFAULT 'ACTIVE',
  `two_factor_enabled` BOOLEAN NOT NULL DEFAULT false,
  `two_factor_secret` TEXT NULL,
  `two_factor_confirmed_at` DATETIME(3) NULL,
  `failed_login_attempts` INTEGER NOT NULL DEFAULT 0,
  `locked_until` DATETIME(3) NULL,
  `last_login_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  UNIQUE INDEX `admin_user_email_key`(`email`),
  INDEX `admin_user_status_role_idx`(`status`, `role`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `admin_session` (
  `id` VARCHAR(191) NOT NULL,
  `admin_user_id` VARCHAR(191) NOT NULL,
  `expires_at` DATETIME(3) NOT NULL,
  `revoked_at` DATETIME(3) NULL,
  `revoke_reason` VARCHAR(255) NULL,
  `last_seen_at` DATETIME(3) NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` VARCHAR(512) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `admin_session_user_revoked_expires_idx`(`admin_user_id`, `revoked_at`, `expires_at`),
  INDEX `admin_session_expires_at_idx`(`expires_at`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `admin_invitation` (
  `id` VARCHAR(191) NOT NULL,
  `nome` VARCHAR(160) NOT NULL,
  `email` VARCHAR(320) NOT NULL,
  `role` ENUM('SUPER_ADMIN', 'OPERACAO', 'SUPORTE', 'FINANCEIRO_SAAS', 'ANALISTA') NOT NULL,
  `token_hash` VARCHAR(64) NOT NULL,
  `status` ENUM('PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  `expires_at` DATETIME(3) NOT NULL,
  `accepted_at` DATETIME(3) NULL,
  `cancelled_at` DATETIME(3) NULL,
  `invited_by_id` VARCHAR(191) NULL,
  `accepted_admin_user_id` VARCHAR(191) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  UNIQUE INDEX `admin_invitation_token_hash_key`(`token_hash`),
  UNIQUE INDEX `admin_invitation_accepted_user_key`(`accepted_admin_user_id`),
  INDEX `admin_invitation_email_status_idx`(`email`, `status`),
  INDEX `admin_invitation_status_expires_idx`(`status`, `expires_at`),
  INDEX `admin_invitation_invited_by_id_idx`(`invited_by_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `admin_audit_log` (
  `id` VARCHAR(191) NOT NULL,
  `occurred_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `admin_user_id` VARCHAR(191) NULL,
  `admin_role` ENUM('SUPER_ADMIN', 'OPERACAO', 'SUPORTE', 'FINANCEIRO_SAAS', 'ANALISTA') NULL,
  `action` VARCHAR(96) NOT NULL,
  `resource_type` VARCHAR(64) NOT NULL,
  `resource_id` VARCHAR(191) NULL,
  `loja_id` VARCHAR(191) NULL,
  `previous_state` JSON NULL,
  `new_state` JSON NULL,
  `reason` VARCHAR(1000) NULL,
  `category` VARCHAR(64) NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` VARCHAR(512) NULL,
  `correlation_id` VARCHAR(128) NULL,
  `metadata` JSON NULL,

  INDEX `admin_audit_log_occurred_at_idx`(`occurred_at`),
  INDEX `admin_audit_log_user_occurred_idx`(`admin_user_id`, `occurred_at`),
  INDEX `admin_audit_log_loja_occurred_idx`(`loja_id`, `occurred_at`),
  INDEX `admin_audit_log_action_occurred_idx`(`action`, `occurred_at`),
  INDEX `admin_audit_log_resource_idx`(`resource_type`, `resource_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `admin_session`
  ADD CONSTRAINT `admin_session_admin_user_id_fkey`
  FOREIGN KEY (`admin_user_id`) REFERENCES `admin_user`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `admin_invitation`
  ADD CONSTRAINT `admin_invitation_invited_by_id_fkey`
  FOREIGN KEY (`invited_by_id`) REFERENCES `admin_user`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `admin_invitation_accepted_user_id_fkey`
  FOREIGN KEY (`accepted_admin_user_id`) REFERENCES `admin_user`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `admin_audit_log`
  ADD CONSTRAINT `admin_audit_log_admin_user_id_fkey`
  FOREIGN KEY (`admin_user_id`) REFERENCES `admin_user`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `admin_audit_log_loja_id_fkey`
  FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;
