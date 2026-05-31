ALTER TABLE `estoque_aproveitamentos`
  ADD COLUMN `os_destino_id` VARCHAR(191) NULL,
  ADD COLUMN `item_os_destino_id` VARCHAR(191) NULL,
  ADD COLUMN `insumo_id` VARCHAR(191) NULL,
  ADD COLUMN `area_aproveitada` DECIMAL(10, 4) NULL,
  ADD COLUMN `economia_gerada` DECIMAL(12, 2) NULL DEFAULT 0.00,
  ADD INDEX `idx_os_destino_id` (`os_destino_id`),
  ADD INDEX `idx_item_os_destino_id` (`item_os_destino_id`),
  ADD INDEX `idx_insumo_id` (`insumo_id`);

ALTER TABLE `estoque_sobras`
  MODIFY COLUMN `status` ENUM('DISPONIVEL', 'PARCIALMENTE_APROVEITADA', 'APROVEITADA', 'DESCARTADA') NULL DEFAULT 'DISPONIVEL';
