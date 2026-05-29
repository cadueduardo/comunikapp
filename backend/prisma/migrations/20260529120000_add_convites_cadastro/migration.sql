CREATE TABLE `convites_cadastro` (
  `id` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `token_hash` VARCHAR(191) NOT NULL,
  `status` VARCHAR(24) NOT NULL DEFAULT 'PENDENTE',
  `mensagem` TEXT NULL,
  `criado_por_email` VARCHAR(255) NULL,
  `expira_em` DATETIME(3) NOT NULL,
  `usado_em` DATETIME(3) NULL,
  `revogado_em` DATETIME(3) NULL,
  `usado_por_loja_id` VARCHAR(191) NULL,
  `usado_por_usuario_id` VARCHAR(191) NULL,
  `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `atualizado_em` DATETIME(3) NOT NULL,

  UNIQUE INDEX `convites_cadastro_token_hash_key`(`token_hash`),
  INDEX `convites_cadastro_email_idx`(`email`),
  INDEX `convites_cadastro_status_idx`(`status`),
  INDEX `convites_cadastro_expira_em_idx`(`expira_em`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
