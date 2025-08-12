-- Script para verificar a estrutura das tabelas de estoque
-- Execute este script no phpMyAdmin para verificar a estrutura atual

-- 1. Verificar se a tabela estoque_itens existe (nova estrutura)
SHOW TABLES LIKE 'estoque_itens';

-- 2. Verificar se a tabela itens_estoque existe (estrutura antiga)
SHOW TABLES LIKE 'itens_estoque';

-- 3. Se estoque_itens existir, mostrar sua estrutura
DESCRIBE estoque_itens;

-- 4. Se itens_estoque existir, mostrar sua estrutura
DESCRIBE itens_estoque;

-- 5. Verificar se há dados nas tabelas
SELECT 'estoque_itens' as tabela, COUNT(*) as total FROM estoque_itens
UNION ALL
SELECT 'itens_estoque' as tabela, COUNT(*) as total FROM itens_estoque;

-- 6. Verificar se a tabela estoque_localizacoes existe
SHOW TABLES LIKE 'estoque_localizacoes';
DESCRIBE estoque_localizacoes;

-- 7. Verificar se a tabela estoque_movimentacoes existe
SHOW TABLES LIKE 'estoque_movimentacoes';
DESCRIBE estoque_movimentacoes;
