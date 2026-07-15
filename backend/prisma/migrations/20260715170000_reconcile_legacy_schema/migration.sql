-- Reconciliacao do schema legado existente com o historico de migrations.
-- Gerada por `prisma migrate diff` entre as migrations versionadas e o banco real.
-- No banco legado, registrar com `prisma migrate resolve --applied`; em bancos novos,
-- o SQL abaixo materializa as estruturas que antes existiam apenas de forma ad-hoc.

-- DropForeignKey
ALTER TABLE `document_sequences` DROP FOREIGN KEY `document_sequences_loja_id_fkey`;

-- DropForeignKey
ALTER TABLE `setores_produtivos` DROP FOREIGN KEY `setores_produtivos_loja_id_fkey`;

-- DropIndex
DROP INDEX `document_sequence_loja_tipo_ano_key` ON `document_sequences`;

-- DropIndex
DROP INDEX `idx_insumo_id` ON `estoque_aproveitamentos`;

-- DropIndex
DROP INDEX `idx_item_os_destino_id` ON `estoque_aproveitamentos`;

-- DropIndex
DROP INDEX `idx_os_destino_id` ON `estoque_aproveitamentos`;

-- AlterTable
ALTER TABLE `checklist_instancia` MODIFY `atualizado_em` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `cliente` ADD COLUMN `ativo` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `document_sequences` DROP COLUMN `tipo_documento`,
    ADD COLUMN `tipo` VARCHAR(191) NOT NULL,
    MODIFY `atualizado_em` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `etapa_instancia` MODIFY `atualizado_em` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `fornecedor` ADD COLUMN `ativo` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `funcao` ADD COLUMN `ativo` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `setup_min` DECIMAL(10, 2) NULL,
    MODIFY `tipo_calculo` enum('ACOMPANHA_MAQUINA','POR_M2','POR_UNIDADE','POR_PECA_COM_CATEGORIA','MANUAL') NOT NULL DEFAULT 'MANUAL';

-- AlterTable
ALTER TABLE `insumos` ADD COLUMN `codigo` VARCHAR(191) NULL,
    ADD COLUMN `descricao` VARCHAR(191) NULL,
    ADD COLUMN `estoque_atual` DECIMAL(10, 3) NULL;

