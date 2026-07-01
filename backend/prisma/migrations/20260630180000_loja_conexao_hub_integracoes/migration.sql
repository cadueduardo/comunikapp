-- Hub de conexões (Google Drive, etc.) + pasta Drive por item de OS

CREATE TABLE `loja_conexao` (
  `id` VARCHAR(191) NOT NULL,
  `loja_id` VARCHAR(191) NOT NULL,
  `tipo` VARCHAR(32) NOT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'DESCONECTADO',
  `configuracao_json` JSON NULL,
  `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `atualizado_em` DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`),
  UNIQUE INDEX `loja_conexao_loja_id_tipo_key` (`loja_id`, `tipo`),
  INDEX `loja_conexao_loja_id_tipo_idx` (`loja_id`, `tipo`),
  INDEX `loja_conexao_loja_id_status_idx` (`loja_id`, `status`),
  CONSTRAINT `loja_conexao_loja_id_fkey`
    FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `itens_os`
  ADD COLUMN `arte_drive_folder_id` VARCHAR(191) NULL;
