-- Script para atualizar a estrutura da tabela localizacoes
-- Execute este script no phpMyAdmin para adicionar as novas colunas

-- 1. Adicionar coluna 'deposito' se não existir
ALTER TABLE localizacoes ADD COLUMN IF NOT EXISTS deposito VARCHAR(100) NOT NULL DEFAULT 'Depósito' AFTER codigo;

-- 2. Adicionar coluna 'corredor' se não existir
ALTER TABLE localizacoes ADD COLUMN IF NOT EXISTS corredor VARCHAR(50) NULL AFTER deposito;

-- 3. Adicionar coluna 'prateleira' se não existir
ALTER TABLE localizacoes ADD COLUMN IF NOT EXISTS prateleira VARCHAR(50) NULL AFTER corredor;

-- 4. Adicionar coluna 'nivel' se não existir
ALTER TABLE localizacoes ADD COLUMN IF NOT EXISTS nivel VARCHAR(50) NULL AFTER prateleira;

-- 5. Adicionar coluna 'posicao' se não existir
ALTER TABLE localizacoes ADD COLUMN IF NOT EXISTS posicao VARCHAR(50) NULL AFTER nivel;

-- 6. Adicionar coluna 'descricao' se não existir
ALTER TABLE localizacoes ADD COLUMN IF NOT EXISTS descricao TEXT NULL AFTER posicao;

-- 7. Verificar a estrutura final
DESCRIBE localizacoes;

-- 8. Mostrar estatísticas da tabela
SELECT COUNT(*) as total_registros FROM localizacoes;
