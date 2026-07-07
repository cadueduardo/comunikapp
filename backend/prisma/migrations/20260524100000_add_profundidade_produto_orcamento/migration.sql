-- Migration: Adicionar campo profundidade ao ProdutoOrcamento
-- Data: 2025-01-01
-- Objetivo: Suporte a produtos 3D (totens, letras caixa) conforme PLANO Fase 1

-- Adicionar campo profundidade ao model ProdutoOrcamento
ALTER TABLE `ProdutoOrcamento` 
ADD COLUMN `profundidade` DECIMAL(10, 2) NULL COMMENT 'Profundidade para produtos 3D (totens, letras caixa)';

-- Adicionar índice para consultas por profundidade
CREATE INDEX `ProdutoOrcamento_profundidade_idx` ON `ProdutoOrcamento`(`profundidade`);

-- Comentário explicativo
ALTER TABLE `ProdutoOrcamento` 
COMMENT = 'Produtos dentro do orçamento - suporte a produtos 3D com profundidade';
