-- Script simples para atualizar a tabela localizacoes
-- Execute este script diretamente no phpMyAdmin

-- 1. Criar tabela se nao existir
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
  
  INDEX idx_loja_id (loja_id),
  INDEX idx_codigo (codigo),
  INDEX idx_tipo (tipo),
  INDEX idx_ativo (ativo),
  
  UNIQUE KEY uk_codigo_loja (codigo, loja_id)
);

-- 2. Adicionar colunas se nao existirem (ignora erros se ja existem)
ALTER TABLE localizacoes ADD COLUMN IF NOT EXISTS nome VARCHAR(100) NOT NULL AFTER codigo;
ALTER TABLE localizacoes ADD COLUMN IF NOT EXISTS tipo ENUM('DEPOSITO', 'CORREDOR', 'PRATELEIRA', 'NIVEL', 'POSICAO') NOT NULL DEFAULT 'DEPOSITO' AFTER nome;
ALTER TABLE localizacoes ADD COLUMN IF NOT EXISTS localizacao_pai_id VARCHAR(36) NULL AFTER capacidade;
ALTER TABLE localizacoes ADD COLUMN IF NOT EXISTS observacoes TEXT NULL AFTER localizacao_pai_id;
ALTER TABLE localizacoes ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE AFTER observacoes;
ALTER TABLE localizacoes ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER ativo;
ALTER TABLE localizacoes ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER criado_em;

-- 3. Adicionar indices se nao existirem
ALTER TABLE localizacoes ADD INDEX IF NOT EXISTS idx_loja_id (loja_id);
ALTER TABLE localizacoes ADD INDEX IF NOT EXISTS idx_codigo (codigo);
ALTER TABLE localizacoes ADD INDEX IF NOT EXISTS idx_tipo (tipo);
ALTER TABLE localizacoes ADD INDEX IF NOT EXISTS idx_ativo (ativo);

-- 4. Adicionar constraint unico
ALTER TABLE localizacoes ADD CONSTRAINT IF NOT EXISTS uk_codigo_loja UNIQUE (codigo, loja_id);

-- 5. Verificar estrutura
DESCRIBE localizacoes;
