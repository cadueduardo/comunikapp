-- Script para adicionar colunas faltantes na tabela itens_estoque
-- Execute este script no phpMyAdmin

-- 1. Verificar estrutura atual
DESCRIBE itens_estoque;

-- 2. Adicionar colunas faltantes (uma por vez para evitar erros)

-- Adicionar coluna codigo
ALTER TABLE itens_estoque ADD COLUMN IF NOT EXISTS codigo VARCHAR(100) NULL;

-- Adicionar coluna nome
ALTER TABLE itens_estoque ADD COLUMN IF NOT EXISTS nome VARCHAR(255) NOT NULL DEFAULT '';

-- Adicionar coluna descricao
ALTER TABLE itens_estoque ADD COLUMN IF NOT EXISTS descricao TEXT NULL;

-- Adicionar coluna quantidadeReservada
ALTER TABLE itens_estoque ADD COLUMN IF NOT EXISTS quantidadeReservada DECIMAL(65, 30) NOT NULL DEFAULT 0;

-- Adicionar coluna unidadeMedida
ALTER TABLE itens_estoque ADD COLUMN IF NOT EXISTS unidadeMedida VARCHAR(50) NOT NULL DEFAULT '';

-- Adicionar coluna precoUnitario
ALTER TABLE itens_estoque ADD COLUMN IF NOT EXISTS precoUnitario DECIMAL(10, 2) NOT NULL DEFAULT 0;

-- Adicionar coluna codigoBarras
ALTER TABLE itens_estoque ADD COLUMN IF NOT EXISTS codigoBarras VARCHAR(100) NULL;

-- Adicionar coluna lote
ALTER TABLE itens_estoque ADD COLUMN IF NOT EXISTS lote VARCHAR(100) NULL;

-- Adicionar coluna dataValidade
ALTER TABLE itens_estoque ADD COLUMN IF NOT EXISTS dataValidade DATE NULL;

-- Adicionar coluna fornecedorId
ALTER TABLE itens_estoque ADD COLUMN IF NOT EXISTS fornecedorId VARCHAR(191) NULL;

-- Adicionar coluna observacoes
ALTER TABLE itens_estoque ADD COLUMN IF NOT EXISTS observacoes TEXT NULL;

-- Adicionar coluna ativo
ALTER TABLE itens_estoque ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT TRUE;

-- Adicionar coluna dataUltimaMov
ALTER TABLE itens_estoque ADD COLUMN IF NOT EXISTS dataUltimaMov DATETIME(3) NULL;

-- 3. Adicionar índices para performance
CREATE INDEX IF NOT EXISTS itens_estoque_codigo_idx ON itens_estoque(codigo);
CREATE INDEX IF NOT EXISTS itens_estoque_codigoBarras_idx ON itens_estoque(codigoBarras);
CREATE INDEX IF NOT EXISTS itens_estoque_lote_idx ON itens_estoque(lote);
CREATE INDEX IF NOT EXISTS itens_estoque_dataValidade_idx ON itens_estoque(dataValidade);
CREATE INDEX IF NOT EXISTS itens_estoque_ativo_idx ON itens_estoque(ativo);
CREATE INDEX IF NOT EXISTS itens_estoque_fornecedorId_idx ON itens_estoque(fornecedorId);

-- 4. Verificar estrutura final
DESCRIBE itens_estoque;

-- 5. Verificar se há dados
SELECT COUNT(*) as total_registros FROM itens_estoque;
