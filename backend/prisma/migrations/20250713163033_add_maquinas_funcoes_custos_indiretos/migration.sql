-- CreateTable
CREATE TABLE `Maquina` (
    `id` VARCHAR(191) NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `custo_hora` DECIMAL(10, 2) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ATIVA',
    `capacidade` VARCHAR(191) NULL,
    `observacoes` TEXT NULL,
    `loja_id` VARCHAR(191) NOT NULL,

    INDEX `Maquina_loja_id_idx`(`loja_id`),
    INDEX `Maquina_loja_id_tipo_idx`(`loja_id`, `tipo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Funcao` (
    `id` VARCHAR(191) NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `custo_hora` DECIMAL(10, 2) NOT NULL,
    `descricao` TEXT NULL,
    `maquina_id` VARCHAR(191) NULL,
    `loja_id` VARCHAR(191) NOT NULL,

    INDEX `Funcao_loja_id_idx`(`loja_id`),
    INDEX `Funcao_maquina_id_idx`(`maquina_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CustoIndireto` (
    `id` VARCHAR(191) NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `valor_mensal` DECIMAL(10, 2) NOT NULL,
    `categoria` VARCHAR(191) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `regra_rateio` VARCHAR(191) NOT NULL DEFAULT 'PROPORCIONAL_TEMPO',
    `observacoes` TEXT NULL,
    `loja_id` VARCHAR(191) NOT NULL,

    INDEX `CustoIndireto_loja_id_idx`(`loja_id`),
    INDEX `CustoIndireto_loja_id_categoria_idx`(`loja_id`, `categoria`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MaquinaOrcamento` (
    `id` VARCHAR(191) NOT NULL,
    `orcamento_id` VARCHAR(191) NOT NULL,
    `maquina_id` VARCHAR(191) NOT NULL,
    `horas_utilizadas` DECIMAL(10, 2) NOT NULL,
    `custo_total` DECIMAL(10, 2) NOT NULL,

    INDEX `MaquinaOrcamento_orcamento_id_idx`(`orcamento_id`),
    INDEX `MaquinaOrcamento_maquina_id_idx`(`maquina_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FuncaoOrcamento` (
    `id` VARCHAR(191) NOT NULL,
    `orcamento_id` VARCHAR(191) NOT NULL,
    `funcao_id` VARCHAR(191) NOT NULL,
    `horas_trabalhadas` DECIMAL(10, 2) NOT NULL,
    `custo_total` DECIMAL(10, 2) NOT NULL,

    INDEX `FuncaoOrcamento_orcamento_id_idx`(`orcamento_id`),
    INDEX `FuncaoOrcamento_funcao_id_idx`(`funcao_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Maquina` ADD CONSTRAINT `Maquina_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `Loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Funcao` ADD CONSTRAINT `Funcao_maquina_id_fkey` FOREIGN KEY (`maquina_id`) REFERENCES `Maquina`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Funcao` ADD CONSTRAINT `Funcao_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `Loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CustoIndireto` ADD CONSTRAINT `CustoIndireto_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `Loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MaquinaOrcamento` ADD CONSTRAINT `MaquinaOrcamento_orcamento_id_fkey` FOREIGN KEY (`orcamento_id`) REFERENCES `Orcamento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MaquinaOrcamento` ADD CONSTRAINT `MaquinaOrcamento_maquina_id_fkey` FOREIGN KEY (`maquina_id`) REFERENCES `Maquina`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FuncaoOrcamento` ADD CONSTRAINT `FuncaoOrcamento_orcamento_id_fkey` FOREIGN KEY (`orcamento_id`) REFERENCES `Orcamento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FuncaoOrcamento` ADD CONSTRAINT `FuncaoOrcamento_funcao_id_fkey` FOREIGN KEY (`funcao_id`) REFERENCES `Funcao`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
