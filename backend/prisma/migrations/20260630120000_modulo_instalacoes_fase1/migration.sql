-- Módulo Instalações e Pós-Cálculo — Fase 1 (100% aditivo)
-- Configuração comercial, lotes por endereço, ocorrências de campo e taxas padrão

-- CreateTable
CREATE TABLE `configuracao_instalacao_loja` (
    `id` VARCHAR(191) NOT NULL,
    `loja_id` VARCHAR(191) NOT NULL,
    `exigir_sinal_producao` BOOLEAN NOT NULL DEFAULT false,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    UNIQUE INDEX `configuracao_instalacao_loja_loja_id_key`(`loja_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `itens_os_instalacao` (
    `id` VARCHAR(191) NOT NULL,
    `loja_id` VARCHAR(191) NOT NULL,
    `item_os_id` VARCHAR(191) NOT NULL,
    `cep` VARCHAR(16) NULL,
    `logradouro` VARCHAR(255) NOT NULL,
    `numero` VARCHAR(32) NOT NULL,
    `complemento` VARCHAR(255) NULL,
    `bairro` VARCHAR(120) NOT NULL,
    `cidade` VARCHAR(120) NOT NULL,
    `uf` VARCHAR(2) NOT NULL,
    `quantidade_alocada` INTEGER NOT NULL,
    `status_instalacao` ENUM('AGUARDANDO', 'EM_ANDAMENTO', 'CONCLUIDO', 'LOGISTICA_NEGATIVA') NOT NULL DEFAULT 'AGUARDANDO',
    `data_previsao` DATETIME(3) NULL,
    `data_execucao` DATETIME(3) NULL,
    `fotos_evidencia` JSON NULL,
    `assinatura_url` TEXT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    INDEX `itens_os_instalacao_loja_id_idx`(`loja_id`),
    INDEX `itens_os_instalacao_loja_id_status_instalacao_idx`(`loja_id`, `status_instalacao`),
    INDEX `itens_os_instalacao_item_os_id_idx`(`item_os_id`),
    INDEX `itens_os_instalacao_status_instalacao_idx`(`status_instalacao`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ocorrencias_instalacao` (
    `id` VARCHAR(191) NOT NULL,
    `loja_id` VARCHAR(191) NOT NULL,
    `os_id` VARCHAR(191) NOT NULL,
    `item_instalacao_id` VARCHAR(191) NULL,
    `tipo` ENUM('VISITA_IMPRODUTIVA', 'MATERIAL_EXTRA', 'SERVICO_ADICIONAL', 'RETRABALHO') NOT NULL,
    `categoria` ENUM('PRODUCAO', 'INSTALACAO', 'LOGISTICA') NOT NULL,
    `quantidade` DECIMAL(10, 2) NOT NULL,
    `custo_interno` DECIMAL(10, 2) NOT NULL,
    `preco_cliente` DECIMAL(10, 2) NOT NULL,
    `descricao` TEXT NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ocorrencias_instalacao_loja_id_idx`(`loja_id`),
    INDEX `ocorrencias_instalacao_loja_id_os_id_idx`(`loja_id`, `os_id`),
    INDEX `ocorrencias_instalacao_os_id_idx`(`os_id`),
    INDEX `ocorrencias_instalacao_item_instalacao_id_idx`(`item_instalacao_id`),
    INDEX `ocorrencias_instalacao_tipo_idx`(`tipo`),
    INDEX `ocorrencias_instalacao_criado_em_idx`(`criado_em`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `taxas_ocorrencia_loja` (
    `id` VARCHAR(191) NOT NULL,
    `loja_id` VARCHAR(191) NOT NULL,
    `tipo` ENUM('VISITA_IMPRODUTIVA', 'MATERIAL_EXTRA', 'SERVICO_ADICIONAL', 'RETRABALHO') NOT NULL,
    `custo_padrao` DECIMAL(10, 2) NOT NULL,
    `preco_padrao` DECIMAL(10, 2) NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    INDEX `taxas_ocorrencia_loja_loja_id_idx`(`loja_id`),
    UNIQUE INDEX `taxas_ocorrencia_loja_loja_id_tipo_key`(`loja_id`, `tipo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `configuracao_instalacao_loja` ADD CONSTRAINT `configuracao_instalacao_loja_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `itens_os_instalacao` ADD CONSTRAINT `itens_os_instalacao_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `itens_os_instalacao` ADD CONSTRAINT `itens_os_instalacao_item_os_id_fkey` FOREIGN KEY (`item_os_id`) REFERENCES `itens_os`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ocorrencias_instalacao` ADD CONSTRAINT `ocorrencias_instalacao_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ocorrencias_instalacao` ADD CONSTRAINT `ocorrencias_instalacao_os_id_fkey` FOREIGN KEY (`os_id`) REFERENCES `ordens_servico`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ocorrencias_instalacao` ADD CONSTRAINT `ocorrencias_instalacao_item_instalacao_id_fkey` FOREIGN KEY (`item_instalacao_id`) REFERENCES `itens_os_instalacao`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `taxas_ocorrencia_loja` ADD CONSTRAINT `taxas_ocorrencia_loja_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
