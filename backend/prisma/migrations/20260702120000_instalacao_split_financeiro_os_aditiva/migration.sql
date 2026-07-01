-- Split Financeiro / OS Aditiva — Fase 5 evolutiva (100% aditivo)

-- OrdemServico: vínculo pai/filha e flags operacionais
ALTER TABLE `ordens_servico`
  ADD COLUMN `os_pai_id` VARCHAR(191) NULL,
  ADD COLUMN `tipo_vinculo_os` VARCHAR(24) NULL,
  ADD COLUMN `pular_pcp` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `pular_expedicao` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `pular_validacao_estoque` BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX `ordens_servico_loja_id_os_pai_id_idx` ON `ordens_servico`(`loja_id`, `os_pai_id`);
CREATE INDEX `ordens_servico_loja_id_tipo_vinculo_os_idx` ON `ordens_servico`(`loja_id`, `tipo_vinculo_os`);

ALTER TABLE `ordens_servico`
  ADD CONSTRAINT `ordens_servico_os_pai_id_fkey`
    FOREIGN KEY (`os_pai_id`) REFERENCES `ordens_servico`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- OcorrenciaInstalacao: workflow financeiro
ALTER TABLE `ocorrencias_instalacao`
  ADD COLUMN `status_financeiro` ENUM(
    'PENDENTE_PRECIFICACAO',
    'PRECIFICADO',
    'FATURADO',
    'ABONADO',
    'CANCELADO'
  ) NOT NULL DEFAULT 'PENDENTE_PRECIFICACAO',
  ADD COLUMN `custo_sugerido` DECIMAL(10, 2) NULL,
  ADD COLUMN `preco_sugerido` DECIMAL(10, 2) NULL,
  ADD COLUMN `precificado_por` VARCHAR(191) NULL,
  ADD COLUMN `precificado_em` DATETIME(3) NULL,
  ADD COLUMN `observacao_gestor` TEXT NULL,
  ADD COLUMN `os_aditiva_id` VARCHAR(191) NULL,
  ADD COLUMN `cobranca_parcela_id` VARCHAR(191) NULL,
  ADD COLUMN `versao` INTEGER NOT NULL DEFAULT 0;

-- Backfill legado: preservar sugestões e marcar como precificado quando havia valor
UPDATE `ocorrencias_instalacao`
SET
  `custo_sugerido` = `custo_interno`,
  `preco_sugerido` = `preco_cliente`,
  `status_financeiro` = CASE
    WHEN `preco_cliente` > 0 THEN 'PRECIFICADO'
    ELSE 'PENDENTE_PRECIFICACAO'
  END
WHERE `custo_sugerido` IS NULL;

-- Permite precificação gestor (valores finais nullable até PRECIFICADO)
ALTER TABLE `ocorrencias_instalacao`
  MODIFY COLUMN `custo_interno` DECIMAL(10, 2) NULL,
  MODIFY COLUMN `preco_cliente` DECIMAL(10, 2) NULL;

CREATE INDEX `ocorrencias_instalacao_loja_id_status_financeiro_idx`
  ON `ocorrencias_instalacao`(`loja_id`, `status_financeiro`);

CREATE INDEX `ocorrencias_instalacao_loja_id_status_financeiro_criado_em_idx`
  ON `ocorrencias_instalacao`(`loja_id`, `status_financeiro`, `criado_em`);

CREATE INDEX `ocorrencias_instalacao_os_aditiva_id_idx`
  ON `ocorrencias_instalacao`(`os_aditiva_id`);

ALTER TABLE `ocorrencias_instalacao`
  ADD CONSTRAINT `ocorrencias_instalacao_os_aditiva_id_fkey`
    FOREIGN KEY (`os_aditiva_id`) REFERENCES `ordens_servico`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Metadados do orçamento sintético vinculado à OS Aditiva
CREATE TABLE `orcamentos_aditivos_instalacao` (
  `id` VARCHAR(191) NOT NULL,
  `loja_id` VARCHAR(191) NOT NULL,
  `os_pai_id` VARCHAR(191) NOT NULL,
  `os_aditiva_id` VARCHAR(191) NOT NULL,
  `orcamento_id` VARCHAR(191) NOT NULL,
  `ocorrencias_snapshot` JSON NOT NULL,
  `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `orcamentos_aditivos_instalacao_os_aditiva_id_key`(`os_aditiva_id`),
  UNIQUE INDEX `orcamentos_aditivos_instalacao_orcamento_id_key`(`orcamento_id`),
  INDEX `orcamentos_aditivos_instalacao_loja_id_idx`(`loja_id`),
  INDEX `orcamentos_aditivos_instalacao_loja_id_os_pai_id_idx`(`loja_id`, `os_pai_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `orcamentos_aditivos_instalacao`
  ADD CONSTRAINT `orcamentos_aditivos_instalacao_loja_id_fkey`
    FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `orcamentos_aditivos_instalacao`
  ADD CONSTRAINT `orcamentos_aditivos_instalacao_os_pai_id_fkey`
    FOREIGN KEY (`os_pai_id`) REFERENCES `ordens_servico`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `orcamentos_aditivos_instalacao`
  ADD CONSTRAINT `orcamentos_aditivos_instalacao_os_aditiva_id_fkey`
    FOREIGN KEY (`os_aditiva_id`) REFERENCES `ordens_servico`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `orcamentos_aditivos_instalacao`
  ADD CONSTRAINT `orcamentos_aditivos_instalacao_orcamento_id_fkey`
    FOREIGN KEY (`orcamento_id`) REFERENCES `orcamento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
