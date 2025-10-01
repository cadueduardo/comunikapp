-- Migration: Adicionar campos de aprovação técnica ao OrdemServico
-- Data: 2025-01-01
-- Objetivo: Checkpoint pre-produção conforme PLANO Fase 1

-- Adicionar campos de aprovação técnica ao model OrdemServico
ALTER TABLE `ordens_servico` 
ADD COLUMN `aprovacao_tecnica_status` VARCHAR(191) NULL DEFAULT 'PENDENTE' COMMENT 'Status da aprovação técnica: PENDENTE, APROVADA, REJEITADA',
ADD COLUMN `aprovacao_tecnica_por` VARCHAR(191) NULL COMMENT 'ID do usuário que aprovou tecnicamente',
ADD COLUMN `aprovacao_tecnica_em` DATETIME(3) NULL COMMENT 'Data e hora da aprovação técnica',
ADD COLUMN `aprovacao_tecnica_obs` TEXT NULL COMMENT 'Observações da aprovação técnica';

-- Adicionar índices para consultas por aprovação técnica
CREATE INDEX `ordens_servico_aprovacao_tecnica_status_idx` ON `ordens_servico`(`aprovacao_tecnica_status`);
CREATE INDEX `ordens_servico_aprovacao_tecnica_por_idx` ON `ordens_servico`(`aprovacao_tecnica_por`);

-- Comentário explicativo
ALTER TABLE `ordens_servico` 
COMMENT = 'Ordens de Serviço - com checkpoint de aprovação técnica pre-produção';
