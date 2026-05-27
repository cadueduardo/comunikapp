CREATE TABLE `password_reset_token` (
  `id` VARCHAR(191) NOT NULL,
  `usuario_id` VARCHAR(191) NOT NULL,
  `token_hash` VARCHAR(64) NOT NULL,
  `expires_at` DATETIME(3) NOT NULL,
  `used_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `PasswordResetToken_token_hash_key`(`token_hash`),
  INDEX `PasswordResetToken_usuario_id_idx`(`usuario_id`),
  INDEX `PasswordResetToken_expires_at_idx`(`expires_at`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `password_reset_token`
  ADD CONSTRAINT `PasswordResetToken_usuario_id_fkey`
  FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
