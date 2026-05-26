-- Migration: Adicionar profundidade ao ItemOS (Fase 11)
-- Data: 2026-05-26
-- Objetivo: propagar profundidade do ProdutoOrcamento para ItemOS quando o produto for 3D
--           (totens, letras caixa, displays). Campo opcional - produtos planos nao sao afetados.
-- Ver docs/plano-acao-home-onboarding-dashboard-operacional.md secao "Fase 11"

ALTER TABLE `itens_os`
  ADD COLUMN `profundidade` DECIMAL(10, 2) NULL COMMENT 'Profundidade herdada do produto 3D (Fase 11)';
