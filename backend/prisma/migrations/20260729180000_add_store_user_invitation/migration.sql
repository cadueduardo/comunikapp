-- Convites de usuário vinculados a uma loja (Gestão F01.2).

CREATE TABLE `store_user_invitation` (
  `id` VARCHAR(191) NOT NULL,
  `loja_id` VARCHAR(191) NOT NULL,
  `usuario_id` VARCHAR(191) NOT NULL,
  `nome` VARCHAR(160) NOT NULL,
  `email` VARCHAR(320) NOT NULL,
  `funcao` ENUM('ADMINISTRADOR', 'FINANCEIRO', 'PRODUCAO', 'VENDAS', 'ESTOQUE') NOT NULL,
  `telefone` VARCHAR(32) NULL,
  `mensagem` TEXT NULL,
  `token_hash` VARCHAR(64) NOT NULL,
  `status` ENUM('PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  `expires_at` DATETIME(3) NOT NULL,
  `accepted_at` DATETIME(3) NULL,
  `cancelled_at` DATETIME(3) NULL,
  `invited_by_id` VARCHAR(191) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  UNIQUE INDEX `store_user_invitation_token_hash_key`(`token_hash`),
  INDEX `store_user_invitation_loja_status_idx`(`loja_id`, `status`),
  INDEX `store_user_invitation_loja_email_idx`(`loja_id`, `email`),
  INDEX `store_user_invitation_email_status_idx`(`email`, `status`),
  INDEX `store_user_invitation_status_expires_idx`(`status`, `expires_at`),
  INDEX `store_user_invitation_usuario_id_idx`(`usuario_id`),
  INDEX `store_user_invitation_invited_by_id_idx`(`invited_by_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `store_user_invitation`
  ADD CONSTRAINT `store_user_invitation_loja_id_fkey`
    FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `store_user_invitation_usuario_id_fkey`
    FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `store_user_invitation_invited_by_id_fkey`
    FOREIGN KEY (`invited_by_id`) REFERENCES `admin_user`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;
