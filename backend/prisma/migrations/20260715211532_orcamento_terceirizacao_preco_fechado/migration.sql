-- AlterTable
ALTER TABLE `produtoorcamento` ADD COLUMN `terceirizacao_modelo_custo` ENUM('DETALHADO', 'PRECO_FECHADO') NOT NULL DEFAULT 'DETALHADO',
    ADD COLUMN `terceirizacao_quantidade_cotada` DECIMAL(10, 3) NULL;
