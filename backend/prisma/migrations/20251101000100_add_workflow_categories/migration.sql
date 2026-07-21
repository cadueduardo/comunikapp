-- Create workflow categories for intelligent assignment
CREATE TABLE `workflow_categorias` (
    `id` VARCHAR(191) NOT NULL,
    `loja_id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `descricao` LONGTEXT NULL,
    `workflow_id` VARCHAR(191) NOT NULL,
    `criterios` LONGTEXT NULL,
    `prioridade` INT NOT NULL DEFAULT 0,
    `ativo` BOOLEAN NOT NULL DEFAULT TRUE,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `workflow_categorias_loja_id_nome_key`(`loja_id`, `nome`),
    INDEX `workflow_categorias_workflow_id_idx`(`workflow_id`),
    INDEX `workflow_categorias_loja_id_ativo_idx`(`loja_id`, `ativo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `workflow_categoria_regras` (
    `id` VARCHAR(191) NOT NULL,
    `categoria_id` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `valor` VARCHAR(191) NOT NULL,
    `obrigatoria` BOOLEAN NOT NULL DEFAULT TRUE,
    `prioridade` INT NOT NULL DEFAULT 0,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    INDEX `workflow_categoria_regras_categoria_id_idx`(`categoria_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `workflow_categorias`
    ADD CONSTRAINT `workflow_categorias_loja_id_fkey`
        FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `workflow_categorias_workflow_id_fkey`
        FOREIGN KEY (`workflow_id`) REFERENCES `workflows_os`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `workflow_categoria_regras`
    ADD CONSTRAINT `workflow_categoria_regras_categoria_id_fkey`
        FOREIGN KEY (`categoria_id`) REFERENCES `workflow_categorias`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
