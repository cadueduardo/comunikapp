-- Módulo Arte & Aprovação — Fase 1 (fundação)

ALTER TABLE `servico_manual`
  ADD COLUMN `sistema` BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX `ServicoManual_loja_id_sistema_idx` ON `servico_manual`(`loja_id`, `sistema`);

CREATE TABLE `configuracao_arte_loja` (
  `id` VARCHAR(191) NOT NULL,
  `loja_id` VARCHAR(191) NOT NULL,
  `ativo` BOOLEAN NOT NULL DEFAULT true,
  `modelo_precificacao` VARCHAR(24) NOT NULL DEFAULT 'HORA',
  `servico_arte_id` VARCHAR(191) NULL,
  `cobranca_padrao` VARCHAR(32) NOT NULL DEFAULT 'INCLUIDA_NO_PRODUTO',
  `horas_padrao_criacao` DECIMAL(10, 2) NOT NULL DEFAULT 1.00,
  `horas_padrao_adaptacao` DECIMAL(10, 2) NOT NULL DEFAULT 0.50,
  `exibir_linha_pdf` BOOLEAN NOT NULL DEFAULT false,
  `permitir_edicao_orcamentista` BOOLEAN NOT NULL DEFAULT true,
  `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `atualizado_em` DATETIME(3) NOT NULL,

  UNIQUE INDEX `configuracao_arte_loja_loja_id_key`(`loja_id`),
  INDEX `configuracao_arte_loja_servico_arte_id_idx`(`servico_arte_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `configuracao_arte_loja`
  ADD CONSTRAINT `configuracao_arte_loja_loja_id_fkey`
    FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `configuracao_arte_loja_servico_arte_id_fkey`
    FOREIGN KEY (`servico_arte_id`) REFERENCES `servico_manual`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `ProdutoOrcamento`
  ADD COLUMN `responsabilidade_arte` VARCHAR(32) NOT NULL DEFAULT 'NAO_APLICAVEL',
  ADD COLUMN `politica_cobranca_arte` VARCHAR(32) NOT NULL DEFAULT 'NAO_APLICAVEL',
  ADD COLUMN `finalidade_anexo` VARCHAR(32) NULL,
  ADD COLUMN `complexidade_arte` VARCHAR(16) NULL,
  ADD COLUMN `arte_custo_automatico` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `arte_referencia_servico_id` VARCHAR(191) NULL,
  ADD COLUMN `arte_horas_calculadas` DECIMAL(10, 2) NULL,
  ADD COLUMN `arte_custo_calculado` DECIMAL(10, 2) NULL;

ALTER TABLE `itens_os`
  ADD COLUMN `responsabilidade_arte` VARCHAR(32) NOT NULL DEFAULT 'NAO_APLICAVEL',
  ADD COLUMN `politica_cobranca_arte` VARCHAR(32) NOT NULL DEFAULT 'NAO_APLICAVEL',
  ADD COLUMN `finalidade_anexo` VARCHAR(32) NULL,
  ADD COLUMN `complexidade_arte` VARCHAR(16) NULL,
  ADD COLUMN `status_arte` VARCHAR(32) NOT NULL DEFAULT 'NAO_APLICA',
  ADD COLUMN `designer_atribuido_id` VARCHAR(191) NULL,
  ADD COLUMN `arte_fila_desde` DATETIME(3) NULL,
  ADD COLUMN `arte_assumido_em` DATETIME(3) NULL;

CREATE INDEX `itens_os_status_arte_idx` ON `itens_os`(`status_arte`);
CREATE INDEX `itens_os_responsabilidade_arte_idx` ON `itens_os`(`responsabilidade_arte`);
CREATE INDEX `itens_os_designer_atribuido_id_idx` ON `itens_os`(`designer_atribuido_id`);

ALTER TABLE `itens_os`
  ADD CONSTRAINT `itens_os_designer_atribuido_id_fkey`
    FOREIGN KEY (`designer_atribuido_id`) REFERENCES `usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `ItemServicoManual`
  ADD COLUMN `origem` VARCHAR(32) NOT NULL DEFAULT 'MANUAL',
  ADD COLUMN `exibir_no_pdf` BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX `ItemServicoManual_produto_id_origem_idx` ON `ItemServicoManual`(`produto_id`, `origem`);
