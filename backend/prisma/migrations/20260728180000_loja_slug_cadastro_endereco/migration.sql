-- Fatia A: slug + cadastro/endereço (pré-NF) na loja.

ALTER TABLE `loja`
  ADD COLUMN `slug` VARCHAR(191) NULL,
  ADD COLUMN `razao_social` VARCHAR(191) NULL,
  ADD COLUMN `nome_fantasia` VARCHAR(191) NULL,
  ADD COLUMN `inscricao_estadual` VARCHAR(191) NULL,
  ADD COLUMN `inscricao_municipal` VARCHAR(191) NULL,
  ADD COLUMN `cep` VARCHAR(16) NULL,
  ADD COLUMN `logradouro` VARCHAR(191) NULL,
  ADD COLUMN `numero` VARCHAR(32) NULL,
  ADD COLUMN `complemento` VARCHAR(191) NULL,
  ADD COLUMN `bairro` VARCHAR(191) NULL,
  ADD COLUMN `cidade` VARCHAR(191) NULL,
  ADD COLUMN `uf` VARCHAR(2) NULL;

-- Backfill provisório único por id (script TS pode normalizar nomes depois).
UPDATE `loja`
SET `slug` = CONCAT('loja-', LOWER(LEFT(REPLACE(`id`, '-', ''), 12)))
WHERE `slug` IS NULL OR `slug` = '';

ALTER TABLE `loja` MODIFY `slug` VARCHAR(191) NOT NULL;

CREATE UNIQUE INDEX `Loja_slug_key` ON `loja`(`slug`);
