-- Módulo Catálogo — Personalização e Estampas (Fase 1)
-- Migração 100% aditiva

-- AlterTable: produtos_finitos
ALTER TABLE `produtos_finitos`
    ADD COLUMN `personalizavel` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `fulfillment_padrao` ENUM('ESTOQUE', 'PRODUCAO', 'HIBRIDO') NOT NULL DEFAULT 'ESTOQUE';

CREATE INDEX `produtos_finitos_loja_id_id_idx` ON `produtos_finitos`(`loja_id`, `id`);
CREATE INDEX `produtos_finitos_loja_id_personalizavel_idx` ON `produtos_finitos`(`loja_id`, `personalizavel`);

-- AlterTable: itens_os (catálogo / VDP)
ALTER TABLE `itens_os`
    ADD COLUMN `modo_fulfillment` ENUM('PICK', 'MAKE', 'HIBRIDO') NULL DEFAULT 'PICK',
    ADD COLUMN `personalizacao_modo` ENUM('NENHUM', 'ESTAMPA', 'IMPRINT_LIVRE', 'ARTE_SOB_MEDIDA') NULL,
    ADD COLUMN `estampa_id` VARCHAR(191) NULL,
    ADD COLUMN `valores_personalizacao` JSON NULL,
    ADD COLUMN `grade_distribuicao` JSON NULL,
    ADD COLUMN `arte_producao_url` TEXT NULL;

CREATE INDEX `itens_os_estampa_id_idx` ON `itens_os`(`estampa_id`);
CREATE INDEX `itens_os_modo_fulfillment_idx` ON `itens_os`(`modo_fulfillment`);
CREATE INDEX `itens_os_personalizacao_modo_idx` ON `itens_os`(`personalizacao_modo`);

