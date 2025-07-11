/*
  Warnings:

  - You are about to drop the column `address` on the `loja` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `loja` table. All the data in the column will be lost.
  - You are about to drop the column `current_period_ends_at` on the `loja` table. All the data in the column will be lost.
  - You are about to drop the column `documento` on the `loja` table. All the data in the column will be lost.
  - You are about to drop the column `gateway_customer_id` on the `loja` table. All the data in the column will be lost.
  - You are about to drop the column `gateway_subscription_id` on the `loja` table. All the data in the column will be lost.
  - You are about to drop the column `logoUrl` on the `loja` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `loja` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `loja` table. All the data in the column will be lost.
  - You are about to drop the column `responsavel` on the `loja` table. All the data in the column will be lost.
  - You are about to drop the column `subscription_status` on the `loja` table. All the data in the column will be lost.
  - You are about to drop the column `tipo_pessoa` on the `loja` table. All the data in the column will be lost.
  - You are about to drop the column `trial_ends_at` on the `loja` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `loja` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[cnpj]` on the table `Loja` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cpf]` on the table `Loja` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripe_customer_id]` on the table `Loja` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `atualizado_em` to the `Loja` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nome` to the `Loja` table without a default value. This is not possible if the table is not empty.
  - Added the required column `telefone` to the `Loja` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `Loja_documento_key` ON `loja`;

-- DropIndex
DROP INDEX `Loja_gateway_customer_id_key` ON `loja`;

-- DropIndex
DROP INDEX `Loja_gateway_subscription_id_key` ON `loja`;

-- AlterTable
ALTER TABLE `loja` DROP COLUMN `address`,
    DROP COLUMN `createdAt`,
    DROP COLUMN `current_period_ends_at`,
    DROP COLUMN `documento`,
    DROP COLUMN `gateway_customer_id`,
    DROP COLUMN `gateway_subscription_id`,
    DROP COLUMN `logoUrl`,
    DROP COLUMN `name`,
    DROP COLUMN `phone`,
    DROP COLUMN `responsavel`,
    DROP COLUMN `subscription_status`,
    DROP COLUMN `tipo_pessoa`,
    DROP COLUMN `trial_ends_at`,
    DROP COLUMN `updatedAt`,
    ADD COLUMN `assinatura_ativa` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `atualizado_em` DATETIME(3) NOT NULL,
    ADD COLUMN `cabecalho_orcamento` TEXT NULL,
    ADD COLUMN `cnpj` VARCHAR(191) NULL,
    ADD COLUMN `cpf` VARCHAR(191) NULL,
    ADD COLUMN `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `custo_maodeobra_hora` DECIMAL(10, 2) NULL,
    ADD COLUMN `custo_maquinaria_hora` DECIMAL(10, 2) NULL,
    ADD COLUMN `custos_indiretos_mensais` DECIMAL(10, 2) NULL,
    ADD COLUMN `data_inicio_trial` DATETIME(3) NULL,
    ADD COLUMN `impostos_padrao` DECIMAL(5, 2) NULL,
    ADD COLUMN `logo_url` VARCHAR(191) NULL,
    ADD COLUMN `margem_lucro_padrao` DECIMAL(5, 2) NULL,
    ADD COLUMN `nome` VARCHAR(191) NOT NULL,
    ADD COLUMN `stripe_customer_id` VARCHAR(191) NULL,
    ADD COLUMN `telefone` VARCHAR(191) NOT NULL,
    ADD COLUMN `trial_restante_dias` INTEGER NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Loja_cnpj_key` ON `Loja`(`cnpj`);

-- CreateIndex
CREATE UNIQUE INDEX `Loja_cpf_key` ON `Loja`(`cpf`);

-- CreateIndex
CREATE UNIQUE INDEX `Loja_stripe_customer_id_key` ON `Loja`(`stripe_customer_id`);
