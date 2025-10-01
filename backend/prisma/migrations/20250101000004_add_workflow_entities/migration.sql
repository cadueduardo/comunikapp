-- Migration: Adicionar entidades de workflow para PCP
-- Data: 2025-01-01
-- Objetivo: Implementar entidades de workflow conforme PLANO Fase 2

-- Tabela para instâncias de workflow por OS
CREATE TABLE `workflow_instancia` (
  `id` VARCHAR(191) NOT NULL,
  `os_id` VARCHAR(191) NOT NULL,
  `workflow_id` VARCHAR(191) NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'ATIVO',
  `etapa_atual` VARCHAR(191) NULL,
  `data_inicio` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `data_fim` DATETIME(3) NULL,
  `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `atualizado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE INDEX `workflow_instancia_os_id_key`(`os_id`),
  INDEX `workflow_instancia_workflow_id_idx`(`workflow_id`),
  INDEX `workflow_instancia_status_idx`(`status`),
  INDEX `workflow_instancia_etapa_atual_idx`(`etapa_atual`),
  INDEX `workflow_instancia_data_inicio_idx`(`data_inicio`),

  CONSTRAINT `workflow_instancia_os_id_fkey` FOREIGN KEY (`os_id`) REFERENCES `ordens_servico`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `workflow_instancia_workflow_id_fkey` FOREIGN KEY (`workflow_id`) REFERENCES `workflows_os`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Tabela para etapas de instância de workflow
CREATE TABLE `etapa_instancia` (
  `id` VARCHAR(191) NOT NULL,
  `workflow_instancia_id` VARCHAR(191) NOT NULL,
  `etapa_nome` VARCHAR(191) NOT NULL,
  `ordem` INT NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'PENDENTE',
  `data_inicio` DATETIME(3) NULL,
  `data_fim` DATETIME(3) NULL,
  `responsavel_id` VARCHAR(191) NULL,
  `tempo_estimado` INT NULL COMMENT 'Tempo estimado em minutos',
  `tempo_real` INT NULL COMMENT 'Tempo real em minutos',
  `observacoes` TEXT NULL,
  `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `atualizado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  INDEX `etapa_instancia_workflow_instancia_id_idx`(`workflow_instancia_id`),
  INDEX `etapa_instancia_etapa_nome_idx`(`etapa_nome`),
  INDEX `etapa_instancia_status_idx`(`status`),
  INDEX `etapa_instancia_ordem_idx`(`ordem`),
  INDEX `etapa_instancia_responsavel_id_idx`(`responsavel_id`),

  CONSTRAINT `etapa_instancia_workflow_instancia_id_fkey` FOREIGN KEY (`workflow_instancia_id`) REFERENCES `workflow_instancia`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Tabela para checklists de instância de workflow
CREATE TABLE `checklist_instancia` (
  `id` VARCHAR(191) NOT NULL,
  `etapa_instancia_id` VARCHAR(191) NOT NULL,
  `item_descricao` VARCHAR(500) NOT NULL,
  `obrigatorio` BOOLEAN NOT NULL DEFAULT true,
  `concluido` BOOLEAN NOT NULL DEFAULT false,
  `concluido_por` VARCHAR(191) NULL,
  `data_conclusao` DATETIME(3) NULL,
  `observacoes` TEXT NULL,
  `ordem` INT NOT NULL DEFAULT 0,
  `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `atualizado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  INDEX `checklist_instancia_etapa_instancia_id_idx`(`etapa_instancia_id`),
  INDEX `checklist_instancia_concluido_idx`(`concluido`),
  INDEX `checklist_instancia_ordem_idx`(`ordem`),

  CONSTRAINT `checklist_instancia_etapa_instancia_id_fkey` FOREIGN KEY (`etapa_instancia_id`) REFERENCES `etapa_instancia`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Tabela para apontamentos de produção
CREATE TABLE `apontamento` (
  `id` VARCHAR(191) NOT NULL,
  `os_id` VARCHAR(191) NOT NULL,
  `etapa_instancia_id` VARCHAR(191) NULL,
  `tipo` VARCHAR(191) NOT NULL COMMENT 'INICIO, PAUSA, RETOMADA, CONCLUSAO, REFUGO',
  `data_apontamento` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `usuario_id` VARCHAR(191) NOT NULL,
  `observacoes` TEXT NULL,
  `quantidade_produzida` DECIMAL(10, 3) NULL,
  `quantidade_refugo` DECIMAL(10, 3) NULL,
  `tempo_gasto` INT NULL COMMENT 'Tempo gasto em minutos',
  `ip_origem` VARCHAR(191) NULL,
  `user_agent` VARCHAR(500) NULL,
  `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  INDEX `apontamento_os_id_idx`(`os_id`),
  INDEX `apontamento_etapa_instancia_id_idx`(`etapa_instancia_id`),
  INDEX `apontamento_tipo_idx`(`tipo`),
  INDEX `apontamento_data_apontamento_idx`(`data_apontamento`),
  INDEX `apontamento_usuario_id_idx`(`usuario_id`),

  CONSTRAINT `apontamento_os_id_fkey` FOREIGN KEY (`os_id`) REFERENCES `ordens_servico`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `apontamento_etapa_instancia_id_fkey` FOREIGN KEY (`etapa_instancia_id`) REFERENCES `etapa_instancia`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Comentários explicativos
ALTER TABLE `workflow_instancia` 
COMMENT = 'Instâncias de workflow por OS - controle de execução';

ALTER TABLE `etapa_instancia` 
COMMENT = 'Etapas de instância de workflow - controle de progresso';

ALTER TABLE `checklist_instancia` 
COMMENT = 'Checklists de instância de workflow - controle de qualidade';

ALTER TABLE `apontamento` 
COMMENT = 'Apontamentos de produção - controle de tempo e quantidade';
