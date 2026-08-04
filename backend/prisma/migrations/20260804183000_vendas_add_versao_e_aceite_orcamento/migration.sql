-- Fase 1 / M1.2 — versão enviada/aceita, evidência de aceite e snapshot Json.
-- Aditiva e posterior a M1.1 / HS-04 / HS-05. Não remove `dados_completos`.
-- Dual-write app: snapshot + dados_completos; backfill só JSON válido.

ALTER TABLE `orcamento`
  ADD COLUMN `versao_enviada_id` VARCHAR(191) NULL,
  ADD COLUMN `versao_aceita_id` VARCHAR(191) NULL,
  ADD COLUMN `enviado_em` DATETIME(3) NULL,
  ADD COLUMN `aceito_em` DATETIME(3) NULL,
  ADD COLUMN `aceite_evidencia` JSON NULL;

ALTER TABLE `versaoorcamento`
  ADD COLUMN `snapshot` JSON NULL,
  ADD COLUMN `hash_material` CHAR(64) NULL;

UPDATE `versaoorcamento`
SET `snapshot` = CAST(`dados_completos` AS JSON)
WHERE `dados_completos` IS NOT NULL
  AND `dados_completos` <> ''
  AND JSON_VALID(`dados_completos`);

CREATE INDEX `orcamento_versao_enviada_id_idx` ON `orcamento`(`versao_enviada_id`);
CREATE INDEX `orcamento_versao_aceita_id_idx` ON `orcamento`(`versao_aceita_id`);

ALTER TABLE `orcamento`
  ADD CONSTRAINT `orcamento_versao_enviada_id_fkey`
    FOREIGN KEY (`versao_enviada_id`) REFERENCES `versaoorcamento`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `orcamento`
  ADD CONSTRAINT `orcamento_versao_aceita_id_fkey`
    FOREIGN KEY (`versao_aceita_id`) REFERENCES `versaoorcamento`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;
