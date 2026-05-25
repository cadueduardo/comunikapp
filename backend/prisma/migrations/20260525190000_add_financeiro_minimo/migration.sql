-- Migration Fase 6 - Financeiro Minimo
-- Adiciona campos estruturados de condicao de pagamento em `orcamento` e cria
-- as tabelas de cobranca, parcelas, recebimentos e auditoria.
--
-- Decisao Fase 0 (docs/fase-0-home-operacional/01-status-oficiais.md):
--   Cobranca.status oficiais: PREVISTA | PARCIAL_PAGO | LIQUIDADO | VENCIDO | CANCELADA
--   CobrancaParcela.status oficiais: PREVISTO | PARCIAL_PAGO | LIQUIDADO | VENCIDO | CANCELADA
--   tipo aceito em cobrancas: A_VISTA | ENTRADA_SALDO | FATURADO_30 | FATURADO_60 | FATURADO_90 | PARCELADO | PERSONALIZADO
--   metodo de recebimento: PIX | TRANSFERENCIA | BOLETO | DINHEIRO | CARTAO | OUTRO
--
-- Idempotencia: este script assume execucao unica via prisma migrate.

-- AlterTable: campos estruturados em `orcamento`
ALTER TABLE `orcamento`
    ADD COLUMN `condicao_pagamento_tipo` VARCHAR(32) NULL,
    ADD COLUMN `condicao_pagamento_entrada_pct` DECIMAL(5, 2) NULL,
    ADD COLUMN `condicao_pagamento_parcelas` INTEGER NULL,
    ADD COLUMN `condicao_pagamento_descricao` VARCHAR(255) NULL;

-- CreateTable: cobrancas (1:1 com orcamento)
CREATE TABLE `cobrancas` (
    `id` VARCHAR(191) NOT NULL,
    `loja_id` VARCHAR(191) NOT NULL,
    `orcamento_id` VARCHAR(191) NOT NULL,
    `cliente_id` VARCHAR(191) NULL,
    `tipo` VARCHAR(32) NOT NULL,
    `descricao` VARCHAR(255) NULL,
    `status` VARCHAR(24) NOT NULL DEFAULT 'PREVISTA',
    `valor_total` DECIMAL(12, 2) NOT NULL,
    `valor_recebido` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `valor_saldo` DECIMAL(12, 2) NOT NULL,
    `data_aprovacao` DATETIME(3) NOT NULL,
    `liquidado_em` DATETIME(3) NULL,
    `cancelado_em` DATETIME(3) NULL,
    `cancelado_por` VARCHAR(191) NULL,
    `motivo_cancelamento` TEXT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,
    `criado_por` VARCHAR(191) NULL,

    UNIQUE INDEX `cobrancas_orcamento_id_key`(`orcamento_id`),
    INDEX `cobrancas_loja_id_idx`(`loja_id`),
    INDEX `cobrancas_cliente_id_idx`(`cliente_id`),
    INDEX `cobrancas_status_idx`(`status`),
    INDEX `cobrancas_data_aprovacao_idx`(`data_aprovacao`),
    INDEX `cobrancas_loja_id_status_idx`(`loja_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: cobranca_parcelas (N por cobranca)
CREATE TABLE `cobranca_parcelas` (
    `id` VARCHAR(191) NOT NULL,
    `cobranca_id` VARCHAR(191) NOT NULL,
    `ordem` INTEGER NOT NULL,
    `tipo` VARCHAR(16) NOT NULL,
    `valor_previsto` DECIMAL(12, 2) NOT NULL,
    `valor_recebido` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `data_vencimento` DATETIME(3) NOT NULL,
    `status` VARCHAR(24) NOT NULL DEFAULT 'PREVISTO',
    `liquidado_em` DATETIME(3) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    INDEX `cobranca_parcelas_cobranca_id_idx`(`cobranca_id`),
    INDEX `cobranca_parcelas_status_idx`(`status`),
    INDEX `cobranca_parcelas_data_vencimento_idx`(`data_vencimento`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: cobranca_recebimentos (N por parcela)
CREATE TABLE `cobranca_recebimentos` (
    `id` VARCHAR(191) NOT NULL,
    `cobranca_id` VARCHAR(191) NOT NULL,
    `parcela_id` VARCHAR(191) NULL,
    `valor` DECIMAL(12, 2) NOT NULL,
    `data_recebimento` DATETIME(3) NOT NULL,
    `metodo` VARCHAR(16) NOT NULL,
    `observacoes` TEXT NULL,
    `forcado` BOOLEAN NOT NULL DEFAULT false,
    `usuario_id` VARCHAR(191) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `cobranca_recebimentos_cobranca_id_idx`(`cobranca_id`),
    INDEX `cobranca_recebimentos_parcela_id_idx`(`parcela_id`),
    INDEX `cobranca_recebimentos_data_recebimento_idx`(`data_recebimento`),
    INDEX `cobranca_recebimentos_usuario_id_idx`(`usuario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: cobranca_logs (auditoria de transicoes)
CREATE TABLE `cobranca_logs` (
    `id` VARCHAR(191) NOT NULL,
    `cobranca_id` VARCHAR(191) NOT NULL,
    `tipo_acao` VARCHAR(32) NOT NULL,
    `descricao` TEXT NOT NULL,
    `status_anterior` VARCHAR(24) NULL,
    `status_novo` VARCHAR(24) NULL,
    `valor_movimentado` DECIMAL(12, 2) NULL,
    `usuario_id` VARCHAR(191) NULL,
    `ip_origem` VARCHAR(45) NULL,
    `user_agent` VARCHAR(255) NULL,
    `dados_extras` LONGTEXT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `cobranca_logs_cobranca_id_idx`(`cobranca_id`),
    INDEX `cobranca_logs_tipo_acao_idx`(`tipo_acao`),
    INDEX `cobranca_logs_criado_em_idx`(`criado_em`),
    INDEX `cobranca_logs_usuario_id_idx`(`usuario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey: cobrancas -> loja / orcamento / cliente
ALTER TABLE `cobrancas` ADD CONSTRAINT `cobrancas_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `cobrancas` ADD CONSTRAINT `cobrancas_orcamento_id_fkey` FOREIGN KEY (`orcamento_id`) REFERENCES `orcamento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `cobrancas` ADD CONSTRAINT `cobrancas_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `cliente`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: cobranca_parcelas -> cobranca
ALTER TABLE `cobranca_parcelas` ADD CONSTRAINT `cobranca_parcelas_cobranca_id_fkey` FOREIGN KEY (`cobranca_id`) REFERENCES `cobrancas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: cobranca_recebimentos -> cobranca / parcela / usuario
ALTER TABLE `cobranca_recebimentos` ADD CONSTRAINT `cobranca_recebimentos_cobranca_id_fkey` FOREIGN KEY (`cobranca_id`) REFERENCES `cobrancas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `cobranca_recebimentos` ADD CONSTRAINT `cobranca_recebimentos_parcela_id_fkey` FOREIGN KEY (`parcela_id`) REFERENCES `cobranca_parcelas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `cobranca_recebimentos` ADD CONSTRAINT `cobranca_recebimentos_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: cobranca_logs -> cobranca / usuario
ALTER TABLE `cobranca_logs` ADD CONSTRAINT `cobranca_logs_cobranca_id_fkey` FOREIGN KEY (`cobranca_id`) REFERENCES `cobrancas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `cobranca_logs` ADD CONSTRAINT `cobranca_logs_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
