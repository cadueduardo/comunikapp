-- Expande primeiro com colunas opcionais para preservar as etapas existentes.
ALTER TABLE `workflow_instancia_setor`
    ADD COLUMN `loja_id` VARCHAR(191) NULL,
    ADD COLUMN `workflow_id` VARCHAR(191) NULL;

-- Os valores são derivados de relacionamentos já protegidos por foreign keys.
UPDATE `workflow_instancia_setor` AS `etapa`
INNER JOIN `workflow_instancia` AS `instancia`
    ON `instancia`.`id` = `etapa`.`workflow_instancia_id`
INNER JOIN `ordens_servico` AS `os`
    ON `os`.`id` = `instancia`.`os_id`
SET
    `etapa`.`loja_id` = `os`.`loja_id`,
    `etapa`.`workflow_id` = `instancia`.`workflow_id`;

-- Contrai somente após o backfill; qualquer inconsistência residual faz a
-- migration falhar em vez de gravar uma atribuição multi-tenant incorreta.
ALTER TABLE `workflow_instancia_setor`
    MODIFY `loja_id` VARCHAR(191) NOT NULL,
    MODIFY `workflow_id` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE INDEX `workflow_instancia_setor_loja_id_status_idx` ON `workflow_instancia_setor`(`loja_id`, `status`);

-- CreateIndex
CREATE INDEX `workflow_instancia_setor_workflow_id_idx` ON `workflow_instancia_setor`(`workflow_id`);

ALTER TABLE `workflow_instancia_setor` ADD CONSTRAINT `workflow_instancia_setor_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `workflow_instancia_setor` ADD CONSTRAINT `workflow_instancia_setor_workflow_id_fkey` FOREIGN KEY (`workflow_id`) REFERENCES `workflows_os`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
