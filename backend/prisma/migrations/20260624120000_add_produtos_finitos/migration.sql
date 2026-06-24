-- Módulo Produtos (prateleira / revenda)
-- Migração 100% aditiva: CREATE TABLE + ALTER TABLE ADD + CREATE INDEX + ADD CONSTRAINT
-- Não altera, trunca nem remove tabelas legadas (insumos, orcamento, template_produtos, etc.)

-- AlterTable: integração com orçamento V2
ALTER TABLE `ProdutoOrcamento`
    ADD COLUMN `tipo_item` VARCHAR(20) NOT NULL DEFAULT 'SOB_DEMANDA',
    ADD COLUMN `produto_finito_id` VARCHAR(191) NULL;

-- CreateTable: categorias de produtos por loja
CREATE TABLE `categorias_produto_finito` (
    `id` VARCHAR(191) NOT NULL,
    `loja_id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(100) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    INDEX `categorias_produto_finito_loja_id_idx`(`loja_id`),
    UNIQUE INDEX `categorias_produto_finito_loja_id_nome_key`(`loja_id`, `nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: catálogo de produtos de prateleira
CREATE TABLE `produtos_finitos` (
    `id` VARCHAR(191) NOT NULL,
    `loja_id` VARCHAR(191) NOT NULL,
    `categoria_id` VARCHAR(191) NULL,
    `sku` VARCHAR(50) NOT NULL,
    `ean` VARCHAR(13) NULL,
    `nome` VARCHAR(255) NOT NULL,
    `descricao` TEXT NULL,
    `preco_venda` DECIMAL(10, 2) NOT NULL,
    `preco_promocional` DECIMAL(10, 2) NULL,
    `peso_kg` DECIMAL(10, 3) NOT NULL DEFAULT 0,
    `largura_cm` INTEGER NOT NULL DEFAULT 0,
    `altura_cm` INTEGER NOT NULL DEFAULT 0,
    `profundidade_cm` INTEGER NOT NULL DEFAULT 0,
    `estoque_atual` INTEGER NOT NULL DEFAULT 0,
    `estoque_minimo` INTEGER NOT NULL DEFAULT 0,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    INDEX `produtos_finitos_loja_id_idx`(`loja_id`),
    INDEX `produtos_finitos_categoria_id_idx`(`categoria_id`),
    UNIQUE INDEX `produtos_finitos_loja_id_sku_key`(`loja_id`, `sku`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: galeria de imagens do produto
CREATE TABLE `galeria_produto_finito` (
    `id` VARCHAR(191) NOT NULL,
    `produto_finito_id` VARCHAR(191) NOT NULL,
    `url_imagem` TEXT NOT NULL,
    `ordem` INTEGER NOT NULL DEFAULT 0,

    INDEX `galeria_produto_finito_produto_finito_id_idx`(`produto_finito_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex: busca por tipo de item e vínculo com produto de prateleira
CREATE INDEX `ProdutoOrcamento_produto_finito_id_idx` ON `ProdutoOrcamento`(`produto_finito_id`);
CREATE INDEX `ProdutoOrcamento_tipo_item_idx` ON `ProdutoOrcamento`(`tipo_item`);

-- AddForeignKey
ALTER TABLE `ProdutoOrcamento`
    ADD CONSTRAINT `ProdutoOrcamento_produto_finito_id_fkey`
    FOREIGN KEY (`produto_finito_id`) REFERENCES `produtos_finitos`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `categorias_produto_finito`
    ADD CONSTRAINT `categorias_produto_finito_loja_id_fkey`
    FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `produtos_finitos`
    ADD CONSTRAINT `produtos_finitos_loja_id_fkey`
    FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `produtos_finitos`
    ADD CONSTRAINT `produtos_finitos_categoria_id_fkey`
    FOREIGN KEY (`categoria_id`) REFERENCES `categorias_produto_finito`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `galeria_produto_finito`
    ADD CONSTRAINT `galeria_produto_finito_produto_finito_id_fkey`
    FOREIGN KEY (`produto_finito_id`) REFERENCES `produtos_finitos`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;
