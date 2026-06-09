-- AlterTable
ALTER TABLE `orcamento` ADD COLUMN `entrega_bairro` VARCHAR(120) NULL,
    ADD COLUMN `entrega_cep` VARCHAR(16) NULL,
    ADD COLUMN `entrega_cidade` VARCHAR(120) NULL,
    ADD COLUMN `entrega_complemento` VARCHAR(255) NULL,
    ADD COLUMN `entrega_custo_estimado` DECIMAL(12, 2) NULL,
    ADD COLUMN `entrega_endereco_snapshot` LONGTEXT NULL,
    ADD COLUMN `entrega_estado` VARCHAR(2) NULL,
    ADD COLUMN `entrega_logradouro` VARCHAR(255) NULL,
    ADD COLUMN `entrega_modalidade_id` VARCHAR(191) NULL,
    ADD COLUMN `entrega_numero` VARCHAR(32) NULL,
    ADD COLUMN `entrega_observacoes` TEXT NULL,
    ADD COLUMN `entrega_prazo_dias` INTEGER NULL,
    ADD COLUMN `entrega_usar_endereco_cliente` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `entrega_valor_cobrado` DECIMAL(12, 2) NULL;

-- AlterTable
ALTER TABLE `ProdutoOrcamento` ADD COLUMN `instalacao_bairro` VARCHAR(120) NULL,
    ADD COLUMN `instalacao_cep` VARCHAR(16) NULL,
    ADD COLUMN `instalacao_cidade` VARCHAR(120) NULL,
    ADD COLUMN `instalacao_complemento` VARCHAR(255) NULL,
    ADD COLUMN `instalacao_custo_deslocamento` DECIMAL(12, 2) NULL,
    ADD COLUMN `instalacao_custo_mao_obra` DECIMAL(12, 2) NULL,
    ADD COLUMN `instalacao_endereco_snapshot` LONGTEXT NULL,
    ADD COLUMN `instalacao_estado` VARCHAR(2) NULL,
    ADD COLUMN `instalacao_logradouro` VARCHAR(255) NULL,
    ADD COLUMN `instalacao_necessaria` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `instalacao_numero` VARCHAR(32) NULL,
    ADD COLUMN `instalacao_observacoes` TEXT NULL,
    ADD COLUMN `instalacao_preco_cobrado` DECIMAL(12, 2) NULL,
    ADD COLUMN `instalacao_quantidade_pessoas` INTEGER NULL,
    ADD COLUMN `instalacao_tempo_estimado_min` INTEGER NULL,
    ADD COLUMN `instalacao_tipo_id` VARCHAR(191) NULL,
    ADD COLUMN `instalacao_usar_endereco_entrega` BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE `modalidade_entrega` (
    `id` VARCHAR(191) NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `descricao` TEXT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `exige_endereco` BOOLEAN NOT NULL DEFAULT false,
    `exige_valor` BOOLEAN NOT NULL DEFAULT false,
    `valor_padrao` DECIMAL(12, 2) NULL,
    `custo_padrao` DECIMAL(12, 2) NULL,
    `prazo_padrao_dias` INTEGER NULL,
    `permite_retirada` BOOLEAN NOT NULL DEFAULT false,
    `observacoes_padrao` TEXT NULL,
    `loja_id` VARCHAR(191) NOT NULL,

    INDEX `modalidade_entrega_loja_id_idx`(`loja_id`),
    INDEX `modalidade_entrega_loja_id_ativo_idx`(`loja_id`, `ativo`),
    UNIQUE INDEX `modalidade_entrega_loja_id_nome_key`(`loja_id`, `nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tipo_instalacao` (
    `id` VARCHAR(191) NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `descricao` TEXT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `preco_padrao` DECIMAL(12, 2) NULL,
    `custo_mao_obra_padrao` DECIMAL(12, 2) NULL,
    `custo_deslocamento_padrao` DECIMAL(12, 2) NULL,
    `tempo_estimado_min` INTEGER NULL,
    `quantidade_pessoas_padrao` INTEGER NULL,
    `exige_endereco` BOOLEAN NOT NULL DEFAULT true,
    `exige_agendamento` BOOLEAN NOT NULL DEFAULT false,
    `observacoes_padrao` TEXT NULL,
    `loja_id` VARCHAR(191) NOT NULL,

    INDEX `tipo_instalacao_loja_id_idx`(`loja_id`),
    INDEX `tipo_instalacao_loja_id_ativo_idx`(`loja_id`, `ativo`),
    UNIQUE INDEX `tipo_instalacao_loja_id_nome_key`(`loja_id`, `nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `orcamento_entrega_modalidade_id_idx` ON `orcamento`(`entrega_modalidade_id`);

-- CreateIndex
CREATE INDEX `ProdutoOrcamento_instalacao_tipo_id_idx` ON `ProdutoOrcamento`(`instalacao_tipo_id`);

-- AddForeignKey
ALTER TABLE `modalidade_entrega` ADD CONSTRAINT `modalidade_entrega_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tipo_instalacao` ADD CONSTRAINT `tipo_instalacao_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orcamento` ADD CONSTRAINT `Orcamento_entrega_modalidade_id_fkey` FOREIGN KEY (`entrega_modalidade_id`) REFERENCES `modalidade_entrega`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProdutoOrcamento` ADD CONSTRAINT `ProdutoOrcamento_instalacao_tipo_id_fkey` FOREIGN KEY (`instalacao_tipo_id`) REFERENCES `tipo_instalacao`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
