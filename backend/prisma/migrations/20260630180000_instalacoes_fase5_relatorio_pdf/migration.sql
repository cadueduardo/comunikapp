-- Fase 5: relatório técnico PDF, split fiscal e status A_FATURAR

ALTER TABLE `cobranca_parcelas`
  MODIFY COLUMN `status` VARCHAR(32) NOT NULL DEFAULT 'PREVISTO';

CREATE TABLE `relatorios_tecnicos_instalacao` (
  `id` VARCHAR(191) NOT NULL,
  `loja_id` VARCHAR(191) NOT NULL,
  `os_id` VARCHAR(191) NOT NULL,
  `pdf_token` VARCHAR(36) NOT NULL,
  `pdf_url` VARCHAR(512) NOT NULL,
  `total_nfe` DECIMAL(12, 2) NOT NULL,
  `total_nfs` DECIMAL(12, 2) NOT NULL,
  `split_detalhes` JSON NULL,
  `gerado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `gerado_por` VARCHAR(191) NULL,

  UNIQUE INDEX `relatorios_tecnicos_instalacao_os_id_key`(`os_id`),
  UNIQUE INDEX `relatorios_tecnicos_instalacao_pdf_token_key`(`pdf_token`),
  INDEX `relatorios_tecnicos_instalacao_loja_id_idx`(`loja_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `relatorios_tecnicos_instalacao`
  ADD CONSTRAINT `relatorios_tecnicos_instalacao_loja_id_fkey`
    FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `relatorios_tecnicos_instalacao`
  ADD CONSTRAINT `relatorios_tecnicos_instalacao_os_id_fkey`
    FOREIGN KEY (`os_id`) REFERENCES `ordens_servico`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
