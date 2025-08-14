-- Script para corrigir a nomenclatura das tabelas de estoque para português
-- Execute este script no phpMyAdmin para renomear as tabelas

-- 1. Renomear tabelas para nomenclatura em português
-- Se as tabelas em inglês existirem, renomeie-as

-- Renomear inventory_locations para estoque_localizacoes
RENAME TABLE inventory_locations TO estoque_localizacoes;

-- Renomear inventory_stock para estoque_itens  
RENAME TABLE inventory_stock TO estoque_itens;

-- Renomear inventory_movements para estoque_movimentacoes
RENAME TABLE inventory_movements TO estoque_movimentacoes;

-- Renomear inventory_lots para estoque_lotes
RENAME TABLE inventory_lots TO estoque_lotes;

-- 2. Verificar se as tabelas foram renomeadas corretamente
SHOW TABLES LIKE 'estoque_%';

-- 3. Verificar a estrutura das tabelas renomeadas
DESCRIBE estoque_localizacoes;
DESCRIBE estoque_itens;
DESCRIBE estoque_movimentacoes;
DESCRIBE estoque_lotes;

-- 4. Se as tabelas em inglês não existirem, criar as tabelas em português
-- (Execute apenas se as tabelas em inglês não existirem)

-- Criar tabela estoque_localizacoes se não existir
CREATE TABLE IF NOT EXISTS estoque_localizacoes (
    id VARCHAR(191) NOT NULL,
    codigo VARCHAR(191) NOT NULL,
    deposito VARCHAR(191) NOT NULL,
    corredor VARCHAR(191) NULL,
    prateleira VARCHAR(191) NULL,
    nivel VARCHAR(191) NULL,
    posicao VARCHAR(191) NULL,
    descricao VARCHAR(191) NULL,
    capacidade DECIMAL(65, 30) NULL,
    ativo BOOLEAN NOT NULL DEFAULT true,
    lojaId VARCHAR(191) NOT NULL,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL,
    
    UNIQUE INDEX estoque_localizacoes_codigo_key(codigo),
    INDEX estoque_localizacoes_lojaId_idx(lojaId),
    INDEX estoque_localizacoes_codigo_lojaId_idx(codigo, lojaId),
    PRIMARY KEY (id)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Criar tabela estoque_itens se não existir
CREATE TABLE IF NOT EXISTS estoque_itens (
    id VARCHAR(191) NOT NULL,
    insumoId VARCHAR(191) NOT NULL,
    localizacaoId VARCHAR(191) NOT NULL,
    quantidadeAtual DECIMAL(65, 30) NOT NULL DEFAULT 0,
    quantidadeReservada DECIMAL(65, 30) NOT NULL DEFAULT 0,
    estoqueMinimo DECIMAL(65, 30) NOT NULL DEFAULT 0,
    estoqueMaximo DECIMAL(65, 30) NULL,
    lojaId VARCHAR(191) NOT NULL,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL,
    dataUltimaMov DATETIME(3) NULL,
    
    INDEX estoque_itens_lojaId_idx(lojaId),
    INDEX estoque_itens_insumoId_lojaId_idx(insumoId, lojaId),
    INDEX estoque_itens_localizacaoId_idx(localizacaoId),
    UNIQUE INDEX estoque_itens_insumoId_localizacaoId_lojaId_key(insumoId, localizacaoId, lojaId),
    PRIMARY KEY (id)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Criar tabela estoque_movimentacoes se não existir
CREATE TABLE IF NOT EXISTS estoque_movimentacoes (
    id VARCHAR(191) NOT NULL,
    estoqueId VARCHAR(191) NOT NULL,
    tipo ENUM('ENTRADA', 'SAIDA', 'AJUSTE', 'INVENTARIO', 'TRANSFERENCIA') NOT NULL,
    quantidade DECIMAL(65, 30) NOT NULL,
    quantidadeAnterior DECIMAL(65, 30) NOT NULL,
    quantidadePosterior DECIMAL(65, 30) NOT NULL,
    documentoRef VARCHAR(191) NULL,
    orcamentoId VARCHAR(191) NULL,
    usuarioId VARCHAR(191) NOT NULL,
    lojaId VARCHAR(191) NOT NULL,
    dataMovimentacao DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    observacoes VARCHAR(191) NULL,
    
    INDEX estoque_movimentacoes_lojaId_idx(lojaId),
    INDEX estoque_movimentacoes_estoqueId_idx(estoqueId),
    INDEX estoque_movimentacoes_dataMovimentacao_idx(dataMovimentacao),
    INDEX estoque_movimentacoes_tipo_lojaId_idx(tipo, lojaId),
    PRIMARY KEY (id)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Criar tabela estoque_lotes se não existir
CREATE TABLE IF NOT EXISTS estoque_lotes (
    id VARCHAR(191) NOT NULL,
    estoqueId VARCHAR(191) NOT NULL,
    numeroLote VARCHAR(191) NOT NULL,
    dataFabricacao DATETIME(3) NULL,
    dataValidade DATETIME(3) NULL,
    quantidadeLote DECIMAL(65, 30) NOT NULL,
    status ENUM('ATIVO', 'VENCIDO', 'CONSUMIDO', 'BLOQUEADO') NOT NULL DEFAULT 'ATIVO',
    lojaId VARCHAR(191) NOT NULL,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL,
    
    INDEX estoque_lotes_lojaId_idx(lojaId),
    INDEX estoque_lotes_estoqueId_idx(estoqueId),
    INDEX estoque_lotes_dataValidade_idx(dataValidade),
    INDEX estoque_lotes_status_lojaId_idx(status, lojaId),
    PRIMARY KEY (id)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

