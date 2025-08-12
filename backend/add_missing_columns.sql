-- Script para adicionar colunas faltantes na tabela localizacoes
-- Execute este script no phpMyAdmin para adicionar as colunas que estão faltando

-- 1. Adicionar coluna 'nome' se não existir
ALTER TABLE localizacoes ADD COLUMN IF NOT EXISTS nome VARCHAR(100) NOT NULL AFTER codigo;

-- 2. Adicionar coluna 'tipo' se não existir
ALTER TABLE localizacoes ADD COLUMN IF NOT EXISTS tipo ENUM('DEPOSITO', 'CORREDOR', 'PRATELEIRA', 'NIVEL', 'POSICAO') NOT NULL DEFAULT 'DEPOSITO' AFTER nome;

-- 3. Adicionar coluna 'localizacao_pai_id' se não existir
ALTER TABLE localizacoes ADD COLUMN IF NOT EXISTS localizacao_pai_id VARCHAR(36) NULL AFTER capacidade;

-- 4. Adicionar coluna 'observacoes' se não existir
ALTER TABLE localizacoes ADD COLUMN IF NOT EXISTS observacoes TEXT NULL AFTER localizacao_pai_id;

-- 5. Adicionar coluna 'ativo' se não existir
ALTER TABLE localizacoes ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE AFTER observacoes;

-- 6. Adicionar coluna 'criado_em' se não existir
ALTER TABLE localizacoes ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER ativo;

-- 7. Adicionar coluna 'atualizado_em' se não existir
ALTER TABLE localizacoes ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER criado_em;

-- 8. Adicionar índices se não existirem
ALTER TABLE localizacoes ADD INDEX IF NOT EXISTS idx_loja_id (loja_id);
ALTER TABLE localizacoes ADD INDEX IF NOT EXISTS idx_codigo (codigo);
ALTER TABLE localizacoes ADD INDEX IF NOT EXISTS idx_tipo (tipo);
ALTER TABLE localizacoes ADD INDEX IF NOT EXISTS idx_ativo (ativo);

-- 9. Adicionar constraint único para código por loja (execute apenas se não existir)
-- Se der erro "Duplicate key name", significa que já existe
ALTER TABLE localizacoes ADD CONSTRAINT uk_codigo_loja UNIQUE (codigo, loja_id);

-- 10. Verificar a estrutura final
DESCRIBE localizacoes;

-- 11. Mostrar estatísticas da tabela
SELECT 
  COUNT(*) as total_registros,
  COUNT(DISTINCT loja_id) as total_lojas,
  COUNT(DISTINCT tipo) as tipos_diferentes
FROM localizacoes;
