-- CreateTable
CREATE TABLE `historico_custo_maquinas` (
    `id` VARCHAR(191) NOT NULL,
    `maquina_id` VARCHAR(191) NOT NULL,
    `custo_hora` DECIMAL(10, 2) NOT NULL,
    `data_inicio` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `data_fim` DATETIME(3) NULL,
    `observacoes` VARCHAR(191) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `historico_custo_funcoes` (
    `id` VARCHAR(191) NOT NULL,
    `funcao_id` VARCHAR(191) NOT NULL,
    `custo_hora` DECIMAL(10, 2) NOT NULL,
    `data_inicio` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `data_fim` DATETIME(3) NULL,
    `observacoes` VARCHAR(191) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `historico_custo_maquinas` ADD CONSTRAINT `historico_custo_maquinas_maquina_id_fkey` FOREIGN KEY (`maquina_id`) REFERENCES `Maquina`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `historico_custo_funcoes` ADD CONSTRAINT `historico_custo_funcoes_funcao_id_fkey` FOREIGN KEY (`funcao_id`) REFERENCES `Funcao`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
