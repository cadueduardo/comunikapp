-- CreateTable
CREATE TABLE `MensagemNegociacao` (
    `id` VARCHAR(191) NOT NULL,
    `orcamento_id` VARCHAR(191) NOT NULL,
    `mensagem` TEXT NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `autor_nome` VARCHAR(191) NULL,
    `autor_email` VARCHAR(191) NULL,
    `visualizada` BOOLEAN NOT NULL DEFAULT false,
    `anexos` JSON NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `MensagemNegociacao_orcamento_id_idx`(`orcamento_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AnexoMensagem` (
    `id` VARCHAR(191) NOT NULL,
    `mensagem_id` VARCHAR(191) NOT NULL,
    `nome_arquivo` VARCHAR(191) NOT NULL,
    `url_arquivo` VARCHAR(191) NOT NULL,
    `tipo_arquivo` VARCHAR(191) NOT NULL,
    `tamanho` INTEGER NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AnexoMensagem_mensagem_id_idx`(`mensagem_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `MensagemNegociacao` ADD CONSTRAINT `MensagemNegociacao_orcamento_id_fkey` FOREIGN KEY (`orcamento_id`) REFERENCES `Orcamento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AnexoMensagem` ADD CONSTRAINT `AnexoMensagem_mensagem_id_fkey` FOREIGN KEY (`mensagem_id`) REFERENCES `MensagemNegociacao`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
