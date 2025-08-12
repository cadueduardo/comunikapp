-- Script para atualizar a estrutura da tabela localizacoes
-- Execute este script no MySQL para corrigir a estrutura da tabela

-- 1. Verificar se a tabela existe
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = DATABASE() AND table_name = 'localizacoes';

-- 2. Se a tabela nao existir, criar com a estrutura correta
CREATE TABLE IF NOT EXISTS localizacoes (
  id VARCHAR(36) PRIMARY KEY,
  loja_id VARCHAR(36) NOT NULL,
  codigo VARCHAR(50) NOT NULL,
  nome VARCHAR(100) NOT NULL,
  tipo ENUM('DEPOSITO', 'CORREDOR', 'PRATELEIRA', 'NIVEL', 'POSICAO') NOT NULL,
  capacidade DECIMAL(10,2) NULL,
  localizacao_pai_id VARCHAR(36) NULL,
  observacoes TEXT NULL,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indices para performance
  INDEX idx_loja_id (loja_id),
  INDEX idx_codigo (codigo),
  INDEX idx_tipo (tipo),
  INDEX idx_ativo (ativo),
  
  -- Constraint para codigo unico por loja
  UNIQUE KEY uk_codigo_loja (codigo, loja_id)
);

-- 3. Adicionar colunas se nao existirem
ALTER TABLE localizacoes 
ADD COLUMN IF NOT EXISTS nome VARCHAR(100) NOT NULL AFTER codigo,
ADD COLUMN IF NOT EXISTS tipo ENUM('DEPOSITO', 'CORREDOR', 'PRATELEIRA', 'NIVEL', 'POSICAO') NOT NULL DEFAULT 'DEPOSITO' AFTER nome,
ADD COLUMN IF NOT EXISTS localizacao_pai_id VARCHAR(36) NULL AFTER capacidade,
ADD COLUMN IF NOT EXISTS observacoes TEXT NULL AFTER localizacao_pai_id,
ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE AFTER observacoes,
ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER ativo,
ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER criado_em;

-- 4. Adicionar indices se nao existirem
ALTER TABLE localizacoes 
ADD INDEX IF NOT EXISTS idx_loja_id (loja_id),
ADD INDEX IF NOT EXISTS idx_codigo (codigo),
ADD INDEX IF NOT EXISTS idx_tipo (tipo),
ADD INDEX IF NOT EXISTS idx_ativo (ativo);

-- 5. Adicionar constraint unico para codigo por loja
ALTER TABLE localizacoes 
ADD CONSTRAINT IF NOT EXISTS uk_codigo_loja UNIQUE (codigo, loja_id);

-- 6. Verificar a estrutura final
DESCRIBE localizacoes;

-- 7. Mostrar estatisticas da tabela
SELECT 
  COUNT(*) as total_registros,
  COUNT(DISTINCT loja_id) as total_lojas,
  COUNT(DISTINCT tipo) as tipos_diferentes
FROM localizacoes;