-- AlterTable
ALTER TABLE `maquina` ADD COLUMN `ativo` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `orcamento` ADD COLUMN `alertas` LONGTEXT NULL,
    ADD COLUMN `aprovado_por` VARCHAR(191) NULL,
    ADD COLUMN `ativo` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `categoria` VARCHAR(191) NULL,
    ADD COLUMN `comissao_percentual` DECIMAL(5, 2) NULL,
    ADD COLUMN `condicoes_comerciais` TEXT NULL,
    ADD COLUMN `configuracao_calculo` LONGTEXT NULL,
    ADD COLUMN `custos` LONGTEXT NULL,
    ADD COLUMN `custos_calculados` LONGTEXT NULL,
    ADD COLUMN `data_aprovacao` DATETIME(3) NULL,
    ADD COLUMN `data_atualizacao` DATETIME(3) NOT NULL,
    ADD COLUMN `data_criacao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `data_limite` DATETIME(3) NULL,
    ADD COLUMN `data_ultimo_calculo` DATETIME(3) NULL,
    ADD COLUMN `detalhamento_calculo` LONGTEXT NULL,
    ADD COLUMN `excluido_em` DATETIME(3) NULL,
    ADD COLUMN `excluido_por` VARCHAR(191) NULL,
    ADD COLUMN `motivo_exclusao` TEXT NULL,
    ADD COLUMN `motivo_rejeicao` TEXT NULL,
    ADD COLUMN `observacoes_internas` TEXT NULL,
    ADD COLUMN `ordem` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `prioridade` VARCHAR(191) NULL DEFAULT 'NORMAL',
    ADD COLUMN `responsavel_id` VARCHAR(191) NULL,
    ADD COLUMN `tags` TEXT NULL,
    ADD COLUMN `tipo_orcamento` VARCHAR(191) NULL DEFAULT 'PRODUTO',
    ADD COLUMN `titulo` VARCHAR(191) NULL,
    ADD COLUMN `valor_total` DECIMAL(10, 2) NULL,
    ADD COLUMN `versao_atual` INTEGER NOT NULL DEFAULT 1,
    MODIFY `margem_lucro` decimal(10,2) NOT NULL,
    MODIFY `impostos` decimal(10,2) NOT NULL;

-- AlterTable
ALTER TABLE `servico_manual` ADD COLUMN `ativo` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `categorias` LONGTEXT NULL,
    ADD COLUMN `setup_min` DECIMAL(10, 2) NULL,
    MODIFY `tipo_calculo` enum('ACOMPANHA_MAQUINA','POR_M2','POR_UNIDADE','POR_PECA_COM_CATEGORIA','MANUAL') NOT NULL DEFAULT 'MANUAL';

-- AlterTable
ALTER TABLE `template_produtos` ADD COLUMN `valor_calculado` DECIMAL(10, 2) NULL;

-- AlterTable
ALTER TABLE `usuario` ADD COLUMN `ativo` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `nome` VARCHAR(191) NULL,
    MODIFY `senha` varchar(191) NULL,
    MODIFY `telefone` varchar(191) NULL;

-- AlterTable
ALTER TABLE `workflow_categoria_regras` MODIFY `atualizado_em` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `workflow_categorias` MODIFY `descricao` text NULL,
    MODIFY `atualizado_em` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `workflow_instancia` MODIFY `atualizado_em` DATETIME(3) NOT NULL;

-- DropTable
DROP TABLE `inventory_locations`;

-- DropTable
DROP TABLE `inventory_lots`;

-- DropTable
DROP TABLE `inventory_movements`;

-- DropTable
DROP TABLE `inventory_stock`;

-- CreateTable
CREATE TABLE `acessolink` (
    `id` VARCHAR(191) NOT NULL,
    `link_id` VARCHAR(191) NOT NULL,
    `ip` VARCHAR(191) NULL,
    `user_agent` VARCHAR(191) NULL,
    `visualizacoes` INTEGER NOT NULL DEFAULT 1,
    `primeiro_acesso` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ultimo_acesso` DATETIME(3) NOT NULL,
    `ip_acesso` VARCHAR(191) NULL,
    `data_acesso` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `data_criacao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AcessoLink_link_id_idx`(`link_id` ASC),
    INDEX `AcessoLink_primeiro_acesso_idx`(`primeiro_acesso` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `aprovacaoorcamento` (
    `id` VARCHAR(191) NOT NULL,
    `orcamento_id` VARCHAR(191) NOT NULL,
    `aprovador_id` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL,
    `observacoes` TEXT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,
    `usuario` VARCHAR(191) NULL,

    INDEX `aprovacaoOrcamento_orcamento_id_idx`(`orcamento_id` ASC),
    INDEX `aprovacaoOrcamento_status_idx`(`status` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categoriainsumo` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `descricao` TEXT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    INDEX `categoriaInsumo_nome_idx`(`nome` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `checklists_os` (
    `id` VARCHAR(191) NOT NULL,
    `os_id` VARCHAR(191) NOT NULL,
    `etapa` VARCHAR(191) NOT NULL,
    `item_checklist` VARCHAR(191) NOT NULL,
    `concluido` BOOLEAN NOT NULL DEFAULT false,
    `usuario_id` VARCHAR(191) NULL,
    `data_conclusao` DATETIME(3) NULL,
    `observacoes` TEXT NULL,
    `obrigatório` BOOLEAN NOT NULL DEFAULT true,
    `ordem` INTEGER NOT NULL DEFAULT 0,

    INDEX `checklists_os_concluido_idx`(`concluido` ASC),
    INDEX `checklists_os_os_id_etapa_idx`(`os_id` ASC, `etapa` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `estoque` (
    `id` VARCHAR(191) NOT NULL,
    `insumo_id` VARCHAR(191) NOT NULL,
    `quantidade` DECIMAL(10, 3) NOT NULL,
    `tipo_movimentacao` VARCHAR(191) NOT NULL,
    `observacoes` TEXT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `loja_id` VARCHAR(191) NULL,
    `quantidade_atual` DECIMAL(10, 3) NULL,

    INDEX `estoque_criado_em_idx`(`criado_em` ASC),
    INDEX `estoque_insumo_id_idx`(`insumo_id` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `estoque_itens` (
    `id` VARCHAR(191) NOT NULL,
    `insumoId` VARCHAR(191) NOT NULL,
    `localizacaoId` VARCHAR(191) NOT NULL,
    `quantidadeAtual` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `quantidadeReservada` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `estoqueMinimo` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `estoqueMaximo` DECIMAL(65, 30) NULL,
    `lojaId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `dataUltimaMov` DATETIME(3) NULL,
    `codigo` VARCHAR(100) NULL,
    `nome` VARCHAR(255) NULL,
    `descricao` TEXT NULL,
    `unidadeMedida` VARCHAR(50) NULL,
    `precoUnitario` DECIMAL(10, 2) NULL,
    `codigoBarras` VARCHAR(100) NULL,
    `lote` VARCHAR(100) NULL,
    `dataValidade` DATE NULL,
    `observacoes` TEXT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `inventory_stock_insumoId_localizacaoId_lojaId_key`(`insumoId` ASC, `localizacaoId` ASC, `lojaId` ASC),
    INDEX `inventory_stock_insumoId_lojaId_idx`(`insumoId` ASC, `lojaId` ASC),
    INDEX `inventory_stock_localizacaoId_idx`(`localizacaoId` ASC),
    INDEX `inventory_stock_lojaId_idx`(`lojaId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `estoque_localizacoes` (
    `id` VARCHAR(191) NOT NULL,
    `codigo` VARCHAR(191) NOT NULL,
    `deposito` VARCHAR(191) NOT NULL,
    `corredor` VARCHAR(191) NULL,
    `prateleira` VARCHAR(191) NULL,
    `nivel` VARCHAR(191) NULL,
    `posicao` VARCHAR(191) NULL,
    `descricao` VARCHAR(191) NULL,
    `capacidade` DECIMAL(65, 30) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `lojaId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `inventory_locations_codigo_key`(`codigo` ASC),
    INDEX `inventory_locations_codigo_lojaId_idx`(`codigo` ASC, `lojaId` ASC),
    INDEX `inventory_locations_lojaId_idx`(`lojaId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `estoque_lotes` (
    `id` VARCHAR(191) NOT NULL,
    `estoqueId` VARCHAR(191) NOT NULL,
    `numeroLote` VARCHAR(191) NOT NULL,
    `dataFabricacao` DATETIME(3) NULL,
    `dataValidade` DATETIME(3) NULL,
    `quantidadeLote` DECIMAL(65, 30) NOT NULL,
    `status` ENUM('ATIVO', 'VENCIDO', 'CONSUMIDO', 'BLOQUEADO') NOT NULL DEFAULT 'ATIVO',
    `lojaId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `inventory_lots_dataValidade_idx`(`dataValidade` ASC),
    INDEX `inventory_lots_estoqueId_idx`(`estoqueId` ASC),
    INDEX `inventory_lots_lojaId_idx`(`lojaId` ASC),
    INDEX `inventory_lots_status_lojaId_idx`(`status` ASC, `lojaId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `estoque_movimentacoes` (
    `id` VARCHAR(191) NOT NULL,
    `estoqueId` VARCHAR(191) NOT NULL,
    `tipo` ENUM('ENTRADA', 'SAIDA', 'AJUSTE', 'INVENTARIO', 'TRANSFERENCIA') NOT NULL,
    `quantidade` DECIMAL(65, 30) NOT NULL,
    `quantidadeAnterior` DECIMAL(65, 30) NOT NULL,
    `quantidadePosterior` DECIMAL(65, 30) NOT NULL,
    `documentoRef` VARCHAR(191) NULL,
    `orcamentoId` VARCHAR(191) NULL,
    `usuarioId` VARCHAR(191) NOT NULL,
    `lojaId` VARCHAR(191) NOT NULL,
    `dataMovimentacao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `observacoes` VARCHAR(191) NULL,

    INDEX `inventory_movements_dataMovimentacao_idx`(`dataMovimentacao` ASC),
    INDEX `inventory_movements_estoqueId_idx`(`estoqueId` ASC),
    INDEX `inventory_movements_lojaId_idx`(`lojaId` ASC),
    INDEX `inventory_movements_tipo_lojaId_idx`(`tipo` ASC, `lojaId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `estoque_transferencias` (
    `id` VARCHAR(191) NOT NULL,
    `estoqueId` VARCHAR(191) NOT NULL,
    `localizacaoOrigemId` VARCHAR(191) NOT NULL,
    `localizacaoDestinoId` VARCHAR(191) NOT NULL,
    `quantidade` DECIMAL(10, 2) NOT NULL,
    `observacoes` TEXT NULL,
    `status` ENUM('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA') NULL DEFAULT 'CONCLUIDA',
    `usuarioId` VARCHAR(191) NULL,
    `lojaId` VARCHAR(191) NOT NULL,
    `dataTransferencia` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_dataTransferencia`(`dataTransferencia` ASC),
    INDEX `idx_estoqueId`(`estoqueId` ASC),
    INDEX `idx_lojaId`(`lojaId` ASC),
    INDEX `idx_status`(`status` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `execucoes_regras` (
    `id` VARCHAR(191) NOT NULL,
    `regra_id` VARCHAR(191) NOT NULL,
    `os_id` VARCHAR(191) NULL,
    `orcamento_id` VARCHAR(191) NULL,
    `resultado` VARCHAR(191) NOT NULL,
    `mensagem` TEXT NULL,
    `dados_execucao` LONGTEXT NULL,
    `tempo_execucao` INTEGER NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `execucoes_regras_criado_em_idx`(`criado_em` ASC),
    INDEX `execucoes_regras_orcamento_id_idx`(`orcamento_id` ASC),
    INDEX `execucoes_regras_os_id_idx`(`os_id` ASC),
    INDEX `execucoes_regras_regra_id_idx`(`regra_id` ASC),
    INDEX `execucoes_regras_resultado_idx`(`resultado` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `historicoorcamento` (
    `id` VARCHAR(191) NOT NULL,
    `orcamento_id` VARCHAR(191) NOT NULL,
    `acao` VARCHAR(191) NOT NULL,
    `dados_anteriores` LONGTEXT NULL,
    `dados_novos` LONGTEXT NULL,
    `usuario_id` VARCHAR(191) NULL,
    `observacoes` TEXT NULL,
    `data` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `tipo` VARCHAR(191) NULL,
    `numero` INTEGER NULL,
    `descricao` TEXT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `HistoricoOrcamento_data_idx`(`data` ASC),
    INDEX `HistoricoOrcamento_orcamento_id_idx`(`orcamento_id` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `linkpublico` (
    `id` VARCHAR(191) NOT NULL,
    `orcamento_id` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `expira_em` DATETIME(3) NULL,
    `visualizacoes_max` INTEGER NULL,
    `visualizacoes_atual` INTEGER NOT NULL DEFAULT 0,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `titulo` VARCHAR(191) NULL,
    `permissoes` LONGTEXT NULL,
    `senha` VARCHAR(191) NULL,
    `data_expiracao` DATETIME(3) NULL,
    `criado_por_usuario` VARCHAR(191) NULL,
    `visualizacoes` INTEGER NULL,
    `max_visualizacoes` INTEGER NULL,
    `atualizado_em` DATETIME(3) NOT NULL,

    INDEX `LinkPublico_ativo_idx`(`ativo` ASC),
    INDEX `LinkPublico_orcamento_id_idx`(`orcamento_id` ASC),
    INDEX `LinkPublico_token_idx`(`token` ASC),
    UNIQUE INDEX `LinkPublico_token_key`(`token` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mensagemchat` (
    `id` VARCHAR(191) NOT NULL,
    `orcamento_id` VARCHAR(191) NOT NULL,
    `usuario_id` VARCHAR(191) NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `conteudo` TEXT NOT NULL,
    `dados_extras` LONGTEXT NULL,
    `lida` BOOLEAN NOT NULL DEFAULT false,
    `data_leitura` DATETIME(3) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `anexos` LONGTEXT NULL,
    `data_envio` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `usuario` VARCHAR(191) NULL,
    `dados` LONGTEXT NULL,

    INDEX `MensagemChat_criado_em_idx`(`criado_em` ASC),
    INDEX `MensagemChat_orcamento_id_idx`(`orcamento_id` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `movimentacoes_os` (
    `id` VARCHAR(191) NOT NULL,
    `os_id` VARCHAR(191) NOT NULL,
    `etapa_anterior` VARCHAR(191) NULL,
    `etapa_atual` VARCHAR(191) NOT NULL,
    `usuario_id` VARCHAR(191) NOT NULL,
    `data_movimentacao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `observacoes` TEXT NULL,
    `anexos` LONGTEXT NULL,
    `ip_origem` VARCHAR(191) NULL,
    `user_agent` VARCHAR(191) NULL,

    INDEX `movimentacoes_os_data_movimentacao_idx`(`data_movimentacao` ASC),
    INDEX `movimentacoes_os_os_id_idx`(`os_id` ASC),
    INDEX `movimentacoes_os_usuario_id_idx`(`usuario_id` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ordem_servico_logs` (
    `id` VARCHAR(191) NOT NULL,
    `os_id` VARCHAR(191) NOT NULL,
    `tipo_acao` VARCHAR(191) NOT NULL,
    `descricao` TEXT NOT NULL,
    `dados_extras` LONGTEXT NULL,
    `ip_origem` VARCHAR(191) NULL,
    `user_agent` VARCHAR(191) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `usuario_id` VARCHAR(191) NULL,

    INDEX `ordem_servico_logs_criado_em_idx`(`criado_em` ASC),
    INDEX `ordem_servico_logs_os_id_idx`(`os_id` ASC),
    INDEX `ordem_servico_logs_tipo_acao_idx`(`tipo_acao` ASC),
    INDEX `ordem_servico_logs_usuario_id_idx`(`usuario_id` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `perfil_acesso` (
    `id` VARCHAR(191) NOT NULL,
    `loja_id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `descricao` TEXT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `sistema` BOOLEAN NOT NULL DEFAULT false,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    INDEX `perfil_acesso_loja_id_idx`(`loja_id` ASC),
    UNIQUE INDEX `perfil_acesso_loja_id_nome_key`(`loja_id` ASC, `nome` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `perfil_permissao` (
    `id` VARCHAR(191) NOT NULL,
    `perfil_id` VARCHAR(191) NOT NULL,
    `modulo` VARCHAR(191) NOT NULL,
    `acao` VARCHAR(191) NOT NULL,
    `permitido` BOOLEAN NOT NULL DEFAULT true,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `perfil_permissao_perfil_id_idx`(`perfil_id` ASC),
    UNIQUE INDEX `perfil_permissao_perfil_id_modulo_acao_key`(`perfil_id` ASC, `modulo` ASC, `acao` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `regras_validacao` (
    `id` VARCHAR(191) NOT NULL,
    `loja_id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `descricao` TEXT NULL,
    `categoria` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `condicoes` LONGTEXT NOT NULL,
    `acoes` LONGTEXT NULL,
    `mensagem` TEXT NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `prioridade` INTEGER NOT NULL DEFAULT 0,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    INDEX `regras_validacao_ativo_idx`(`ativo` ASC),
    INDEX `regras_validacao_categoria_idx`(`categoria` ASC),
    INDEX `regras_validacao_loja_id_idx`(`loja_id` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usuario_perfil` (
    `usuario_id` VARCHAR(191) NOT NULL,
    `perfil_id` VARCHAR(191) NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `usuario_perfil_perfil_id_idx`(`perfil_id` ASC),
    INDEX `usuario_perfil_usuario_id_idx`(`usuario_id` ASC),
    PRIMARY KEY (`usuario_id` ASC, `perfil_id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `versaoorcamento` (
    `id` VARCHAR(191) NOT NULL,
    `orcamento_id` VARCHAR(191) NOT NULL,
    `versao` INTEGER NOT NULL,
    `dados_completos` LONGTEXT NOT NULL,
    `motivo_alteracao` TEXT NULL,
    `usuario_id` VARCHAR(191) NULL,
    `numero` INTEGER NULL,
    `responsavel_id` VARCHAR(191) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `VersaoOrcamento_orcamento_id_idx`(`orcamento_id` ASC),
    UNIQUE INDEX `VersaoOrcamento_orcamento_id_versao_key`(`orcamento_id` ASC, `versao` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workflow_instancia_setor` (
    `id` VARCHAR(191) NOT NULL,
    `workflow_instancia_id` VARCHAR(191) NOT NULL,
    `setor_id` VARCHAR(191) NOT NULL,
    `item_os_id` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDENTE',
    `ordem` INTEGER NOT NULL DEFAULT 0,
    `data_inicio` DATETIME(3) NULL,
    `data_conclusao` DATETIME(3) NULL,
    `operador_id` VARCHAR(191) NULL,
    `tempo_estimado` INTEGER NULL,
    `tempo_real` INTEGER NULL,
    `observacoes` TEXT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    INDEX `workflow_instancia_setor_item_os_id_idx`(`item_os_id` ASC),
    INDEX `workflow_instancia_setor_operador_id_idx`(`operador_id` ASC),
    INDEX `workflow_instancia_setor_setor_id_idx`(`setor_id` ASC),
    INDEX `workflow_instancia_setor_status_idx`(`status` ASC),
    INDEX `workflow_instancia_setor_workflow_instancia_id_idx`(`workflow_instancia_id` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `document_sequences_loja_id_idx` ON `document_sequences`(`loja_id` ASC);

-- CreateIndex
CREATE UNIQUE INDEX `document_sequences_loja_id_tipo_ano_key` ON `document_sequences`(`loja_id` ASC, `tipo` ASC, `ano` ASC);

-- CreateIndex
CREATE INDEX `Orcamento_loja_id_numero_idx` ON `orcamento`(`loja_id` ASC, `numero` ASC);

-- CreateIndex
CREATE INDEX `orcamento_ativo_idx` ON `orcamento`(`ativo` ASC);

-- CreateIndex
CREATE INDEX `orcamento_responsavel_id_idx` ON `orcamento`(`responsavel_id` ASC);

-- CreateIndex
CREATE INDEX `orcamento_status_idx` ON `orcamento`(`status` ASC);

-- CreateIndex
CREATE INDEX `orcamento_tipo_orcamento_idx` ON `orcamento`(`tipo_orcamento` ASC);

-- CreateIndex
CREATE UNIQUE INDEX `servico_manual_loja_id_nome_key` ON `servico_manual`(`loja_id` ASC, `nome` ASC);

-- AddForeignKey
ALTER TABLE `acessolink` ADD CONSTRAINT `AcessoLink_link_id_fkey` FOREIGN KEY (`link_id`) REFERENCES `linkpublico`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aprovacaoorcamento` ADD CONSTRAINT `aprovacaoOrcamento_orcamento_id_fkey` FOREIGN KEY (`orcamento_id`) REFERENCES `orcamento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `checklists_os` ADD CONSTRAINT `checklists_os_os_id_fkey` FOREIGN KEY (`os_id`) REFERENCES `ordens_servico`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `estoque` ADD CONSTRAINT `estoque_insumo_id_fkey` FOREIGN KEY (`insumo_id`) REFERENCES `insumos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `execucoes_regras` ADD CONSTRAINT `execucoes_regras_orcamento_id_fkey` FOREIGN KEY (`orcamento_id`) REFERENCES `orcamento`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `execucoes_regras` ADD CONSTRAINT `execucoes_regras_os_id_fkey` FOREIGN KEY (`os_id`) REFERENCES `ordens_servico`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `execucoes_regras` ADD CONSTRAINT `execucoes_regras_regra_id_fkey` FOREIGN KEY (`regra_id`) REFERENCES `regras_validacao`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `historicoorcamento` ADD CONSTRAINT `HistoricoOrcamento_orcamento_id_fkey` FOREIGN KEY (`orcamento_id`) REFERENCES `orcamento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `linkpublico` ADD CONSTRAINT `LinkPublico_orcamento_id_fkey` FOREIGN KEY (`orcamento_id`) REFERENCES `orcamento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mensagemchat` ADD CONSTRAINT `MensagemChat_orcamento_id_fkey` FOREIGN KEY (`orcamento_id`) REFERENCES `orcamento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movimentacoes_os` ADD CONSTRAINT `movimentacoes_os_os_id_fkey` FOREIGN KEY (`os_id`) REFERENCES `ordens_servico`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orcamento` ADD CONSTRAINT `orcamento_responsavel_id_fkey` FOREIGN KEY (`responsavel_id`) REFERENCES `usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ordem_servico_logs` ADD CONSTRAINT `ordem_servico_logs_os_id_fkey` FOREIGN KEY (`os_id`) REFERENCES `ordens_servico`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ordem_servico_logs` ADD CONSTRAINT `ordem_servico_logs_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `perfil_acesso` ADD CONSTRAINT `perfil_acesso_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `perfil_permissao` ADD CONSTRAINT `perfil_permissao_perfil_id_fkey` FOREIGN KEY (`perfil_id`) REFERENCES `perfil_acesso`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `regras_validacao` ADD CONSTRAINT `regras_validacao_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `setores_produtivos` ADD CONSTRAINT `setores_produtivos_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usuario_perfil` ADD CONSTRAINT `usuario_perfil_perfil_id_fkey` FOREIGN KEY (`perfil_id`) REFERENCES `perfil_acesso`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usuario_perfil` ADD CONSTRAINT `usuario_perfil_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `versaoorcamento` ADD CONSTRAINT `VersaoOrcamento_orcamento_id_fkey` FOREIGN KEY (`orcamento_id`) REFERENCES `orcamento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workflow_instancia_setor` ADD CONSTRAINT `workflow_instancia_setor_item_os_id_fkey` FOREIGN KEY (`item_os_id`) REFERENCES `itens_os`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workflow_instancia_setor` ADD CONSTRAINT `workflow_instancia_setor_operador_id_fkey` FOREIGN KEY (`operador_id`) REFERENCES `usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workflow_instancia_setor` ADD CONSTRAINT `workflow_instancia_setor_setor_id_fkey` FOREIGN KEY (`setor_id`) REFERENCES `setores_produtivos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workflow_instancia_setor` ADD CONSTRAINT `workflow_instancia_setor_workflow_instancia_id_fkey` FOREIGN KEY (`workflow_instancia_id`) REFERENCES `workflow_instancia`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- MariaDB nao suporta ALTER TABLE ... RENAME INDEX em todas as versoes.
-- Recriamos os indices com os nomes canonicos mapeados pelo Prisma.
DROP INDEX `OrdemServico_aprovacao_gerencial_idx` ON `ordens_servico`;
CREATE INDEX `ordens_servico_aprovacao_gerencial_idx` ON `ordens_servico`(`aprovacao_gerencial`);

DROP INDEX `OrdemServico_aprovacao_gerencial_por_idx` ON `ordens_servico`;
CREATE INDEX `ordens_servico_aprovacao_gerencial_por_idx` ON `ordens_servico`(`aprovacao_gerencial_por`);

DROP INDEX `OrdemServico_centro_custo_idx` ON `ordens_servico`;
CREATE INDEX `ordens_servico_centro_custo_idx` ON `ordens_servico`(`centro_custo`);

DROP INDEX `OrdemServico_criado_por_idx` ON `ordens_servico`;
CREATE INDEX `ordens_servico_criado_por_idx` ON `ordens_servico`(`criado_por`);

DROP INDEX `OrdemServico_data_entrega_cliente_idx` ON `ordens_servico`;
CREATE INDEX `ordens_servico_data_entrega_cliente_idx` ON `ordens_servico`(`data_entrega_cliente`);

DROP INDEX `OrdemServico_departamento_solicitante_idx` ON `ordens_servico`;
CREATE INDEX `ordens_servico_departamento_solicitante_idx` ON `ordens_servico`(`departamento_solicitante`);

DROP INDEX `OrdemServico_modificado_por_idx` ON `ordens_servico`;
CREATE INDEX `ordens_servico_modificado_por_idx` ON `ordens_servico`(`modificado_por`);

DROP INDEX `OrdemServico_origem_os_idx` ON `ordens_servico`;
CREATE INDEX `ordens_servico_origem_os_idx` ON `ordens_servico`(`origem_os`);

DROP INDEX `OrdemServico_prioridade_idx` ON `ordens_servico`;
CREATE INDEX `ordens_servico_prioridade_idx` ON `ordens_servico`(`prioridade`);

DROP INDEX `OrdemServico_tipo_os_idx` ON `ordens_servico`;
CREATE INDEX `ordens_servico_tipo_os_idx` ON `ordens_servico`(`tipo_os`);

DROP INDEX `OrdemServico_versao_idx` ON `ordens_servico`;
CREATE INDEX `ordens_servico_versao_idx` ON `ordens_servico`(`versao`);
