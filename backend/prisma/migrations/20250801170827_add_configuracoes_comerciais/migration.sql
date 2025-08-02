-- AlterTable
ALTER TABLE `orcamento` ADD COLUMN `atendente` VARCHAR(191) NULL DEFAULT 'Equipe Comercial',
    ADD COLUMN `forma_pagamento` VARCHAR(191) NULL DEFAULT '50% entrada, restante na entrega',
    ADD COLUMN `prazo_entrega` VARCHAR(191) NULL DEFAULT '10 a 15 dias úteis',
    ADD COLUMN `validade_proposta` VARCHAR(191) NULL DEFAULT '30 dias';
