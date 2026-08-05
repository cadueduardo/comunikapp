-- M4.1 — responsável comercial do cliente (DV-11 / carteira).
-- Aditiva. NÃO altera `cliente.responsavel` (contato interno do cliente).

ALTER TABLE `cliente`
  ADD COLUMN `responsavel_comercial_id` VARCHAR(191) NULL,
  ADD COLUMN `responsavel_desde` DATETIME(3) NULL;

CREATE INDEX `cliente_loja_id_responsavel_comercial_id_idx`
  ON `cliente`(`loja_id`, `responsavel_comercial_id`);

CREATE INDEX `cliente_loja_id_atualizado_em_idx`
  ON `cliente`(`loja_id`, `atualizado_em`);

CREATE INDEX `cliente_responsavel_comercial_id_idx`
  ON `cliente`(`responsavel_comercial_id`);

ALTER TABLE `cliente`
  ADD CONSTRAINT `cliente_responsavel_comercial_id_fkey`
    FOREIGN KEY (`responsavel_comercial_id`) REFERENCES `usuario`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;
