-- Script simples para atualizar tabela itens_estoque
-- Execute este script no phpMyAdmin

-- 1. Desabilitar verificação de chaves estrangeiras
SET FOREIGN_KEY_CHECKS = 0;

-- 2. Fazer backup da tabela antiga
CREATE TABLE IF NOT EXISTS itens_estoque_backup AS SELECT * FROM itens_estoque;

-- 3. Dropar a tabela antiga
DROP TABLE IF EXISTS itens_estoque;

-- 4. Criar a nova tabela
CREATE TABLE itens_estoque (
    id VARCHAR(191) NOT NULL,
    insumoId VARCHAR(191) NOT NULL,
    localizacaoId VARCHAR(191) NOT NULL,
    fornecedorId VARCHAR(191) NULL,
    codigo VARCHAR(100) NULL,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT NULL,
    quantidadeAtual DECIMAL(65, 30) NOT NULL DEFAULT 0,
    quantidadeReservada DECIMAL(65, 30) NOT NULL DEFAULT 0,
    estoqueMinimo DECIMAL(65, 30) NOT NULL DEFAULT 0,
    estoqueMaximo DECIMAL(65, 30) NULL,
    unidadeMedida VARCHAR(50) NOT NULL,
    precoUnitario DECIMAL(10, 2) NOT NULL DEFAULT 0,
    codigoBarras VARCHAR(100) NULL,
    lote VARCHAR(100) NULL,
    dataValidade DATE NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    observacoes TEXT NULL,
    lojaId VARCHAR(191) NOT NULL,
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

-- 5. Reabilitar verificação de chaves estrangeiras
SET FOREIGN_KEY_CHECKS = 1;

-- 6. Verificar a estrutura
DESCRIBE itens_estoque;
