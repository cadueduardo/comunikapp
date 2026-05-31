ALTER TABLE `itens_os`
  ADD COLUMN `sobra_acao` VARCHAR(32) NULL,
  ADD COLUMN `sobra_observacao` TEXT NULL,
  ADD COLUMN `sobra_registrada_id` VARCHAR(191) NULL;

ALTER TABLE `estoque_sobras`
  MODIFY COLUMN `estoque_id` VARCHAR(191) NULL,
  ADD COLUMN `insumo_id` VARCHAR(191) NULL,
  ADD COLUMN `largura` DECIMAL(10, 3) NULL,
  ADD COLUMN `altura` DECIMAL(10, 3) NULL,
  ADD COLUMN `espessura` DECIMAL(10, 3) NULL,
  ADD COLUMN `unidade_dimensao` VARCHAR(16) NULL,
  ADD COLUMN `area_disponivel` DECIMAL(10, 4) NULL,
  ADD COLUMN `area_original` DECIMAL(10, 4) NULL,
  ADD COLUMN `os_origem_id` VARCHAR(191) NULL,
  ADD COLUMN `item_os_origem_id` VARCHAR(191) NULL,
  ADD COLUMN `observacao_interna` TEXT NULL,
  ADD INDEX `idx_insumo_id` (`insumo_id`),
  ADD INDEX `idx_os_origem_id` (`os_origem_id`);
