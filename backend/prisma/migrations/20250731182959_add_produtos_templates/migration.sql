/*
  Warnings:

  - A unique constraint covering the columns `[codigo_aprovacao]` on the table `Orcamento` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `orcamento` ADD COLUMN `codigo_aprovacao` VARCHAR(191) NULL,
    ADD COLUMN `status` VARCHAR(191) NULL DEFAULT 'rascunho';

-- CreateTable
CREATE TABLE `orcamento_historico` (
    `id` VARCHAR(191) NOT NULL,
    `orcamento_id` VARCHAR(191) NOT NULL,
    `versao` INTEGER NOT NULL,
    `dados_anteriores` JSON NOT NULL,
    `dados_novos` JSON NOT NULL,
    `alteracoes` JSON NULL,
    `motivo` TEXT NULL,
    `alterado_por` VARCHAR(191) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `orcamento_historico_orcamento_id_idx`(`orcamento_id`),
    INDEX `orcamento_historico_versao_idx`(`versao`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orcamento_logs` (
    `id` VARCHAR(191) NOT NULL,
    `orcamento_id` VARCHAR(191) NOT NULL,
    `tipo_acao` VARCHAR(191) NOT NULL,
    `descricao` TEXT NOT NULL,
    `dados_extras` JSON NULL,
    `ip_origem` VARCHAR(191) NULL,
    `user_agent` VARCHAR(191) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `orcamento_logs_orcamento_id_idx`(`orcamento_id`),
    INDEX `orcamento_logs_tipo_acao_idx`(`tipo_acao`),
    INDEX `orcamento_logs_criado_em_idx`(`criado_em`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `template_produtos` (
    `id` VARCHAR(191) NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `categoria` VARCHAR(191) NOT NULL,
    `descricao` TEXT NULL,
    `nome_servico` VARCHAR(191) NOT NULL,
    `descricao_produto` TEXT NULL,
    `horas_producao` DECIMAL(10, 2) NOT NULL,
    `largura_produto` DECIMAL(10, 2) NULL,
    `altura_produto` DECIMAL(10, 2) NULL,
    `area_produto` DECIMAL(10, 2) NULL,
    `unidade_medida_produto` VARCHAR(191) NULL,
    `quantidade_padrao` DECIMAL(10, 2) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `loja_id` VARCHAR(191) NOT NULL,

    INDEX `template_produtos_loja_id_idx`(`loja_id`),
    INDEX `template_produtos_loja_id_categoria_idx`(`loja_id`, `categoria`),
    UNIQUE INDEX `template_produtos_loja_id_nome_key`(`loja_id`, `nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `item_template_produtos` (
    `id` VARCHAR(191) NOT NULL,
    `template_id` VARCHAR(191) NOT NULL,
    `insumo_id` VARCHAR(191) NOT NULL,
    `quantidade` DECIMAL(10, 3) NOT NULL,
    `custo_unitario` DECIMAL(10, 2) NOT NULL,
    `custo_total` DECIMAL(10, 2) NOT NULL,

    INDEX `item_template_produtos_template_id_idx`(`template_id`),
    INDEX `item_template_produtos_insumo_id_idx`(`insumo_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `maquina_template_produtos` (
    `id` VARCHAR(191) NOT NULL,
    `template_id` VARCHAR(191) NOT NULL,
    `maquina_id` VARCHAR(191) NOT NULL,
    `horas_utilizadas` DECIMAL(10, 2) NOT NULL,
    `custo_total` DECIMAL(10, 2) NOT NULL,

    INDEX `maquina_template_produtos_template_id_idx`(`template_id`),
    INDEX `maquina_template_produtos_maquina_id_idx`(`maquina_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `funcao_template_produtos` (
    `id` VARCHAR(191) NOT NULL,
    `template_id` VARCHAR(191) NOT NULL,
    `funcao_id` VARCHAR(191) NOT NULL,
    `horas_trabalhadas` DECIMAL(10, 2) NOT NULL,
    `custo_total` DECIMAL(10, 2) NOT NULL,

    INDEX `funcao_template_produtos_template_id_idx`(`template_id`),
    INDEX `funcao_template_produtos_funcao_id_idx`(`funcao_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Orcamento_codigo_aprovacao_key` ON `Orcamento`(`codigo_aprovacao`);

-- AddForeignKey
ALTER TABLE `orcamento_historico` ADD CONSTRAINT `orcamento_historico_orcamento_id_fkey` FOREIGN KEY (`orcamento_id`) REFERENCES `Orcamento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orcamento_logs` ADD CONSTRAINT `orcamento_logs_orcamento_id_fkey` FOREIGN KEY (`orcamento_id`) REFERENCES `Orcamento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `template_produtos` ADD CONSTRAINT `template_produtos_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `Loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item_template_produtos` ADD CONSTRAINT `item_template_produtos_template_id_fkey` FOREIGN KEY (`template_id`) REFERENCES `template_produtos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item_template_produtos` ADD CONSTRAINT `item_template_produtos_insumo_id_fkey` FOREIGN KEY (`insumo_id`) REFERENCES `insumos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `maquina_template_produtos` ADD CONSTRAINT `maquina_template_produtos_template_id_fkey` FOREIGN KEY (`template_id`) REFERENCES `template_produtos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `maquina_template_produtos` ADD CONSTRAINT `maquina_template_produtos_maquina_id_fkey` FOREIGN KEY (`maquina_id`) REFERENCES `Maquina`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `funcao_template_produtos` ADD CONSTRAINT `funcao_template_produtos_template_id_fkey` FOREIGN KEY (`template_id`) REFERENCES `template_produtos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `funcao_template_produtos` ADD CONSTRAINT `funcao_template_produtos_funcao_id_fkey` FOREIGN KEY (`funcao_id`) REFERENCES `Funcao`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
