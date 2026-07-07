-- Migration: Adicionar campos de agendamento de instalação ao OrdemServico
-- Data: 2025-01-01
-- Objetivo: Coordenação de instalação externa conforme PLANO Fase 1

-- Adicionar campos de agendamento de instalação ao model OrdemServico
ALTER TABLE `ordens_servico` 
ADD COLUMN `data_instalacao_agendada` DATETIME(3) NULL COMMENT 'Data agendada para instalação (após contato com cliente)',
ADD COLUMN `observacoes_instalacao` TEXT NULL COMMENT 'Observações para coordenação de instalação externa';

-- Adicionar índice para consultas por data de instalação
CREATE INDEX `ordens_servico_data_instalacao_agendada_idx` ON `ordens_servico`(`data_instalacao_agendada`);

-- Comentário explicativo
ALTER TABLE `ordens_servico` 
COMMENT = 'Ordens de Serviço - com agendamento de instalação externa';
