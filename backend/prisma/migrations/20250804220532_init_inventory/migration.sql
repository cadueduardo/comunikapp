-- CreateTable
CREATE TABLE `inventory_locations` (
    `id` VARCHAR(191) NOT NULL,
    `codigo` VARCHAR(191) NOT NULL,
    `deposito` VARCHAR(191) NOT NULL,
    `corredor` VARCHAR(191) NULL,
    `prateleira` VARCHAR(191) NULL,
    `nivel` VARCHAR(191) NULL,
    `posicao` VARCHAR(191) NULL,
    `descricao` VARCHAR(191) NULL,
    `capacidade` DECIMAL(65, 30) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `lojaId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `inventory_locations_codigo_key`(`codigo`),
    INDEX `inventory_locations_lojaId_idx`(`lojaId`),
    INDEX `inventory_locations_codigo_lojaId_idx`(`codigo`, `lojaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inventory_stock` (
    `id` VARCHAR(191) NOT NULL,
    `insumoId` VARCHAR(191) NOT NULL,
    `localizacaoId` VARCHAR(191) NOT NULL,
    `quantidadeAtual` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `quantidadeReservada` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `estoqueMinimo` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `estoqueMaximo` DECIMAL(65, 30) NULL,
    `lojaId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `dataUltimaMov` DATETIME(3) NULL,

    INDEX `inventory_stock_lojaId_idx`(`lojaId`),
    INDEX `inventory_stock_insumoId_lojaId_idx`(`insumoId`, `lojaId`),
    INDEX `inventory_stock_localizacaoId_idx`(`localizacaoId`),
    UNIQUE INDEX `inventory_stock_insumoId_localizacaoId_lojaId_key`(`insumoId`, `localizacaoId`, `lojaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inventory_movements` (
    `id` VARCHAR(191) NOT NULL,
    `estoqueId` VARCHAR(191) NOT NULL,
    `tipo` ENUM('ENTRADA', 'SAIDA', 'AJUSTE', 'INVENTARIO', 'TRANSFERENCIA') NOT NULL,
    `quantidade` DECIMAL(65, 30) NOT NULL,
    `quantidadeAnterior` DECIMAL(65, 30) NOT NULL,
    `quantidadePosterior` DECIMAL(65, 30) NOT NULL,
    `documentoRef` VARCHAR(191) NULL,
    `orcamentoId` VARCHAR(191) NULL,
    `usuarioId` VARCHAR(191) NOT NULL,
    `lojaId` VARCHAR(191) NOT NULL,
    `dataMovimentacao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `observacoes` VARCHAR(191) NULL,

    INDEX `inventory_movements_lojaId_idx`(`lojaId`),
    INDEX `inventory_movements_estoqueId_idx`(`estoqueId`),
    INDEX `inventory_movements_dataMovimentacao_idx`(`dataMovimentacao`),
    INDEX `inventory_movements_tipo_lojaId_idx`(`tipo`, `lojaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inventory_lots` (
    `id` VARCHAR(191) NOT NULL,
    `estoqueId` VARCHAR(191) NOT NULL,
    `numeroLote` VARCHAR(191) NOT NULL,
    `dataFabricacao` DATETIME(3) NULL,
    `dataValidade` DATETIME(3) NULL,
    `quantidadeLote` DECIMAL(65, 30) NOT NULL,
    `status` ENUM('ATIVO', 'VENCIDO', 'CONSUMIDO', 'BLOQUEADO') NOT NULL DEFAULT 'ATIVO',
    `lojaId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `inventory_lots_lojaId_idx`(`lojaId`),
    INDEX `inventory_lots_estoqueId_idx`(`estoqueId`),
    INDEX `inventory_lots_dataValidade_idx`(`dataValidade`),
    INDEX `inventory_lots_status_lojaId_idx`(`status`, `lojaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
