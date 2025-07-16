-- CreateTable
CREATE TABLE `Notificacao` (
    `id` VARCHAR(191) NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `tipo` VARCHAR(191) NOT NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `mensagem` TEXT NOT NULL,
    `lida` BOOLEAN NOT NULL DEFAULT false,
    `loja_id` VARCHAR(191) NOT NULL,
    `orcamento_id` VARCHAR(191) NULL,

    INDEX `Notificacao_loja_id_idx`(`loja_id`),
    INDEX `Notificacao_orcamento_id_idx`(`orcamento_id`),
    INDEX `Notificacao_loja_id_lida_idx`(`loja_id`, `lida`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Notificacao` ADD CONSTRAINT `Notificacao_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `Loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notificacao` ADD CONSTRAINT `Notificacao_orcamento_id_fkey` FOREIGN KEY (`orcamento_id`) REFERENCES `Orcamento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
