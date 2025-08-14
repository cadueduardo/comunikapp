-- Script para atualizar a tabela itens_estoque na base comunikapp
-- Execute este script no phpMyAdmin

-- 1. Verificar se a tabela existe
SHOW TABLES LIKE 'itens_estoque';

-- 2. Verificar as chaves estrangeiras existentes
SELECT 
    CONSTRAINT_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = 'comunikapp' 
AND TABLE_NAME = 'itens_estoque' 
AND REFERENCED_TABLE_NAME IS NOT NULL;

-- 3. Desabilitar verificação de chaves estrangeiras temporariamente
SET FOREIGN_KEY_CHECKS = 0;

-- 4. Fazer backup da tabela antiga (se existir e tiver dados)
CREATE TABLE IF NOT EXISTS itens_estoque_backup AS SELECT * FROM itens_estoque;

-- 5. Dropar a tabela antiga
DROP TABLE IF EXISTS itens_estoque;

-- 6. Criar a tabela itens_estoque com estrutura completa
CREATE TABLE itens_estoque (
    id VARCHAR(191) NOT NULL,
    
    -- Referências externas
    insumoId VARCHAR(191) NOT NULL,
    localizacaoId VARCHAR(191) NOT NULL,
    fornecedorId VARCHAR(191) NULL,
    
    -- Identificação do item
    codigo VARCHAR(100) NULL,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT NULL,
    
    -- Quantidades
    quantidadeAtual DECIMAL(65, 30) NOT NULL DEFAULT 0,
    quantidadeReservada DECIMAL(65, 30) NOT NULL DEFAULT 0,
    estoqueMinimo DECIMAL(65, 30) NOT NULL DEFAULT 0,
    estoqueMaximo DECIMAL(65, 30) NULL,
    
    -- Informações comerciais
    unidadeMedida VARCHAR(50) NOT NULL,
    precoUnitario DECIMAL(10, 2) NOT NULL DEFAULT 0,
    codigoBarras VARCHAR(100) NULL,
    
    -- Controle de lotes
    lote VARCHAR(100) NULL,
    dataValidade DATE NULL,
    
    -- Controle de status
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    observacoes TEXT NULL,
    
    -- Multi-tenant obrigatório
    lojaId VARCHAR(191) NOT NULL,
    
    -- Timestamps
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL,
    dataUltimaMov DATETIME(3) NULL,
    
    PRIMARY KEY (id),
    INDEX itens_estoque_lojaId_idx(lojaId),
    INDEX itens_estoque_insumoId_lojaId_idx(insumoId, lojaId),
    INDEX itens_estoque_localizacaoId_idx(localizacaoId),
    INDEX itens_estoque_fornecedorId_idx(fornecedorId),
    INDEX itens_estoque_codigo_idx(codigo),
    INDEX itens_estoque_codigoBarras_idx(codigoBarras),
    INDEX itens_estoque_lote_idx(lote),
    INDEX itens_estoque_dataValidade_idx(dataValidade),
    INDEX itens_estoque_ativo_idx(ativo),
    UNIQUE INDEX itens_estoque_insumoId_localizacaoId_lojaId_key(insumoId, localizacaoId, lojaId)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 7. Reabilitar verificação de chaves estrangeiras
SET FOREIGN_KEY_CHECKS = 1;

-- 8. Verificar se a tabela foi criada corretamente
DESCRIBE itens_estoque;

-- 9. Verificar se não há dados (deve estar vazia)
SELECT COUNT(*) as total_registros FROM itens_estoque;

-- 10. Verificar se as tabelas relacionadas existem
SHOW TABLES LIKE 'estoque_localizacoes';
SHOW TABLES LIKE 'insumos';
SHOW TABLES LIKE 'fornecedores';

-- 11. Comentários sobre a estrutura
-- Esta tabela agora inclui todos os campos necessários para:
-- - Identificação completa do item (código, nome, descrição)
-- - Controle de quantidades (atual, reservada, mínimo, máximo)
-- - Informações comerciais (preço, código de barras, fornecedor)
-- - Controle de lotes (número do lote, data de validade)
-- - Status e observações
-- - Multi-tenancy por lojaId
-- - Timestamps completos
