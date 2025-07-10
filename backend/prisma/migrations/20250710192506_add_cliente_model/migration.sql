-- CreateTable
CREATE TABLE `Cliente` (
    `id` VARCHAR(191) NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `tipo_pessoa` ENUM('PESSOA_FISICA', 'PESSOA_JURIDICA') NOT NULL,
    `documento` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `telefone` VARCHAR(191) NULL,
    `whatsapp` VARCHAR(191) NULL,
    `cep` VARCHAR(191) NULL,
    `endereco` VARCHAR(191) NULL,
    `numero` VARCHAR(191) NULL,
    `complemento` VARCHAR(191) NULL,
    `bairro` VARCHAR(191) NULL,
    `cidade` VARCHAR(191) NULL,
    `estado` VARCHAR(191) NULL,
    `razao_social` VARCHAR(191) NULL,
    `nome_fantasia` VARCHAR(191) NULL,
    `inscricao_estadual` VARCHAR(191) NULL,
    `responsavel` VARCHAR(191) NULL,
    `cargo_responsavel` VARCHAR(191) NULL,
    `observacoes` TEXT NULL,
    `status_cliente` ENUM('ATIVO', 'INATIVO', 'PROSPECT', 'BLOQUEADO') NOT NULL DEFAULT 'ATIVO',
    `origem` VARCHAR(191) NULL,
    `segmento` VARCHAR(191) NULL,
    `loja_id` VARCHAR(191) NOT NULL,

    INDEX `Cliente_loja_id_idx`(`loja_id`),
    INDEX `Cliente_loja_id_nome_idx`(`loja_id`, `nome`),
    INDEX `Cliente_loja_id_documento_idx`(`loja_id`, `documento`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Cliente` ADD CONSTRAINT `Cliente_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `Loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
