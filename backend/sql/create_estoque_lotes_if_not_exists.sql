-- Criação idempotente da tabela de lotes em português
-- Compatível com o serviço que detecta colunas snake_case

CREATE TABLE IF NOT EXISTS estoque_lotes (
  id VARCHAR(191) NOT NULL,
  estoque_id VARCHAR(191) NOT NULL,
  loja_id VARCHAR(191) NOT NULL,
  numero_lote VARCHAR(191) NOT NULL,
  data_fabricacao DATETIME NULL,
  data_validade DATETIME NULL,
  quantidade_lote DECIMAL(65,30) NOT NULL,
  status ENUM('ATIVO','VENCIDO','CONSUMIDO','BLOQUEADO') NOT NULL DEFAULT 'ATIVO',
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX estoque_lotes_loja_id_idx (loja_id),
  INDEX estoque_lotes_estoque_id_idx (estoque_id),
  INDEX estoque_lotes_data_validade_idx (data_validade),
  INDEX estoque_lotes_status_loja_id_idx (status, loja_id)
)
DEFAULT CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- Força collation correta se a tabela já existir
ALTER TABLE estoque_lotes CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


