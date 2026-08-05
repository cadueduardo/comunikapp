-- M4.3 — contatos do cliente + campos normalizados de deduplicação (alerta, sem UNIQUE).

CREATE TABLE `cliente_contato` (
  `id` VARCHAR(191) NOT NULL,
  `loja_id` VARCHAR(191) NOT NULL,
  `cliente_id` VARCHAR(191) NOT NULL,
  `nome` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NULL,
  `telefone` VARCHAR(191) NULL,
  `whatsapp` VARCHAR(191) NULL,
  `cargo` VARCHAR(191) NULL,
  `papeis` JSON NOT NULL,
  `principal` BOOLEAN NOT NULL DEFAULT false,
  `ativo` BOOLEAN NOT NULL DEFAULT true,
  `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `atualizado_em` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE UNIQUE INDEX `cliente_contato_loja_id_cliente_id_email_key`
  ON `cliente_contato`(`loja_id`, `cliente_id`, `email`);

CREATE INDEX `cliente_contato_loja_id_cliente_id_idx`
  ON `cliente_contato`(`loja_id`, `cliente_id`);

CREATE INDEX `cliente_contato_loja_id_email_idx`
  ON `cliente_contato`(`loja_id`, `email`);

CREATE INDEX `cliente_contato_cliente_id_idx`
  ON `cliente_contato`(`cliente_id`);

ALTER TABLE `cliente_contato`
  ADD CONSTRAINT `cliente_contato_loja_id_fkey`
    FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `cliente_contato_cliente_id_fkey`
    FOREIGN KEY (`cliente_id`) REFERENCES `cliente`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `cliente`
  ADD COLUMN `documento_normalizado` VARCHAR(191) NULL,
  ADD COLUMN `email_normalizado` VARCHAR(191) NULL,
  ADD COLUMN `telefone_normalizado` VARCHAR(191) NULL;

UPDATE `cliente`
SET
  `documento_normalizado` = NULLIF(REGEXP_REPLACE(`documento`, '[^0-9]', ''), ''),
  `email_normalizado` = NULLIF(LOWER(TRIM(`email`)), ''),
  `telefone_normalizado` = NULLIF(
    REGEXP_REPLACE(COALESCE(`telefone`, `whatsapp`, ''), '[^0-9]', ''),
    ''
  )
WHERE
  `documento_normalizado` IS NULL
  OR `email_normalizado` IS NULL
  OR `telefone_normalizado` IS NULL;

CREATE INDEX `cliente_loja_id_documento_normalizado_idx`
  ON `cliente`(`loja_id`, `documento_normalizado`);

CREATE INDEX `cliente_loja_id_email_normalizado_idx`
  ON `cliente`(`loja_id`, `email_normalizado`);

CREATE INDEX `cliente_loja_id_telefone_normalizado_idx`
  ON `cliente`(`loja_id`, `telefone_normalizado`);
