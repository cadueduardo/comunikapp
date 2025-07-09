-- CreateTable
CREATE TABLE `Loja` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `cnpj` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `responsavel` VARCHAR(191) NULL,
    `logoUrl` VARCHAR(191) NULL,
    `gateway_customer_id` VARCHAR(191) NULL,
    `gateway_subscription_id` VARCHAR(191) NULL,
    `subscription_status` VARCHAR(191) NULL,
    `trial_ends_at` DATETIME(3) NULL,
    `current_period_ends_at` DATETIME(3) NULL,

    UNIQUE INDEX `Loja_cnpj_key`(`cnpj`),
    UNIQUE INDEX `Loja_email_key`(`email`),
    UNIQUE INDEX `Loja_gateway_customer_id_key`(`gateway_customer_id`),
    UNIQUE INDEX `Loja_gateway_subscription_id_key`(`gateway_subscription_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Usuario` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `role` ENUM('ADMINISTRADOR', 'FINANCEIRO', 'PRODUCAO', 'VENDAS', 'ESTOQUE') NOT NULL DEFAULT 'VENDAS',
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `lojaId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Usuario_email_key`(`email`),
    INDEX `Usuario_lojaId_idx`(`lojaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Usuario` ADD CONSTRAINT `Usuario_lojaId_fkey` FOREIGN KEY (`lojaId`) REFERENCES `Loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
