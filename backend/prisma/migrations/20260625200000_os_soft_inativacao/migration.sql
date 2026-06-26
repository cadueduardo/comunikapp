-- Soft inativação de OS (testes / limpeza operacional sem delete físico)
ALTER TABLE `ordens_servico`
  ADD COLUMN `ativo` BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN `inativado_em` DATETIME(3) NULL,
  ADD COLUMN `inativado_por` VARCHAR(191) NULL,
  ADD COLUMN `motivo_inativacao` TEXT NULL,
  ADD COLUMN `status_antes_inativacao` VARCHAR(191) NULL,
  ADD COLUMN `snapshot_antes_inativacao` LONGTEXT NULL;

CREATE INDEX `ordens_servico_loja_id_ativo_idx` ON `ordens_servico`(`loja_id`, `ativo`);
