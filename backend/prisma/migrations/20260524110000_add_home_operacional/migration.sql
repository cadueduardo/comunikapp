-- Fase 1 Home operacional: tabela de onboarding por loja + campos de
-- condicao de pagamento padrao na loja.
-- Ver docs/fase-0-home-operacional/03-onboarding-etapas.md
-- Ver docs/fase-0-home-operacional/08-configuracao-recomendada-defaults.md

-- AlterTable: novos campos opcionais em `loja`
ALTER TABLE `loja`
  ADD COLUMN `condicao_pagamento_padrao_tipo` VARCHAR(32) NULL,
  ADD COLUMN `condicao_pagamento_padrao_entrada_pct` DECIMAL(5, 2) NULL,
  ADD COLUMN `condicao_pagamento_padrao_descricao` VARCHAR(255) NULL;

-- CreateTable: onboarding_operacional
CREATE TABLE `onboarding_operacional` (
  `id` VARCHAR(191) NOT NULL,
  `loja_id` VARCHAR(191) NOT NULL,
  `step_id` VARCHAR(64) NOT NULL,
  `status` VARCHAR(16) NOT NULL DEFAULT 'pendente',
  `concluido_em` DATETIME(3) NULL,
  `ignorado_em` DATETIME(3) NULL,
  `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `atualizado_em` DATETIME(3) NOT NULL,

  UNIQUE INDEX `onboarding_operacional_loja_id_step_id_key` (`loja_id`, `step_id`),
  INDEX `onboarding_operacional_loja_id_idx` (`loja_id`),
  INDEX `onboarding_operacional_status_idx` (`status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `onboarding_operacional`
  ADD CONSTRAINT `onboarding_operacional_loja_id_fkey`
  FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
