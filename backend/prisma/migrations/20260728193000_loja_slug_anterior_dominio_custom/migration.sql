-- Fatia C: slug_anterior (301) + domínio custom (wizard/verificação).

ALTER TABLE `loja`
  ADD COLUMN `slug_anterior` VARCHAR(191) NULL,
  ADD COLUMN `slug_atualizado_em` DATETIME(3) NULL,
  ADD COLUMN `dominio_custom` VARCHAR(253) NULL,
  ADD COLUMN `dominio_custom_status` VARCHAR(24) NULL,
  ADD COLUMN `dominio_custom_token` VARCHAR(64) NULL,
  ADD COLUMN `dominio_custom_verificado_em` DATETIME(3) NULL;

CREATE UNIQUE INDEX `Loja_slug_anterior_key` ON `loja`(`slug_anterior`);
CREATE UNIQUE INDEX `Loja_dominio_custom_key` ON `loja`(`dominio_custom`);
