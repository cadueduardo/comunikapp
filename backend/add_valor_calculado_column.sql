-- Adicionar coluna valor_calculado à tabela template_produtos
ALTER TABLE template_produtos 
ADD COLUMN valor_calculado DECIMAL(10, 2) NULL 
COMMENT 'Valor calculado do produto baseado nos custos de materiais, máquinas e funções';

-- Verificar se a coluna foi criada
DESCRIBE template_produtos;

