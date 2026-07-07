-- DropIndex
DROP INDEX `Orcamento_loja_id_numero_idx` ON `orcamento`;

-- CreateTable
CREATE TABLE `document_sequences` (
    `id` VARCHAR(191) NOT NULL,
    `loja_id` VARCHAR(191) NOT NULL,
    `tipo_documento` VARCHAR(191) NOT NULL,
    `ano` INTEGER NOT NULL,
    `ultimo_numero` INTEGER NOT NULL DEFAULT 0,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `document_sequence_loja_tipo_ano_key` ON `document_sequences`(`loja_id`, `tipo_documento`, `ano`);

-- AddForeignKey
ALTER TABLE `document_sequences`
  ADD CONSTRAINT `document_sequences_loja_id_fkey`
  FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- `Orcamento_loja_id_numero_key` ja existe desde a migration 20250712135930_add_orcamento_models
-- (criada junto com a tabela). Recriar aqui causava "Duplicate key name" num replay do zero.