-- CreateTable: processos_decoracao
CREATE TABLE `processos_decoracao` (
    `id` VARCHAR(191) NOT NULL,
    `loja_id` VARCHAR(191) NOT NULL,
    `codigo` VARCHAR(50) NULL,
    `nome` VARCHAR(120) NOT NULL,
    `descricao` TEXT NULL,
    `exige_arte_aprovada` BOOLEAN NOT NULL DEFAULT false,
    `insumos_aceitos` JSON NOT NULL,
    `preco_base` DECIMAL(10, 2) NULL,
    `custo_setup` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `faixas_preco` JSON NOT NULL,
    `setor_pcp_sugerido` VARCHAR(120) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    UNIQUE INDEX `processos_decoracao_loja_id_codigo_key`(`loja_id`, `codigo`),
    INDEX `processos_decoracao_loja_id_idx`(`loja_id`),
    INDEX `processos_decoracao_loja_id_id_idx`(`loja_id`, `id`),
    INDEX `processos_decoracao_loja_id_ativo_idx`(`loja_id`, `ativo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: conjuntos_campos
CREATE TABLE `conjuntos_campos` (
    `id` VARCHAR(191) NOT NULL,
    `loja_id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(120) NOT NULL,
    `descricao` TEXT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    UNIQUE INDEX `conjuntos_campos_loja_id_nome_key`(`loja_id`, `nome`),
    INDEX `conjuntos_campos_loja_id_idx`(`loja_id`),
    INDEX `conjuntos_campos_loja_id_id_idx`(`loja_id`, `id`),
    INDEX `conjuntos_campos_loja_id_ativo_idx`(`loja_id`, `ativo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: campos_variaveis_def
CREATE TABLE `campos_variaveis_def` (
    `id` VARCHAR(191) NOT NULL,
    `conjunto_id` VARCHAR(191) NOT NULL,
    `chave` VARCHAR(64) NOT NULL,
    `label` VARCHAR(120) NOT NULL,
    `tipo` ENUM('TEXTO', 'NUMERO', 'DATA') NOT NULL DEFAULT 'TEXTO',
    `obrigatorio` BOOLEAN NOT NULL DEFAULT true,
    `max_caracteres` INTEGER NULL,
    `fonte_sugerida` VARCHAR(120) NULL,
    `ordem` INTEGER NOT NULL DEFAULT 0,
    `placeholder` VARCHAR(255) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    UNIQUE INDEX `campos_variaveis_def_conjunto_id_chave_key`(`conjunto_id`, `chave`),
    INDEX `campos_variaveis_def_conjunto_id_idx`(`conjunto_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: estampas
CREATE TABLE `estampas` (
    `id` VARCHAR(191) NOT NULL,
    `loja_id` VARCHAR(191) NOT NULL,
    `codigo` VARCHAR(50) NULL,
    `nome` VARCHAR(255) NOT NULL,
    `processo_id` VARCHAR(191) NOT NULL,
    `conjunto_campos_id` VARCHAR(191) NULL,
    `arte_mestra_url` TEXT NULL,
    `thumb_url` TEXT NULL,
    `preco_adicional` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `metadados` JSON NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    UNIQUE INDEX `estampas_loja_id_codigo_key`(`loja_id`, `codigo`),
    INDEX `estampas_loja_id_idx`(`loja_id`),
    INDEX `estampas_loja_id_id_idx`(`loja_id`, `id`),
    INDEX `estampas_loja_id_ativo_idx`(`loja_id`, `ativo`),
    INDEX `estampas_processo_id_idx`(`processo_id`),
    INDEX `estampas_conjunto_campos_id_idx`(`conjunto_campos_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: produto_finito_modos
CREATE TABLE `produto_finito_modos` (
    `id` VARCHAR(191) NOT NULL,
    `loja_id` VARCHAR(191) NOT NULL,
    `produto_finito_id` VARCHAR(191) NOT NULL,
    `modo` ENUM('NENHUM', 'ESTAMPA', 'IMPRINT_LIVRE', 'ARTE_SOB_MEDIDA') NOT NULL,
    `habilitado` BOOLEAN NOT NULL DEFAULT true,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `produto_finito_modos_produto_finito_id_modo_key`(`produto_finito_id`, `modo`),
    INDEX `produto_finito_modos_loja_id_idx`(`loja_id`),
    INDEX `produto_finito_modos_loja_id_produto_finito_id_idx`(`loja_id`, `produto_finito_id`),
    INDEX `produto_finito_modos_produto_finito_id_idx`(`produto_finito_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: produto_finito_estampas
CREATE TABLE `produto_finito_estampas` (
    `loja_id` VARCHAR(191) NOT NULL,
    `produto_finito_id` VARCHAR(191) NOT NULL,
    `estampa_id` VARCHAR(191) NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `produto_finito_estampas_loja_id_idx`(`loja_id`),
    INDEX `produto_finito_estampas_loja_id_estampa_id_idx`(`loja_id`, `estampa_id`),
    INDEX `produto_finito_estampas_estampa_id_idx`(`estampa_id`),
    PRIMARY KEY (`produto_finito_id`, `estampa_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: produto_finito_processos
CREATE TABLE `produto_finito_processos` (
    `loja_id` VARCHAR(191) NOT NULL,
    `produto_finito_id` VARCHAR(191) NOT NULL,
    `processo_id` VARCHAR(191) NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `produto_finito_processos_loja_id_idx`(`loja_id`),
    INDEX `produto_finito_processos_loja_id_processo_id_idx`(`loja_id`, `processo_id`),
    INDEX `produto_finito_processos_processo_id_idx`(`processo_id`),
    PRIMARY KEY (`produto_finito_id`, `processo_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: personalizacao_orcamento
CREATE TABLE `personalizacao_orcamento` (
    `id` VARCHAR(191) NOT NULL,
    `loja_id` VARCHAR(191) NOT NULL,
    `produto_orcamento_id` VARCHAR(191) NOT NULL,
    `modo` ENUM('NENHUM', 'ESTAMPA', 'IMPRINT_LIVRE', 'ARTE_SOB_MEDIDA') NOT NULL DEFAULT 'NENHUM',
    `estampa_id` VARCHAR(191) NULL,
    `processo_id` VARCHAR(191) NULL,
    `valores_campos` JSON NULL,
    `grade_distribuicao` JSON NULL,
    `arte_producao_url` TEXT NULL,
    `preview_url` TEXT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    UNIQUE INDEX `personalizacao_orcamento_produto_orcamento_id_key`(`produto_orcamento_id`),
    INDEX `personalizacao_orcamento_loja_id_idx`(`loja_id`),
    INDEX `personalizacao_orcamento_loja_id_id_idx`(`loja_id`, `id`),
    INDEX `personalizacao_orcamento_estampa_id_idx`(`estampa_id`),
    INDEX `personalizacao_orcamento_processo_id_idx`(`processo_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `itens_os`
    ADD CONSTRAINT `itens_os_estampa_id_fkey`
    FOREIGN KEY (`estampa_id`) REFERENCES `estampas`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `processos_decoracao`
    ADD CONSTRAINT `processos_decoracao_loja_id_fkey`
    FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `conjuntos_campos`
    ADD CONSTRAINT `conjuntos_campos_loja_id_fkey`
    FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `campos_variaveis_def`
    ADD CONSTRAINT `campos_variaveis_def_conjunto_id_fkey`
    FOREIGN KEY (`conjunto_id`) REFERENCES `conjuntos_campos`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `estampas`
    ADD CONSTRAINT `estampas_loja_id_fkey`
    FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `estampas`
    ADD CONSTRAINT `estampas_processo_id_fkey`
    FOREIGN KEY (`processo_id`) REFERENCES `processos_decoracao`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `estampas`
    ADD CONSTRAINT `estampas_conjunto_campos_id_fkey`
    FOREIGN KEY (`conjunto_campos_id`) REFERENCES `conjuntos_campos`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `produto_finito_modos`
    ADD CONSTRAINT `produto_finito_modos_produto_finito_id_fkey`
    FOREIGN KEY (`produto_finito_id`) REFERENCES `produtos_finitos`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `produto_finito_estampas`
    ADD CONSTRAINT `produto_finito_estampas_produto_finito_id_fkey`
    FOREIGN KEY (`produto_finito_id`) REFERENCES `produtos_finitos`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `produto_finito_estampas`
    ADD CONSTRAINT `produto_finito_estampas_estampa_id_fkey`
    FOREIGN KEY (`estampa_id`) REFERENCES `estampas`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `produto_finito_processos`
    ADD CONSTRAINT `produto_finito_processos_produto_finito_id_fkey`
    FOREIGN KEY (`produto_finito_id`) REFERENCES `produtos_finitos`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `produto_finito_processos`
    ADD CONSTRAINT `produto_finito_processos_processo_id_fkey`
    FOREIGN KEY (`processo_id`) REFERENCES `processos_decoracao`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `personalizacao_orcamento`
    ADD CONSTRAINT `personalizacao_orcamento_produto_orcamento_id_fkey`
    FOREIGN KEY (`produto_orcamento_id`) REFERENCES `ProdutoOrcamento`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `personalizacao_orcamento`
    ADD CONSTRAINT `personalizacao_orcamento_estampa_id_fkey`
    FOREIGN KEY (`estampa_id`) REFERENCES `estampas`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `personalizacao_orcamento`
    ADD CONSTRAINT `personalizacao_orcamento_processo_id_fkey`
    FOREIGN KEY (`processo_id`) REFERENCES `processos_decoracao`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;
