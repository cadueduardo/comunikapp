-- AlterTable
ALTER TABLE `ordens_servico` ADD COLUMN `tipo_os` VARCHAR(191) NOT NULL DEFAULT 'COMERCIAL',
                               ADD COLUMN `origem_os` VARCHAR(191) NULL,
                               ADD COLUMN `prioridade` VARCHAR(191) NOT NULL DEFAULT 'NORMAL',
                               ADD COLUMN `departamento_solicitante` VARCHAR(191) NULL,
                               ADD COLUMN `centro_custo` VARCHAR(191) NULL,
                               ADD COLUMN `projeto_interno` VARCHAR(191) NULL,
                               ADD COLUMN `aprovacao_gerencial` VARCHAR(191) NULL DEFAULT 'PENDENTE',
                               ADD COLUMN `aprovacao_gerencial_por` VARCHAR(191) NULL,
                               ADD COLUMN `aprovacao_gerencial_em` DATETIME(3) NULL,
                               ADD COLUMN `aprovacao_gerencial_obs` TEXT NULL,
                               ADD COLUMN `valor_orcado` DECIMAL(12, 2) NULL,
                               ADD COLUMN `valor_realizado` DECIMAL(12, 2) NULL,
                               ADD COLUMN `margem_lucro_real` DECIMAL(5, 2) NULL,
                               ADD COLUMN `data_entrega_cliente` DATETIME(3) NULL,
                               ADD COLUMN `satisfacao_cliente` INT NULL,
                               ADD COLUMN `observacoes_cliente` TEXT NULL,
                               ADD COLUMN `criado_por` VARCHAR(191) NULL,
                               ADD COLUMN `modificado_por` VARCHAR(191) NULL,
                               ADD COLUMN `motivo_modificacao` TEXT NULL,
                               ADD COLUMN `versao` INT NOT NULL DEFAULT 1;

-- CreateIndex
CREATE INDEX `OrdemServico_tipo_os_idx` ON `ordens_servico`(`tipo_os`);

-- CreateIndex
CREATE INDEX `OrdemServico_origem_os_idx` ON `ordens_servico`(`origem_os`);

-- CreateIndex
CREATE INDEX `OrdemServico_prioridade_idx` ON `ordens_servico`(`prioridade`);

-- CreateIndex
CREATE INDEX `OrdemServico_departamento_solicitante_idx` ON `ordens_servico`(`departamento_solicitante`);

-- CreateIndex
CREATE INDEX `OrdemServico_centro_custo_idx` ON `ordens_servico`(`centro_custo`);

-- CreateIndex
CREATE INDEX `OrdemServico_aprovacao_gerencial_idx` ON `ordens_servico`(`aprovacao_gerencial`);

-- CreateIndex
CREATE INDEX `OrdemServico_aprovacao_gerencial_por_idx` ON `ordens_servico`(`aprovacao_gerencial_por`);

-- CreateIndex
CREATE INDEX `OrdemServico_data_entrega_cliente_idx` ON `ordens_servico`(`data_entrega_cliente`);

-- CreateIndex
CREATE INDEX `OrdemServico_criado_por_idx` ON `ordens_servico`(`criado_por`);

-- CreateIndex
CREATE INDEX `OrdemServico_modificado_por_idx` ON `ordens_servico`(`modificado_por`);

-- CreateIndex
CREATE INDEX `OrdemServico_versao_idx` ON `ordens_servico`(`versao`);
