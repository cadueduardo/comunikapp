-- Fase 5 / critério RP 8.9 (37): contato comercial no orçamento (aditivo).
ALTER TABLE `orcamento`
  ADD COLUMN `contato_id` VARCHAR(191) NULL;

CREATE INDEX `orcamento_contato_id_idx` ON `orcamento`(`contato_id`);

ALTER TABLE `orcamento`
  ADD CONSTRAINT `orcamento_contato_id_fkey`
  FOREIGN KEY (`contato_id`) REFERENCES `cliente_contato`(`id`)
  ON DELETE SET NULL
  ON UPDATE CASCADE;
