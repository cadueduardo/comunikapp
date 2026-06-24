-- Comissão padrão do vendedor (Configurações > Loja) para novos orçamentos
ALTER TABLE `loja` ADD COLUMN `comissao_padrao` DECIMAL(5, 2) NULL AFTER `impostos_padrao`;
