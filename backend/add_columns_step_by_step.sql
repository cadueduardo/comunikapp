-- Script para adicionar colunas faltantes na tabela localizacoes
-- Execute os comandos um por vez no phpMyAdmin

-- COMANDO 1: Adicionar coluna 'nome'
ALTER TABLE localizacoes ADD COLUMN IF NOT EXISTS nome VARCHAR(100) NOT NULL AFTER codigo;

-- COMANDO 2: Adicionar coluna 'tipo'
ALTER TABLE localizacoes ADD COLUMN IF NOT EXISTS tipo ENUM('DEPOSITO', 'CORREDOR', 'PRATELEIRA', 'NIVEL', 'POSICAO') NOT NULL DEFAULT 'DEPOSITO' AFTER nome;

-- COMANDO 3: Adicionar coluna 'localizacao_pai_id'
ALTER TABLE localizacoes ADD COLUMN IF NOT EXISTS localizacao_pai_id VARCHAR(36) NULL AFTER capacidade;

-- COMANDO 4: Adicionar coluna 'observacoes'
ALTER TABLE localizacoes ADD COLUMN IF NOT EXISTS observacoes TEXT NULL AFTER localizacao_pai_id;

-- COMANDO 5: Adicionar coluna 'ativo'
ALTER TABLE localizacoes ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE AFTER observacoes;

-- COMANDO 6: Adicionar coluna 'criado_em'
ALTER TABLE localizacoes ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER ativo;

-- COMANDO 7: Adicionar coluna 'atualizado_em'
ALTER TABLE localizacoes ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER criado_em;

-- COMANDO 8: Adicionar índice idx_loja_id
ALTER TABLE localizacoes ADD INDEX IF NOT EXISTS idx_loja_id (loja_id);

-- COMANDO 9: Adicionar índice idx_codigo
ALTER TABLE localizacoes ADD INDEX IF NOT EXISTS idx_codigo (codigo);

-- COMANDO 10: Adicionar índice idx_tipo
ALTER TABLE localizacoes ADD INDEX IF NOT EXISTS idx_tipo (tipo);

-- COMANDO 11: Adicionar índice idx_ativo
ALTER TABLE localizacoes ADD INDEX IF NOT EXISTS idx_ativo (ativo);

-- COMANDO 12: Verificar estrutura (opcional)
DESCRIBE localizacoes;

-- COMANDO 13: Verificar estatísticas (opcional)
SELECT COUNT(*) as total_registros FROM localizacoes;
