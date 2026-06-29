-- =============================================================================
-- ComunikApp — Schema MySQL completo (gerado a partir do Prisma)
-- =============================================================================
-- Data de geração : 2026-06-26
-- Fonte          : backend/prisma/schema.prisma
-- Comando        : npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script
-- Migrations     : 68 arquivos em backend/prisma/migrations/
-- Modelos Prisma : 90 models
--
-- Uso:
--   - Referência para análise de estrutura, relacionamentos e índices.
--   - NÃO substitui o histórico incremental de migrations em produção.
--   - Para ambiente novo: preferir `npx prisma migrate deploy` no backend.
--
-- Documentação relacionada:
--   - docs/analise-profunda-sistema-comunikapp.md
-- =============================================================================

-- CreateTable
CREATE TABLE `insumos` (
    `id` VARCHAR(191) NOT NULL,
    `loja_id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `descricao_tecnica` VARCHAR(191) NULL,
    `descricao` VARCHAR(191) NULL,
    `codigo` VARCHAR(191) NULL,
    `custo_unitario` DECIMAL(10, 2) NOT NULL,
    `estoque_minimo` INTEGER NULL,
    `estoque_atual` DECIMAL(10, 3) NULL,
    `codigo_interno` VARCHAR(191) NULL,
    `observacoes` VARCHAR(191) NULL,
    `categoriaId` VARCHAR(191) NOT NULL,
    `fornecedorId` VARCHAR(191) NOT NULL,
    `atualizado_em` DATETIME(3) NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `fator_conversao` DECIMAL(10, 4) NOT NULL,
    `quantidade_compra` DECIMAL(10, 3) NOT NULL,
    `unidade_uso` VARCHAR(191) NOT NULL,
    `altura` DECIMAL(10, 2) NULL,
    `gramatura` DECIMAL(10, 1) NULL,
    `largura` DECIMAL(10, 2) NULL,
    `unidade_compra` VARCHAR(191) NOT NULL,
    `tipo_calculo` VARCHAR(191) NULL,
    `unidade_dimensao` VARCHAR(191) NULL,
    `tipoMaterialId` VARCHAR(191) NULL,
    `logica_consumo` ENUM('area', 'perimetro', 'quantidade_fixa', 'custom') NOT NULL DEFAULT 'area',
    `parametros_consumo` LONGTEXT NULL,
    `formato_material` VARCHAR(32) NULL,
    `largura_comercial` DECIMAL(10, 3) NULL,
    `altura_comercial` DECIMAL(10, 3) NULL,
    `comprimento_comercial` DECIMAL(10, 3) NULL,
    `area_comercial` DECIMAL(10, 4) NULL,
    `perda_padrao_percent` DECIMAL(5, 2) NULL,
    `permite_simulacao_chapa` BOOLEAN NOT NULL DEFAULT false,
    `controla_estoque` BOOLEAN NOT NULL DEFAULT false,
    `permite_registrar_sobra` BOOLEAN NOT NULL DEFAULT false,
    `retalho_min_largura` DECIMAL(10, 3) NULL,
    `retalho_min_altura` DECIMAL(10, 3) NULL,
    `retalho_min_area` DECIMAL(10, 4) NULL,
    `metodo_cobranca_padrao` VARCHAR(32) NULL,

    INDEX `insumos_categoriaId_fkey`(`categoriaId`),
    INDEX `insumos_fornecedorId_fkey`(`fornecedorId`),
    INDEX `insumos_tipoMaterialId_fkey`(`tipoMaterialId`),
    UNIQUE INDEX `insumos_loja_id_nome_fornecedorId_key`(`loja_id`, `nome`, `fornecedorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categorias` (
    `id` VARCHAR(191) NOT NULL,
    `loja_id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `categorias_loja_id_nome_key`(`loja_id`, `nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `historico_custo_maquinas` (
    `id` VARCHAR(191) NOT NULL,
    `maquina_id` VARCHAR(191) NOT NULL,
    `custo_hora` DECIMAL(10, 2) NOT NULL,
    `data_inicio` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `data_fim` DATETIME(3) NULL,
    `observacoes` VARCHAR(191) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `historico_custo_maquinas_maquina_id_fkey`(`maquina_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `historico_custo_funcoes` (
    `id` VARCHAR(191) NOT NULL,
    `funcao_id` VARCHAR(191) NOT NULL,
    `custo_hora` DECIMAL(10, 2) NOT NULL,
    `data_inicio` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `data_fim` DATETIME(3) NULL,
    `observacoes` VARCHAR(191) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `historico_custo_funcoes_funcao_id_fkey`(`funcao_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `historico_preco_insumos` (
    `id` VARCHAR(191) NOT NULL,
    `insumo_id` VARCHAR(191) NOT NULL,
    `custo_anterior` DECIMAL(10, 2) NOT NULL,
    `custo_novo` DECIMAL(10, 2) NOT NULL,
    `data_alteracao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `motivo` TEXT NULL,
    `alterado_por` VARCHAR(191) NULL,

    INDEX `historico_preco_insumos_insumo_id_fkey`(`insumo_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orcamento_historico` (
    `id` VARCHAR(191) NOT NULL,
    `orcamento_id` VARCHAR(191) NOT NULL,
    `versao` INTEGER NOT NULL,
    `dados_anteriores` LONGTEXT NOT NULL,
    `dados_novos` LONGTEXT NOT NULL,
    `alteracoes` LONGTEXT NULL,
    `motivo` TEXT NULL,
    `alterado_por` VARCHAR(191) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `orcamento_historico_orcamento_id_idx`(`orcamento_id`),
    INDEX `orcamento_historico_versao_idx`(`versao`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orcamento_logs` (
    `id` VARCHAR(191) NOT NULL,
    `orcamento_id` VARCHAR(191) NOT NULL,
    `tipo_acao` VARCHAR(191) NOT NULL,
    `descricao` TEXT NOT NULL,
    `dados_extras` LONGTEXT NULL,
    `ip_origem` VARCHAR(191) NULL,
    `user_agent` VARCHAR(191) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `orcamento_logs_orcamento_id_idx`(`orcamento_id`),
    INDEX `orcamento_logs_tipo_acao_idx`(`tipo_acao`),
    INDEX `orcamento_logs_criado_em_idx`(`criado_em`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

    INDEX `ordem_servico_logs_os_id_idx`(`os_id`),
    INDEX `ordem_servico_logs_tipo_acao_idx`(`tipo_acao`),
    INDEX `ordem_servico_logs_criado_em_idx`(`criado_em`),
    INDEX `ordem_servico_logs_usuario_id_idx`(`usuario_id`),
    PRIMARY KEY (`id`)
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

    INDEX `regras_validacao_loja_id_idx`(`loja_id`),
    INDEX `regras_validacao_categoria_idx`(`categoria`),
    INDEX `regras_validacao_ativo_idx`(`ativo`),
    PRIMARY KEY (`id`)
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

    INDEX `execucoes_regras_regra_id_idx`(`regra_id`),
    INDEX `execucoes_regras_os_id_idx`(`os_id`),
    INDEX `execucoes_regras_orcamento_id_idx`(`orcamento_id`),
    INDEX `execucoes_regras_resultado_idx`(`resultado`),
    INDEX `execucoes_regras_criado_em_idx`(`criado_em`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `template_produtos` (
    `id` VARCHAR(191) NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `categoria` VARCHAR(191) NOT NULL,
    `descricao` TEXT NULL,
    `nome_servico` VARCHAR(191) NOT NULL,
    `descricao_produto` TEXT NULL,
    `horas_producao` DECIMAL(10, 2) NOT NULL,
    `largura_produto` DECIMAL(10, 2) NULL,
    `altura_produto` DECIMAL(10, 2) NULL,
    `profundidade_produto` DECIMAL(10, 2) NULL,
    `area_produto` DECIMAL(10, 2) NULL,
    `perimetro_produto` DECIMAL(10, 2) NULL,
    `unidade_geometria` VARCHAR(4) NULL,
    `geometria_origem` VARCHAR(16) NULL,
    `arquivo_geometria_url` VARCHAR(512) NULL,
    `unidade_medida_produto` VARCHAR(191) NULL,
    `quantidade_padrao` DECIMAL(10, 2) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `loja_id` VARCHAR(191) NOT NULL,
    `valor_calculado` DECIMAL(10, 2) NULL,
    `itens_orcamento_json` TEXT NULL,

    INDEX `template_produtos_loja_id_idx`(`loja_id`),
    INDEX `template_produtos_loja_id_categoria_idx`(`loja_id`, `categoria`),
    UNIQUE INDEX `template_produtos_loja_id_nome_key`(`loja_id`, `nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `item_template_produtos` (
    `id` VARCHAR(191) NOT NULL,
    `template_id` VARCHAR(191) NOT NULL,
    `insumo_id` VARCHAR(191) NOT NULL,
    `quantidade` DECIMAL(10, 3) NOT NULL,
    `custo_unitario` DECIMAL(10, 2) NOT NULL,
    `custo_total` DECIMAL(10, 2) NOT NULL,
    `usa_medida_propria` BOOLEAN NOT NULL DEFAULT false,
    `largura_material` DECIMAL(10, 2) NULL,
    `altura_material` DECIMAL(10, 2) NULL,
    `profundidade_material` DECIMAL(10, 2) NULL,
    `unidade_medida_material` VARCHAR(4) NULL,

    INDEX `item_template_produtos_template_id_idx`(`template_id`),
    INDEX `item_template_produtos_insumo_id_idx`(`insumo_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `maquina_template_produtos` (
    `id` VARCHAR(191) NOT NULL,
    `template_id` VARCHAR(191) NOT NULL,
    `maquina_id` VARCHAR(191) NOT NULL,
    `horas_utilizadas` DECIMAL(10, 2) NOT NULL,
    `custo_total` DECIMAL(10, 2) NOT NULL,

    INDEX `maquina_template_produtos_template_id_idx`(`template_id`),
    INDEX `maquina_template_produtos_maquina_id_idx`(`maquina_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `funcao_template_produtos` (
    `id` VARCHAR(191) NOT NULL,
    `template_id` VARCHAR(191) NOT NULL,
    `funcao_id` VARCHAR(191) NOT NULL,
    `horas_trabalhadas` DECIMAL(10, 2) NOT NULL,
    `custo_total` DECIMAL(10, 2) NOT NULL,

    INDEX `funcao_template_produtos_template_id_idx`(`template_id`),
    INDEX `funcao_template_produtos_funcao_id_idx`(`funcao_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `servico_template_produtos` (
    `id` VARCHAR(191) NOT NULL,
    `template_id` VARCHAR(191) NOT NULL,
    `servico_id` VARCHAR(191) NOT NULL,
    `horas_trabalhadas` DECIMAL(10, 2) NOT NULL,
    `custo_total` DECIMAL(10, 2) NOT NULL,

    INDEX `servico_template_produtos_template_id_idx`(`template_id`),
    INDEX `servico_template_produtos_servico_id_idx`(`servico_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `anexomensagem` (
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

-- CreateTable
CREATE TABLE `cliente` (
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
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `origem` VARCHAR(191) NULL,
    `segmento` VARCHAR(191) NULL,
    `loja_id` VARCHAR(191) NOT NULL,

    INDEX `Cliente_loja_id_documento_idx`(`loja_id`, `documento`),
    INDEX `Cliente_loja_id_idx`(`loja_id`),
    INDEX `Cliente_loja_id_nome_idx`(`loja_id`, `nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `custoindireto` (
    `id` VARCHAR(191) NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `valor_mensal` DECIMAL(10, 2) NOT NULL,
    `categoria` VARCHAR(191) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `regra_rateio` VARCHAR(191) NOT NULL DEFAULT 'PROPORCIONAL_TEMPO',
    `observacoes` TEXT NULL,
    `loja_id` VARCHAR(191) NOT NULL,
    `setor_id` VARCHAR(191) NULL,

    INDEX `CustoIndireto_loja_id_categoria_idx`(`loja_id`, `categoria`),
    INDEX `CustoIndireto_loja_id_idx`(`loja_id`),
    INDEX `CustoIndireto_setor_id_idx`(`setor_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fornecedor` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `loja_id` VARCHAR(191) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,

    INDEX `Fornecedor_loja_id_idx`(`loja_id`),
    UNIQUE INDEX `Fornecedor_loja_id_nome_key`(`loja_id`, `nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `funcao` (
    `id` VARCHAR(191) NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `custo_hora` DECIMAL(10, 2) NOT NULL,
    `descricao` TEXT NULL,
    `maquina_id` VARCHAR(191) NULL,
    `loja_id` VARCHAR(191) NOT NULL,
    `setor_id` VARCHAR(191) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `tipo_calculo` ENUM('ACOMPANHA_MAQUINA', 'POR_M2', 'POR_UNIDADE', 'POR_PECA_COM_CATEGORIA', 'MANUAL') NOT NULL DEFAULT 'MANUAL',
    `fator_acompanhamento` DECIMAL(10, 3) NULL,
    `horas_por_m2` DECIMAL(10, 3) NULL,
    `horas_por_unidade` DECIMAL(10, 3) NULL,
    `eficiencia_percent` DECIMAL(5, 2) NULL,
    `setup_min` DECIMAL(10, 2) NULL,

    INDEX `Funcao_loja_id_idx`(`loja_id`),
    INDEX `Funcao_maquina_id_idx`(`maquina_id`),
    INDEX `Funcao_setor_id_idx`(`setor_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `funcaoorcamento` (
    `id` VARCHAR(191) NOT NULL,
    `orcamento_id` VARCHAR(191) NOT NULL,
    `funcao_id` VARCHAR(191) NOT NULL,
    `horas_trabalhadas` DECIMAL(10, 2) NOT NULL,
    `custo_total` DECIMAL(10, 2) NOT NULL,

    INDEX `FuncaoOrcamento_funcao_id_idx`(`funcao_id`),
    INDEX `FuncaoOrcamento_orcamento_id_idx`(`orcamento_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `itemorcamento` (
    `id` VARCHAR(191) NOT NULL,
    `orcamento_id` VARCHAR(191) NOT NULL,
    `insumo_id` VARCHAR(191) NOT NULL,
    `quantidade` DECIMAL(10, 3) NOT NULL,
    `custo_unitario` DECIMAL(10, 2) NOT NULL,
    `custo_total` DECIMAL(10, 2) NOT NULL,

    INDEX `ItemOrcamento_insumo_id_idx`(`insumo_id`),
    INDEX `ItemOrcamento_orcamento_id_idx`(`orcamento_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `loja` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDENTE_VERIFICACAO', 'ATIVO', 'INATIVO', 'BLOQUEADO') NOT NULL DEFAULT 'PENDENTE_VERIFICACAO',
    `assinatura_ativa` BOOLEAN NOT NULL DEFAULT false,
    `atualizado_em` DATETIME(3) NOT NULL,
    `cabecalho_orcamento` TEXT NULL,
    `cnpj` VARCHAR(191) NULL,
    `cpf` VARCHAR(191) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `custo_maodeobra_hora` DECIMAL(10, 2) NULL,
    `custo_maquinaria_hora` DECIMAL(10, 2) NULL,
    `custos_indiretos_mensais` DECIMAL(10, 2) NULL,
    `data_inicio_trial` DATETIME(3) NULL,
    `impostos_padrao` DECIMAL(5, 2) NULL,
    `comissao_padrao` DECIMAL(5, 2) NULL,
    `logo_url` VARCHAR(191) NULL,
    `margem_lucro_padrao` DECIMAL(5, 2) NULL,
    `tipo_margem_lucro` VARCHAR(24) NULL,
    `nome` VARCHAR(191) NOT NULL,
    `stripe_customer_id` VARCHAR(191) NULL,
    `telefone` VARCHAR(191) NOT NULL,
    `trial_restante_dias` INTEGER NULL,
    `horas_produtivas_mensais` INTEGER NULL DEFAULT 352,
    `pcp_nivel` VARCHAR(24) NULL,
    `condicao_pagamento_padrao_tipo` VARCHAR(32) NULL,
    `condicao_pagamento_padrao_entrada_pct` DECIMAL(5, 2) NULL,
    `condicao_pagamento_padrao_descricao` VARCHAR(255) NULL,

    UNIQUE INDEX `Loja_email_key`(`email`),
    UNIQUE INDEX `Loja_cnpj_key`(`cnpj`),
    UNIQUE INDEX `Loja_cpf_key`(`cpf`),
    UNIQUE INDEX `Loja_stripe_customer_id_key`(`stripe_customer_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `maquina` (
    `id` VARCHAR(191) NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `custo_hora` DECIMAL(10, 2) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ATIVA',
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `capacidade` VARCHAR(191) NULL,
    `observacoes` TEXT NULL,
    `loja_id` VARCHAR(191) NOT NULL,
    `setor_id` VARCHAR(191) NULL,
    `modo_producao` ENUM('M2_H', 'ML_H', 'MANUAL') NOT NULL DEFAULT 'M2_H',
    `setup_min` DECIMAL(10, 2) NULL,
    `velocidade_m2_h` DECIMAL(10, 2) NULL,
    `velocidade_ml_h` DECIMAL(10, 2) NULL,
    `eficiencia_percent` DECIMAL(5, 2) NULL,
    `usar_no_pcp` BOOLEAN NOT NULL DEFAULT true,
    `horas_disponiveis_dia` DECIMAL(5, 2) NULL,
    `dias_produtivos` LONGTEXT NULL,
    `permite_agendamento_simultaneo` BOOLEAN NOT NULL DEFAULT false,
    `tempo_minimo_entre_servicos_min` INTEGER NULL,
    `considerar_eficiencia_na_capacidade` BOOLEAN NOT NULL DEFAULT true,

    INDEX `Maquina_loja_id_idx`(`loja_id`),
    INDEX `Maquina_loja_id_tipo_idx`(`loja_id`, `tipo`),
    INDEX `Maquina_setor_id_idx`(`setor_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `maquinaorcamento` (
    `id` VARCHAR(191) NOT NULL,
    `orcamento_id` VARCHAR(191) NOT NULL,
    `maquina_id` VARCHAR(191) NOT NULL,
    `horas_utilizadas` DECIMAL(10, 2) NOT NULL,
    `custo_total` DECIMAL(10, 2) NOT NULL,

    INDEX `MaquinaOrcamento_maquina_id_idx`(`maquina_id`),
    INDEX `MaquinaOrcamento_orcamento_id_idx`(`orcamento_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mensagemnegociacao` (
    `id` VARCHAR(191) NOT NULL,
    `orcamento_id` VARCHAR(191) NOT NULL,
    `mensagem` TEXT NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `autor_nome` VARCHAR(191) NULL,
    `autor_email` VARCHAR(191) NULL,
    `visualizada` BOOLEAN NOT NULL DEFAULT false,
    `anexos` LONGTEXT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `MensagemNegociacao_orcamento_id_idx`(`orcamento_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notificacao` (
    `id` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `mensagem` TEXT NOT NULL,
    `orcamento_id` VARCHAR(191) NULL,
    `loja_id` VARCHAR(191) NOT NULL,
    `visualizada` BOOLEAN NOT NULL DEFAULT false,
    `dados_extras` TEXT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Notificacao_loja_id_idx`(`loja_id`),
    INDEX `Notificacao_orcamento_id_idx`(`orcamento_id`),
    INDEX `Notificacao_visualizada_idx`(`visualizada`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `modo_impressao` (
    `id` VARCHAR(191) NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `maquina_id` VARCHAR(191) NOT NULL,
    `loja_id` VARCHAR(191) NOT NULL,
    `velocidade_m2_h` DECIMAL(10, 2) NULL,
    `largura_mm` DECIMAL(10, 2) NULL,
    `resolucao_dpi` INTEGER NULL,
    `cores` VARCHAR(191) NULL,
    `observacoes` TEXT NULL,

    INDEX `ModoImpressao_maquina_id_idx`(`maquina_id`),
    INDEX `ModoImpressao_loja_id_idx`(`loja_id`),
    UNIQUE INDEX `modo_impressao_loja_id_nome_key`(`loja_id`, `nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `modalidade_entrega` (
    `id` VARCHAR(191) NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `descricao` TEXT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `exige_endereco` BOOLEAN NOT NULL DEFAULT false,
    `exige_valor` BOOLEAN NOT NULL DEFAULT false,
    `valor_padrao` DECIMAL(12, 2) NULL,
    `custo_padrao` DECIMAL(12, 2) NULL,
    `prazo_padrao_dias` INTEGER NULL,
    `permite_retirada` BOOLEAN NOT NULL DEFAULT false,
    `observacoes_padrao` TEXT NULL,
    `loja_id` VARCHAR(191) NOT NULL,

    INDEX `modalidade_entrega_loja_id_idx`(`loja_id`),
    INDEX `modalidade_entrega_loja_id_ativo_idx`(`loja_id`, `ativo`),
    UNIQUE INDEX `modalidade_entrega_loja_id_nome_key`(`loja_id`, `nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tipo_instalacao` (
    `id` VARCHAR(191) NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `descricao` TEXT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `regra_cobranca` VARCHAR(24) NOT NULL DEFAULT 'FIXO',
    `preco_padrao` DECIMAL(12, 2) NULL,
    `custo_mao_obra_padrao` DECIMAL(12, 2) NULL,
    `custo_deslocamento_padrao` DECIMAL(12, 2) NULL,
    `tempo_estimado_min` INTEGER NULL,
    `quantidade_pessoas_padrao` INTEGER NULL,
    `exige_endereco` BOOLEAN NOT NULL DEFAULT true,
    `exige_agendamento` BOOLEAN NOT NULL DEFAULT false,
    `observacoes_padrao` TEXT NULL,
    `loja_id` VARCHAR(191) NOT NULL,

    INDEX `tipo_instalacao_loja_id_idx`(`loja_id`),
    INDEX `tipo_instalacao_loja_id_ativo_idx`(`loja_id`, `ativo`),
    UNIQUE INDEX `tipo_instalacao_loja_id_nome_key`(`loja_id`, `nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orcamento` (
    `id` VARCHAR(191) NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,
    `numero` VARCHAR(191) NOT NULL,
    `nome_servico` VARCHAR(191) NOT NULL,
    `descricao` TEXT NULL,
    `horas_producao` DECIMAL(10, 2) NOT NULL,
    `custo_material` DECIMAL(10, 2) NOT NULL,
    `custo_mao_obra` DECIMAL(10, 2) NOT NULL,
    `custo_indireto` DECIMAL(10, 2) NOT NULL,
    `custo_total` DECIMAL(10, 2) NOT NULL,
    `margem_lucro` DECIMAL(10, 2) NOT NULL,
    `impostos` DECIMAL(10, 2) NOT NULL,
    `preco_final` DECIMAL(10, 2) NOT NULL,
    `loja_id` VARCHAR(191) NOT NULL,
    `cliente_id` VARCHAR(191) NULL,
    `altura_produto` DECIMAL(10, 2) NULL,
    `area_produto` DECIMAL(10, 2) NULL,
    `largura_produto` DECIMAL(10, 2) NULL,
    `quantidade_produto` DECIMAL(10, 2) NULL,
    `unidade_medida_produto` VARCHAR(191) NULL,
    `observacoes_cliente` TEXT NULL,
    `status_aprovacao` VARCHAR(191) NULL DEFAULT 'PENDENTE',
    `codigo_aprovacao` VARCHAR(191) NULL,
    `status` VARCHAR(191) NULL DEFAULT 'rascunho',
    `atendente` VARCHAR(191) NULL DEFAULT 'Equipe Comercial',
    `forma_pagamento` VARCHAR(191) NULL DEFAULT '50% entrada, restante na entrega',
    `prazo_entrega` VARCHAR(191) NULL DEFAULT '10 a 15 dias úteis',
    `validade_proposta` VARCHAR(191) NULL DEFAULT '30 dias',
    `condicao_pagamento_tipo` VARCHAR(32) NULL,
    `condicao_pagamento_entrada_pct` DECIMAL(5, 2) NULL,
    `condicao_pagamento_parcelas` INTEGER NULL,
    `condicao_pagamento_descricao` VARCHAR(255) NULL,
    `comissao_percentual` DECIMAL(5, 2) NULL,
    `tipo_margem_lucro` VARCHAR(24) NULL,
    `entrega_modalidade_id` VARCHAR(191) NULL,
    `entrega_usar_endereco_cliente` BOOLEAN NOT NULL DEFAULT true,
    `entrega_endereco_snapshot` LONGTEXT NULL,
    `entrega_cep` VARCHAR(16) NULL,
    `entrega_logradouro` VARCHAR(255) NULL,
    `entrega_numero` VARCHAR(32) NULL,
    `entrega_complemento` VARCHAR(255) NULL,
    `entrega_bairro` VARCHAR(120) NULL,
    `entrega_cidade` VARCHAR(120) NULL,
    `entrega_estado` VARCHAR(2) NULL,
    `entrega_prazo_dias` INTEGER NULL,
    `entrega_valor_cobrado` DECIMAL(12, 2) NULL,
    `entrega_custo_estimado` DECIMAL(12, 2) NULL,
    `entrega_observacoes` TEXT NULL,
    `titulo` VARCHAR(191) NULL,
    `responsavel_id` VARCHAR(191) NULL,
    `prioridade` VARCHAR(191) NULL DEFAULT 'NORMAL',
    `tipo_orcamento` VARCHAR(191) NULL DEFAULT 'PRODUTO',
    `condicoes_comerciais` TEXT NULL,
    `observacoes_internas` TEXT NULL,
    `tags` TEXT NULL,
    `data_limite` DATETIME(3) NULL,
    `data_aprovacao` DATETIME(3) NULL,
    `aprovado_por` VARCHAR(191) NULL,
    `motivo_rejeicao` TEXT NULL,
    `custos_calculados` LONGTEXT NULL,
    `configuracao_calculo` LONGTEXT NULL,
    `versao_atual` INTEGER NOT NULL DEFAULT 1,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `valor_total` DECIMAL(10, 2) NULL,
    `data_criacao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `data_atualizacao` DATETIME(3) NOT NULL,
    `ordem` INTEGER NOT NULL DEFAULT 0,
    `categoria` VARCHAR(191) NULL,
    `detalhamento_calculo` LONGTEXT NULL,
    `alertas` LONGTEXT NULL,
    `data_ultimo_calculo` DATETIME(3) NULL,
    `custos` LONGTEXT NULL,
    `excluido_em` DATETIME(3) NULL,
    `excluido_por` VARCHAR(191) NULL,
    `motivo_exclusao` TEXT NULL,

    UNIQUE INDEX `Orcamento_codigo_aprovacao_key`(`codigo_aprovacao`),
    INDEX `Orcamento_cliente_id_fkey`(`cliente_id`),
    INDEX `Orcamento_loja_id_idx`(`loja_id`),
    INDEX `Orcamento_loja_id_numero_idx`(`loja_id`, `numero`),
    INDEX `orcamento_responsavel_id_idx`(`responsavel_id`),
    INDEX `orcamento_entrega_modalidade_id_idx`(`entrega_modalidade_id`),
    INDEX `orcamento_status_idx`(`status`),
    INDEX `orcamento_tipo_orcamento_idx`(`tipo_orcamento`),
    INDEX `orcamento_ativo_idx`(`ativo`),
    UNIQUE INDEX `Orcamento_loja_id_numero_key`(`loja_id`, `numero`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProdutoOrcamento` (
    `id` VARCHAR(191) NOT NULL,
    `orcamento_id` VARCHAR(191) NOT NULL,
    `nome_servico` VARCHAR(191) NOT NULL,
    `descricao` TEXT NULL,
    `quantidade` DECIMAL(10, 3) NOT NULL,
    `largura` DECIMAL(10, 2) NULL,
    `altura` DECIMAL(10, 2) NULL,
    `profundidade` DECIMAL(10, 2) NULL,
    `area_produto` DECIMAL(10, 2) NULL,
    `unidade_medida` VARCHAR(191) NULL,
    `custo_total_producao` DECIMAL(10, 2) NOT NULL,
    `preco_unitario` DECIMAL(10, 2) NOT NULL,
    `preco_total` DECIMAL(10, 2) NOT NULL,
    `margem_lucro` DECIMAL(10, 2) NOT NULL,
    `impostos` DECIMAL(10, 2) NOT NULL,
    `observacoes` TEXT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,
    `data_criacao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `data_atualizacao` DATETIME(3) NOT NULL,
    `ordem` INTEGER NOT NULL DEFAULT 0,
    `categoria` VARCHAR(191) NULL,
    `nome` VARCHAR(191) NULL,
    `instalacao_necessaria` BOOLEAN NOT NULL DEFAULT false,
    `instalacao_tipo_id` VARCHAR(191) NULL,
    `instalacao_regra_cobranca` VARCHAR(24) NULL,
    `instalacao_valor_unitario` DECIMAL(12, 2) NULL,
    `instalacao_usar_endereco_entrega` BOOLEAN NOT NULL DEFAULT true,
    `instalacao_endereco_snapshot` LONGTEXT NULL,
    `instalacao_cep` VARCHAR(16) NULL,
    `instalacao_logradouro` VARCHAR(255) NULL,
    `instalacao_numero` VARCHAR(32) NULL,
    `instalacao_complemento` VARCHAR(255) NULL,
    `instalacao_bairro` VARCHAR(120) NULL,
    `instalacao_cidade` VARCHAR(120) NULL,
    `instalacao_estado` VARCHAR(2) NULL,
    `instalacao_preco_cobrado` DECIMAL(12, 2) NULL,
    `instalacao_custo_mao_obra` DECIMAL(12, 2) NULL,
    `instalacao_custo_deslocamento` DECIMAL(12, 2) NULL,
    `instalacao_tempo_estimado_min` INTEGER NULL,
    `instalacao_quantidade_pessoas` INTEGER NULL,
    `instalacao_observacoes` TEXT NULL,
    `perimetro_produto` DECIMAL(10, 2) NULL,
    `unidade_geometria` VARCHAR(4) NULL,
    `geometria_origem` VARCHAR(16) NULL,
    `arquivo_geometria_url` VARCHAR(512) NULL,
    `arquivo_geometria_metadados` LONGTEXT NULL,
    `responsabilidade_arte` VARCHAR(32) NOT NULL DEFAULT 'NAO_APLICAVEL',
    `politica_cobranca_arte` VARCHAR(32) NOT NULL DEFAULT 'NAO_APLICAVEL',
    `finalidade_anexo` VARCHAR(32) NULL,
    `complexidade_arte` VARCHAR(16) NULL,
    `arte_custo_automatico` BOOLEAN NOT NULL DEFAULT false,
    `arte_referencia_servico_id` VARCHAR(191) NULL,
    `arte_horas_calculadas` DECIMAL(10, 2) NULL,
    `arte_custo_calculado` DECIMAL(10, 2) NULL,
    `tipo_item` VARCHAR(20) NOT NULL DEFAULT 'SOB_DEMANDA',
    `produto_finito_id` VARCHAR(191) NULL,

    INDEX `ProdutoOrcamento_orcamento_id_idx`(`orcamento_id`),
    INDEX `ProdutoOrcamento_instalacao_tipo_id_idx`(`instalacao_tipo_id`),
    INDEX `ProdutoOrcamento_ativo_idx`(`ativo`),
    INDEX `ProdutoOrcamento_profundidade_idx`(`profundidade`),
    INDEX `ProdutoOrcamento_produto_finito_id_idx`(`produto_finito_id`),
    INDEX `ProdutoOrcamento_tipo_item_idx`(`tipo_item`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ItemInsumo` (
    `id` VARCHAR(191) NOT NULL,
    `produto_id` VARCHAR(191) NOT NULL,
    `insumo_id` VARCHAR(191) NOT NULL,
    `quantidade` DECIMAL(10, 3) NOT NULL,
    `unidade` VARCHAR(191) NOT NULL,
    `preco_unitario` DECIMAL(10, 2) NOT NULL,
    `preco_total` DECIMAL(10, 2) NOT NULL,
    `material_do_cliente` BOOLEAN NOT NULL DEFAULT false,
    `usa_medida_propria` BOOLEAN NOT NULL DEFAULT false,
    `largura_material` DECIMAL(10, 2) NULL,
    `altura_material` DECIMAL(10, 2) NULL,
    `profundidade_material` DECIMAL(10, 2) NULL,
    `unidade_medida_material` VARCHAR(4) NULL,
    `estoque_disponivel` DECIMAL(10, 3) NULL,
    `alerta_estoque` BOOLEAN NOT NULL DEFAULT false,
    `calculo_chapa` LONGTEXT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `data_criacao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ItemInsumo_produto_id_idx`(`produto_id`),
    INDEX `ItemInsumo_insumo_id_idx`(`insumo_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ItemMaquina` (
    `id` VARCHAR(191) NOT NULL,
    `produto_id` VARCHAR(191) NOT NULL,
    `maquina_id` VARCHAR(191) NOT NULL,
    `tempo_horas` DECIMAL(10, 2) NOT NULL,
    `custo_hora` DECIMAL(10, 2) NOT NULL,
    `custo_total` DECIMAL(10, 2) NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `data_criacao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ItemMaquina_produto_id_idx`(`produto_id`),
    INDEX `ItemMaquina_maquina_id_idx`(`maquina_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ItemFuncao` (
    `id` VARCHAR(191) NOT NULL,
    `produto_id` VARCHAR(191) NOT NULL,
    `funcao_id` VARCHAR(191) NOT NULL,
    `tempo_horas` DECIMAL(10, 2) NOT NULL,
    `custo_hora` DECIMAL(10, 2) NOT NULL,
    `custo_total` DECIMAL(10, 2) NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `data_criacao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ItemFuncao_produto_id_idx`(`produto_id`),
    INDEX `ItemFuncao_funcao_id_idx`(`funcao_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ItemServicoManual` (
    `id` VARCHAR(191) NOT NULL,
    `produto_id` VARCHAR(191) NOT NULL,
    `servico_id` VARCHAR(191) NOT NULL,
    `tempo_horas` DECIMAL(10, 2) NOT NULL,
    `custo_hora` DECIMAL(10, 2) NOT NULL,
    `custo_total` DECIMAL(10, 2) NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `data_criacao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `descricao` TEXT NULL,
    `origem` VARCHAR(32) NOT NULL DEFAULT 'MANUAL',
    `exibir_no_pdf` BOOLEAN NOT NULL DEFAULT true,

    INDEX `ItemServicoManual_produto_id_idx`(`produto_id`),
    INDEX `ItemServicoManual_servico_id_idx`(`servico_id`),
    INDEX `ItemServicoManual_produto_id_origem_idx`(`produto_id`, `origem`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ItemCustoIndireto` (
    `id` VARCHAR(191) NOT NULL,
    `produto_id` VARCHAR(191) NOT NULL,
    `custo_id` VARCHAR(191) NOT NULL,
    `percentual` DECIMAL(5, 2) NOT NULL,
    `valor_fixo` DECIMAL(10, 2) NULL,
    `custo_total` DECIMAL(10, 2) NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `data_criacao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `descricao` TEXT NULL,

    INDEX `ItemCustoIndireto_produto_id_idx`(`produto_id`),
    INDEX `ItemCustoIndireto_custo_id_idx`(`custo_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HistoricoOrcamento` (
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

    INDEX `HistoricoOrcamento_orcamento_id_idx`(`orcamento_id`),
    INDEX `HistoricoOrcamento_data_idx`(`data`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VersaoOrcamento` (
    `id` VARCHAR(191) NOT NULL,
    `orcamento_id` VARCHAR(191) NOT NULL,
    `versao` INTEGER NOT NULL,
    `dados_completos` LONGTEXT NOT NULL,
    `motivo_alteracao` TEXT NULL,
    `usuario_id` VARCHAR(191) NULL,
    `numero` INTEGER NULL,
    `responsavel_id` VARCHAR(191) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `VersaoOrcamento_orcamento_id_idx`(`orcamento_id`),
    UNIQUE INDEX `VersaoOrcamento_orcamento_id_versao_key`(`orcamento_id`, `versao`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MensagemChat` (
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

    INDEX `MensagemChat_orcamento_id_idx`(`orcamento_id`),
    INDEX `MensagemChat_criado_em_idx`(`criado_em`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LinkPublico` (
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

    UNIQUE INDEX `LinkPublico_token_key`(`token`),
    INDEX `LinkPublico_orcamento_id_idx`(`orcamento_id`),
    INDEX `LinkPublico_token_idx`(`token`),
    INDEX `LinkPublico_ativo_idx`(`ativo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AcessoLink` (
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

    INDEX `AcessoLink_link_id_idx`(`link_id`),
    INDEX `AcessoLink_primeiro_acesso_idx`(`primeiro_acesso`),
    PRIMARY KEY (`id`)
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

    INDEX `estoque_insumo_id_idx`(`insumo_id`),
    INDEX `estoque_criado_em_idx`(`criado_em`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `aprovacaoOrcamento` (
    `id` VARCHAR(191) NOT NULL,
    `orcamento_id` VARCHAR(191) NOT NULL,
    `aprovador_id` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL,
    `observacoes` TEXT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,
    `usuario` VARCHAR(191) NULL,

    INDEX `aprovacaoOrcamento_orcamento_id_idx`(`orcamento_id`),
    INDEX `aprovacaoOrcamento_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categoriaInsumo` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `descricao` TEXT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    INDEX `categoriaInsumo_nome_idx`(`nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tipomaterial` (
    `id` VARCHAR(191) NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `descricao` VARCHAR(191) NULL,
    `logica_consumo` ENUM('area', 'perimetro', 'quantidade_fixa', 'custom') NOT NULL DEFAULT 'area',
    `parametros_padrao` LONGTEXT NULL,
    `loja_id` VARCHAR(191) NOT NULL,

    INDEX `TipoMaterial_loja_id_idx`(`loja_id`),
    UNIQUE INDEX `TipoMaterial_loja_id_nome_key`(`loja_id`, `nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `servico_manual` (
    `id` VARCHAR(191) NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `descricao` TEXT NULL,
    `custo_hora` DECIMAL(10, 2) NOT NULL,
    `loja_id` VARCHAR(191) NOT NULL,
    `setor_id` VARCHAR(191) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `tipo_calculo` ENUM('ACOMPANHA_MAQUINA', 'POR_M2', 'POR_UNIDADE', 'POR_PECA_COM_CATEGORIA', 'MANUAL') NOT NULL DEFAULT 'MANUAL',
    `horas_por_m2` DECIMAL(10, 3) NULL,
    `horas_por_unidade` DECIMAL(10, 3) NULL,
    `eficiencia_percent` DECIMAL(5, 2) NULL,
    `setup_min` DECIMAL(10, 2) NULL,
    `categorias` LONGTEXT NULL,
    `sistema` BOOLEAN NOT NULL DEFAULT false,

    INDEX `ServicoManual_loja_id_idx`(`loja_id`),
    INDEX `ServicoManual_loja_id_sistema_idx`(`loja_id`, `sistema`),
    INDEX `ServicoManual_setor_id_idx`(`setor_id`),
    UNIQUE INDEX `servico_manual_loja_id_nome_key`(`loja_id`, `nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usuario` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDENTE_VERIFICACAO', 'ATIVO', 'INATIVO', 'BLOQUEADO') NOT NULL DEFAULT 'PENDENTE_VERIFICACAO',
    `atualizado_em` DATETIME(3) NOT NULL,
    `codigo_verificacao_email` VARCHAR(191) NULL,
    `codigo_verificacao_email_expiracao` DATETIME(3) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `email_verificado` BOOLEAN NOT NULL DEFAULT false,
    `funcao` ENUM('ADMINISTRADOR', 'FINANCEIRO', 'PRODUCAO', 'VENDAS', 'ESTOQUE') NOT NULL DEFAULT 'VENDAS',
    `loja_id` VARCHAR(191) NOT NULL,
    `nome_completo` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NULL,
    `senha` VARCHAR(191) NULL,
    `telefone` VARCHAR(191) NULL,
    `two_factor_enabled` BOOLEAN NOT NULL DEFAULT false,
    `two_factor_secret` TEXT NULL,
    `two_factor_confirmed_at` DATETIME(3) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `Usuario_email_key`(`email`),
    INDEX `Usuario_loja_id_idx`(`loja_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `password_reset_token` (
    `id` VARCHAR(191) NOT NULL,
    `usuario_id` VARCHAR(191) NOT NULL,
    `token_hash` VARCHAR(64) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `used_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `PasswordResetToken_token_hash_key`(`token_hash`),
    INDEX `PasswordResetToken_usuario_id_idx`(`usuario_id`),
    INDEX `PasswordResetToken_expires_at_idx`(`expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `convites_cadastro` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(255) NULL,
    `nome_loja` VARCHAR(255) NULL,
    `telefone` VARCHAR(32) NULL,
    `origem` VARCHAR(32) NULL,
    `token_hash` VARCHAR(191) NOT NULL,
    `status` VARCHAR(24) NOT NULL DEFAULT 'PENDENTE',
    `mensagem` TEXT NULL,
    `criado_por_email` VARCHAR(255) NULL,
    `expira_em` DATETIME(3) NOT NULL,
    `usado_em` DATETIME(3) NULL,
    `revogado_em` DATETIME(3) NULL,
    `usado_por_loja_id` VARCHAR(191) NULL,
    `usado_por_usuario_id` VARCHAR(191) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    UNIQUE INDEX `convites_cadastro_token_hash_key`(`token_hash`),
    INDEX `convites_cadastro_email_idx`(`email`),
    INDEX `convites_cadastro_status_idx`(`status`),
    INDEX `convites_cadastro_expira_em_idx`(`expira_em`),
    INDEX `convites_cadastro_origem_idx`(`origem`),
    PRIMARY KEY (`id`)
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

    UNIQUE INDEX `inventory_locations_codigo_key`(`codigo`),
    INDEX `inventory_locations_codigo_lojaId_idx`(`codigo`, `lojaId`),
    INDEX `inventory_locations_lojaId_idx`(`lojaId`),
    PRIMARY KEY (`id`)
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

    INDEX `inventory_stock_insumoId_lojaId_idx`(`insumoId`, `lojaId`),
    INDEX `inventory_stock_localizacaoId_idx`(`localizacaoId`),
    INDEX `inventory_stock_lojaId_idx`(`lojaId`),
    UNIQUE INDEX `inventory_stock_insumoId_localizacaoId_lojaId_key`(`insumoId`, `localizacaoId`, `lojaId`),
    PRIMARY KEY (`id`)
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

    INDEX `inventory_movements_dataMovimentacao_idx`(`dataMovimentacao`),
    INDEX `inventory_movements_estoqueId_idx`(`estoqueId`),
    INDEX `inventory_movements_lojaId_idx`(`lojaId`),
    INDEX `inventory_movements_tipo_lojaId_idx`(`tipo`, `lojaId`),
    PRIMARY KEY (`id`)
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

    INDEX `inventory_lots_dataValidade_idx`(`dataValidade`),
    INDEX `inventory_lots_estoqueId_idx`(`estoqueId`),
    INDEX `inventory_lots_lojaId_idx`(`lojaId`),
    INDEX `inventory_lots_status_lojaId_idx`(`status`, `lojaId`),
    PRIMARY KEY (`id`)
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

    INDEX `perfil_acesso_loja_id_idx`(`loja_id`),
    UNIQUE INDEX `perfil_acesso_loja_id_nome_key`(`loja_id`, `nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `perfil_permissao` (
    `id` VARCHAR(191) NOT NULL,
    `perfil_id` VARCHAR(191) NOT NULL,
    `modulo` VARCHAR(191) NOT NULL,
    `acao` VARCHAR(191) NOT NULL,
    `permitido` BOOLEAN NOT NULL DEFAULT true,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `perfil_permissao_perfil_id_idx`(`perfil_id`),
    UNIQUE INDEX `perfil_permissao_perfil_id_modulo_acao_key`(`perfil_id`, `modulo`, `acao`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usuario_perfil` (
    `usuario_id` VARCHAR(191) NOT NULL,
    `perfil_id` VARCHAR(191) NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `usuario_perfil_usuario_id_idx`(`usuario_id`),
    INDEX `usuario_perfil_perfil_id_idx`(`perfil_id`),
    PRIMARY KEY (`usuario_id`, `perfil_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `estoque_aproveitamentos` (
    `id` VARCHAR(191) NOT NULL,
    `sobra_id` VARCHAR(191) NOT NULL,
    `quantidade_aproveitada` DECIMAL(10, 2) NOT NULL,
    `projeto_destino` VARCHAR(255) NULL,
    `orcamento_destino` VARCHAR(191) NULL,
    `os_destino_id` VARCHAR(191) NULL,
    `item_os_destino_id` VARCHAR(191) NULL,
    `insumo_id` VARCHAR(191) NULL,
    `area_aproveitada` DECIMAL(10, 4) NULL,
    `observacoes` TEXT NULL,
    `economia_gerada` DECIMAL(12, 2) NULL DEFAULT 0.00,
    `loja_id` VARCHAR(191) NOT NULL,
    `usuario_id` VARCHAR(191) NULL,
    `data_aproveitamento` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_data_aproveitamento`(`data_aproveitamento`),
    INDEX `idx_loja_id`(`loja_id`),
    INDEX `idx_sobra_id`(`sobra_id`),
    INDEX `idx_usuario_id`(`usuario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `estoque_sobras` (
    `id` VARCHAR(191) NOT NULL,
    `estoque_id` VARCHAR(191) NULL,
    `insumo_id` VARCHAR(191) NULL,
    `codigo_sobra` VARCHAR(191) NOT NULL,
    `descricao` TEXT NULL,
    `dimensoes` VARCHAR(255) NULL,
    `largura` DECIMAL(10, 3) NULL,
    `altura` DECIMAL(10, 3) NULL,
    `espessura` DECIMAL(10, 3) NULL,
    `unidade_dimensao` VARCHAR(16) NULL,
    `area` DECIMAL(10, 2) NULL,
    `area_disponivel` DECIMAL(10, 4) NULL,
    `area_original` DECIMAL(10, 4) NULL,
    `quantidade` DECIMAL(10, 2) NOT NULL,
    `unidade_medida` VARCHAR(50) NULL,
    `material` VARCHAR(255) NULL,
    `cor` VARCHAR(100) NULL,
    `acabamento` VARCHAR(100) NULL,
    `status` ENUM('DISPONIVEL', 'PARCIALMENTE_APROVEITADA', 'APROVEITADA', 'DESCARTADA') NULL DEFAULT 'DISPONIVEL',
    `origem` VARCHAR(255) NULL,
    `data_geracao` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `orcamento_origem` VARCHAR(191) NULL,
    `os_origem_id` VARCHAR(191) NULL,
    `item_os_origem_id` VARCHAR(191) NULL,
    `observacao_interna` TEXT NULL,
    `data_aproveitamento` DATETIME(3) NULL,
    `quantidade_aproveitada` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `economia_gerada` DECIMAL(12, 2) NULL DEFAULT 0.00,
    `loja_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `codigo_sobra`(`codigo_sobra`),
    INDEX `idx_codigo_sobra`(`codigo_sobra`),
    INDEX `idx_data_geracao`(`data_geracao`),
    INDEX `idx_estoque_id`(`estoque_id`),
    INDEX `idx_insumo_id`(`insumo_id`),
    INDEX `idx_loja_id`(`loja_id`),
    INDEX `idx_os_origem_id`(`os_origem_id`),
    INDEX `idx_status`(`status`),
    PRIMARY KEY (`id`)
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

    INDEX `idx_dataTransferencia`(`dataTransferencia`),
    INDEX `idx_estoqueId`(`estoqueId`),
    INDEX `idx_lojaId`(`lojaId`),
    INDEX `idx_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `document_sequences` (
    `id` VARCHAR(191) NOT NULL,
    `loja_id` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `ano` INTEGER NOT NULL,
    `ultimo_numero` INTEGER NOT NULL DEFAULT 0,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    INDEX `document_sequences_loja_id_idx`(`loja_id`),
    UNIQUE INDEX `document_sequences_loja_id_tipo_ano_key`(`loja_id`, `tipo`, `ano`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ordens_servico` (
    `id` VARCHAR(191) NOT NULL,
    `numero` VARCHAR(191) NOT NULL,
    `loja_id` VARCHAR(191) NOT NULL,
    `cliente_id` VARCHAR(191) NOT NULL,
    `orcamento_id` VARCHAR(191) NULL,
    `data_abertura` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `data_prazo` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'FILA',
    `responsavel_id` VARCHAR(191) NULL,
    `observacoes` TEXT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,
    `nome_servico` VARCHAR(191) NOT NULL,
    `descricao` TEXT NULL,
    `quantidade` DECIMAL(10, 2) NOT NULL,
    `parametros_tecnicos` LONGTEXT NULL,
    `insumos_calculados` LONGTEXT NULL,
    `materiais_disponivel` BOOLEAN NOT NULL DEFAULT false,
    `aprovacao_tecnica_status` VARCHAR(191) NULL DEFAULT 'PENDENTE',
    `aprovacao_tecnica_por` VARCHAR(191) NULL,
    `aprovacao_tecnica_em` DATETIME(3) NULL,
    `aprovacao_tecnica_obs` TEXT NULL,
    `data_instalacao_agendada` DATETIME(3) NULL,
    `observacoes_instalacao` TEXT NULL,
    `tipo_os` VARCHAR(191) NOT NULL DEFAULT 'COMERCIAL',
    `origem_os` VARCHAR(191) NULL,
    `prioridade` VARCHAR(191) NOT NULL DEFAULT 'NORMAL',
    `departamento_solicitante` VARCHAR(191) NULL,
    `centro_custo` VARCHAR(191) NULL,
    `projeto_interno` VARCHAR(191) NULL,
    `aprovacao_gerencial` VARCHAR(191) NULL DEFAULT 'PENDENTE',
    `aprovacao_gerencial_por` VARCHAR(191) NULL,
    `aprovacao_gerencial_em` DATETIME(3) NULL,
    `aprovacao_gerencial_obs` TEXT NULL,
    `valor_orcado` DECIMAL(12, 2) NULL,
    `valor_realizado` DECIMAL(12, 2) NULL,
    `margem_lucro_real` DECIMAL(5, 2) NULL,
    `data_entrega_cliente` DATETIME(3) NULL,
    `satisfacao_cliente` INTEGER NULL,
    `observacoes_cliente` TEXT NULL,
    `criado_por` VARCHAR(191) NULL,
    `modificado_por` VARCHAR(191) NULL,
    `motivo_modificacao` TEXT NULL,
    `versao` INTEGER NOT NULL DEFAULT 1,
    `retrabalho` BOOLEAN NOT NULL DEFAULT false,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `inativado_em` DATETIME(3) NULL,
    `inativado_por` VARCHAR(191) NULL,
    `motivo_inativacao` TEXT NULL,
    `status_antes_inativacao` VARCHAR(191) NULL,
    `snapshot_antes_inativacao` LONGTEXT NULL,

    INDEX `ordens_servico_loja_id_status_idx`(`loja_id`, `status`),
    INDEX `ordens_servico_loja_id_ativo_idx`(`loja_id`, `ativo`),
    INDEX `ordens_servico_loja_id_retrabalho_idx`(`loja_id`, `retrabalho`),
    INDEX `ordens_servico_cliente_id_idx`(`cliente_id`),
    INDEX `ordens_servico_responsavel_id_idx`(`responsavel_id`),
    INDEX `ordens_servico_data_abertura_idx`(`data_abertura`),
    INDEX `ordens_servico_aprovacao_tecnica_status_idx`(`aprovacao_tecnica_status`),
    INDEX `ordens_servico_aprovacao_tecnica_por_idx`(`aprovacao_tecnica_por`),
    INDEX `ordens_servico_data_instalacao_agendada_idx`(`data_instalacao_agendada`),
    INDEX `ordens_servico_tipo_os_idx`(`tipo_os`),
    INDEX `ordens_servico_origem_os_idx`(`origem_os`),
    INDEX `ordens_servico_prioridade_idx`(`prioridade`),
    INDEX `ordens_servico_departamento_solicitante_idx`(`departamento_solicitante`),
    INDEX `ordens_servico_centro_custo_idx`(`centro_custo`),
    INDEX `ordens_servico_aprovacao_gerencial_idx`(`aprovacao_gerencial`),
    INDEX `ordens_servico_aprovacao_gerencial_por_idx`(`aprovacao_gerencial_por`),
    INDEX `ordens_servico_data_entrega_cliente_idx`(`data_entrega_cliente`),
    INDEX `ordens_servico_criado_por_idx`(`criado_por`),
    INDEX `ordens_servico_modificado_por_idx`(`modificado_por`),
    INDEX `ordens_servico_versao_idx`(`versao`),
    UNIQUE INDEX `ordens_servico_loja_id_numero_key`(`loja_id`, `numero`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `itens_os` (
    `id` VARCHAR(191) NOT NULL,
    `os_id` VARCHAR(191) NOT NULL,
    `produto_servico` VARCHAR(191) NOT NULL,
    `quantidade` DECIMAL(10, 2) NOT NULL,
    `parametros_tecnicos` LONGTEXT NULL,
    `insumos_necessarios` LONGTEXT NULL,
    `materiais_disponivel` BOOLEAN NOT NULL DEFAULT false,
    `observacoes` TEXT NULL,
    `sobra_acao` VARCHAR(32) NULL,
    `sobra_observacao` TEXT NULL,
    `sobra_registrada_id` VARCHAR(191) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `largura` DECIMAL(10, 2) NULL,
    `altura` DECIMAL(10, 2) NULL,
    `profundidade` DECIMAL(10, 2) NULL,
    `area` DECIMAL(10, 2) NULL,
    `perimetro` DECIMAL(10, 2) NULL,
    `unidade_medida` VARCHAR(16) NULL,
    `unidade_geometria` VARCHAR(4) NULL,
    `geometria_origem` VARCHAR(16) NULL,
    `arquivo_geometria_url` VARCHAR(512) NULL,
    `arquivo_geometria_metadados` LONGTEXT NULL,
    `data_inicio_producao` DATETIME(3) NULL,
    `data_prazo_produto` DATETIME(3) NULL,
    `status_liberacao_pcp` VARCHAR(191) NULL DEFAULT 'PENDENTE',
    `liberado_pcp_por` VARCHAR(191) NULL,
    `liberado_pcp_em` DATETIME(3) NULL,
    `prioridade_produto` VARCHAR(191) NULL DEFAULT 'NORMAL',
    `ordem_producao` INTEGER NULL,
    `responsabilidade_arte` VARCHAR(32) NOT NULL DEFAULT 'NAO_APLICAVEL',
    `politica_cobranca_arte` VARCHAR(32) NOT NULL DEFAULT 'NAO_APLICAVEL',
    `finalidade_anexo` VARCHAR(32) NULL,
    `complexidade_arte` VARCHAR(16) NULL,
    `status_arte` VARCHAR(32) NOT NULL DEFAULT 'NAO_APLICA',
    `designer_atribuido_id` VARCHAR(191) NULL,
    `arte_fila_desde` DATETIME(3) NULL,
    `arte_assumido_em` DATETIME(3) NULL,
    `data_prazo_arte` DATETIME(3) NULL,

    INDEX `itens_os_os_id_idx`(`os_id`),
    INDEX `itens_os_status_liberacao_pcp_idx`(`status_liberacao_pcp`),
    INDEX `itens_os_data_inicio_producao_idx`(`data_inicio_producao`),
    INDEX `itens_os_status_arte_idx`(`status_arte`),
    INDEX `itens_os_responsabilidade_arte_idx`(`responsabilidade_arte`),
    INDEX `itens_os_designer_atribuido_id_idx`(`designer_atribuido_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workflows_os` (
    `id` VARCHAR(191) NOT NULL,
    `loja_id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `descricao` TEXT NULL,
    `etapas` LONGTEXT NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `sequencial` BOOLEAN NOT NULL DEFAULT true,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    INDEX `workflows_os_loja_id_ativo_idx`(`loja_id`, `ativo`),
    UNIQUE INDEX `workflows_os_loja_id_nome_key`(`loja_id`, `nome`),
    PRIMARY KEY (`id`)
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

    INDEX `movimentacoes_os_os_id_idx`(`os_id`),
    INDEX `movimentacoes_os_data_movimentacao_idx`(`data_movimentacao`),
    INDEX `movimentacoes_os_usuario_id_idx`(`usuario_id`),
    PRIMARY KEY (`id`)
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

    INDEX `checklists_os_os_id_etapa_idx`(`os_id`, `etapa`),
    INDEX `checklists_os_concluido_idx`(`concluido`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workflow_instancia` (
    `id` VARCHAR(191) NOT NULL,
    `os_id` VARCHAR(191) NOT NULL,
    `workflow_id` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ATIVO',
    `etapa_atual` VARCHAR(191) NULL,
    `data_inicio` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `data_fim` DATETIME(3) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    UNIQUE INDEX `workflow_instancia_os_id_key`(`os_id`),
    INDEX `workflow_instancia_workflow_id_idx`(`workflow_id`),
    INDEX `workflow_instancia_status_idx`(`status`),
    INDEX `workflow_instancia_etapa_atual_idx`(`etapa_atual`),
    INDEX `workflow_instancia_data_inicio_idx`(`data_inicio`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `etapa_instancia` (
    `id` VARCHAR(191) NOT NULL,
    `workflow_instancia_id` VARCHAR(191) NOT NULL,
    `etapa_nome` VARCHAR(191) NOT NULL,
    `ordem` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDENTE',
    `data_inicio` DATETIME(3) NULL,
    `data_fim` DATETIME(3) NULL,
    `responsavel_id` VARCHAR(191) NULL,
    `tempo_estimado` INTEGER NULL,
    `tempo_real` INTEGER NULL,
    `observacoes` TEXT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    INDEX `etapa_instancia_workflow_instancia_id_idx`(`workflow_instancia_id`),
    INDEX `etapa_instancia_etapa_nome_idx`(`etapa_nome`),
    INDEX `etapa_instancia_status_idx`(`status`),
    INDEX `etapa_instancia_ordem_idx`(`ordem`),
    INDEX `etapa_instancia_responsavel_id_idx`(`responsavel_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `checklist_instancia` (
    `id` VARCHAR(191) NOT NULL,
    `etapa_instancia_id` VARCHAR(191) NOT NULL,
    `item_descricao` VARCHAR(500) NOT NULL,
    `obrigatorio` BOOLEAN NOT NULL DEFAULT true,
    `concluido` BOOLEAN NOT NULL DEFAULT false,
    `concluido_por` VARCHAR(191) NULL,
    `data_conclusao` DATETIME(3) NULL,
    `observacoes` TEXT NULL,
    `ordem` INTEGER NOT NULL DEFAULT 0,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    INDEX `checklist_instancia_etapa_instancia_id_idx`(`etapa_instancia_id`),
    INDEX `checklist_instancia_concluido_idx`(`concluido`),
    INDEX `checklist_instancia_ordem_idx`(`ordem`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `apontamento` (
    `id` VARCHAR(191) NOT NULL,
    `os_id` VARCHAR(191) NOT NULL,
    `etapa_instancia_id` VARCHAR(191) NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `data_apontamento` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `usuario_id` VARCHAR(191) NOT NULL,
    `observacoes` TEXT NULL,
    `quantidade_produzida` DECIMAL(10, 3) NULL,
    `quantidade_refugo` DECIMAL(10, 3) NULL,
    `tempo_gasto` INTEGER NULL,
    `ip_origem` VARCHAR(191) NULL,
    `user_agent` VARCHAR(500) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `apontamento_os_id_idx`(`os_id`),
    INDEX `apontamento_etapa_instancia_id_idx`(`etapa_instancia_id`),
    INDEX `apontamento_tipo_idx`(`tipo`),
    INDEX `apontamento_data_apontamento_idx`(`data_apontamento`),
    INDEX `apontamento_usuario_id_idx`(`usuario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `setores_produtivos` (
    `id` VARCHAR(191) NOT NULL,
    `loja_id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `descricao` TEXT NULL,
    `cor` VARCHAR(191) NOT NULL DEFAULT '#3B82F6',
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `ordem` INTEGER NOT NULL DEFAULT 0,
    `horas_produtivas_mensais` INTEGER NULL,
    `percentual_rateio_geral` DECIMAL(5, 2) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    INDEX `setores_produtivos_loja_id_ativo_idx`(`loja_id`, `ativo`),
    INDEX `setores_produtivos_ordem_idx`(`ordem`),
    UNIQUE INDEX `setores_produtivos_loja_id_nome_key`(`loja_id`, `nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workflow_setores` (
    `id` VARCHAR(191) NOT NULL,
    `workflow_id` VARCHAR(191) NOT NULL,
    `setor_id` VARCHAR(191) NOT NULL,
    `ordem` INTEGER NOT NULL DEFAULT 0,
    `tempo_estimado` INTEGER NULL,
    `obrigatorio` BOOLEAN NOT NULL DEFAULT true,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `workflow_setores_workflow_id_idx`(`workflow_id`),
    INDEX `workflow_setores_setor_id_idx`(`setor_id`),
    UNIQUE INDEX `workflow_setores_workflow_id_setor_id_key`(`workflow_id`, `setor_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workflow_categorias` (
    `id` VARCHAR(191) NOT NULL,
    `loja_id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `descricao` TEXT NULL,
    `workflow_id` VARCHAR(191) NOT NULL,
    `criterios` LONGTEXT NULL,
    `prioridade` INTEGER NOT NULL DEFAULT 0,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    INDEX `workflow_categorias_workflow_id_idx`(`workflow_id`),
    INDEX `workflow_categorias_loja_id_ativo_idx`(`loja_id`, `ativo`),
    UNIQUE INDEX `workflow_categorias_loja_id_nome_key`(`loja_id`, `nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workflow_categoria_regras` (
    `id` VARCHAR(191) NOT NULL,
    `categoria_id` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `valor` VARCHAR(191) NOT NULL,
    `obrigatoria` BOOLEAN NOT NULL DEFAULT true,
    `prioridade` INTEGER NOT NULL DEFAULT 0,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    INDEX `workflow_categoria_regras_categoria_id_idx`(`categoria_id`),
    PRIMARY KEY (`id`)
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

    INDEX `workflow_instancia_setor_workflow_instancia_id_idx`(`workflow_instancia_id`),
    INDEX `workflow_instancia_setor_setor_id_idx`(`setor_id`),
    INDEX `workflow_instancia_setor_item_os_id_idx`(`item_os_id`),
    INDEX `workflow_instancia_setor_status_idx`(`status`),
    INDEX `workflow_instancia_setor_operador_id_idx`(`operador_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `expedicoes_logistica` (
    `id` VARCHAR(191) NOT NULL,
    `loja_id` VARCHAR(191) NOT NULL,
    `os_id` VARCHAR(191) NOT NULL,
    `modalidade` ENUM('RETIRADA_CLIENTE', 'ENTREGA_TRANSPORTADORA', 'ENTREGA_FROTA_PROPRIA', 'INSTALACAO_NO_LOCAL') NOT NULL DEFAULT 'RETIRADA_CLIENTE',
    `status` ENUM('AGUARDANDO_SEPARACAO', 'PRONTO_PARA_RETIRADA', 'EM_ROTA_DE_ENTREGA', 'AGUARDANDO_INSTALACAO', 'ENTREGUE_FINALIZADO', 'ARQUIVADO', 'DEVOLVIDA') NOT NULL DEFAULT 'AGUARDANDO_SEPARACAO',
    `codigo_rastreio` VARCHAR(100) NULL,
    `data_expedida` DATETIME(3) NULL,
    `data_conclusao` DATETIME(3) NULL,
    `recebedor_nome` VARCHAR(150) NULL,
    `recebedor_doc` VARCHAR(50) NULL,
    `url_assinatura` TEXT NULL,
    `observacoes` TEXT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    INDEX `expedicoes_logistica_loja_id_idx`(`loja_id`),
    INDEX `expedicoes_logistica_loja_id_status_idx`(`loja_id`, `status`),
    INDEX `expedicoes_logistica_loja_id_os_id_idx`(`loja_id`, `os_id`),
    INDEX `expedicoes_logistica_os_id_idx`(`os_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `configuracao_arte_loja` (
    `id` VARCHAR(191) NOT NULL,
    `loja_id` VARCHAR(191) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `modelo_precificacao` VARCHAR(24) NOT NULL DEFAULT 'HORA',
    `servico_arte_id` VARCHAR(191) NULL,
    `cobranca_padrao` VARCHAR(32) NOT NULL DEFAULT 'INCLUIDA_NO_PRODUTO',
    `horas_padrao_criacao` DECIMAL(10, 2) NOT NULL DEFAULT 1,
    `horas_padrao_adaptacao` DECIMAL(10, 2) NOT NULL DEFAULT 0.5,
    `exibir_linha_pdf` BOOLEAN NOT NULL DEFAULT false,
    `permitir_edicao_orcamentista` BOOLEAN NOT NULL DEFAULT true,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    UNIQUE INDEX `configuracao_arte_loja_loja_id_key`(`loja_id`),
    INDEX `configuracao_arte_loja_servico_arte_id_idx`(`servico_arte_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `arte_versoes` (
    `id` VARCHAR(191) NOT NULL,
    `os_id` VARCHAR(191) NOT NULL,
    `servico_id` VARCHAR(191) NULL,
    `versao` VARCHAR(191) NOT NULL,
    `status` ENUM('RASCUNHO', 'ENVIADA_CLIENTE', 'APROVADA', 'REVISAO_SOLICITADA', 'BLOQUEADA', 'ENVIADA_PCP') NOT NULL,
    `autor_id` VARCHAR(191) NOT NULL,
    `descricao` VARCHAR(191) NULL,
    `observacoes` VARCHAR(191) NULL,
    `data_criacao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `data_aprovacao` DATETIME(3) NULL,
    `aprovado_por` VARCHAR(191) NULL,
    `aprovado_por_cliente` BOOLEAN NOT NULL DEFAULT false,
    `liberado_para_pcp` BOOLEAN NOT NULL DEFAULT false,
    `liberado_em` DATETIME(3) NULL,
    `liberado_por` VARCHAR(191) NULL,
    `loja_id` VARCHAR(191) NOT NULL,
    `deletado` BOOLEAN NOT NULL DEFAULT false,
    `data_exclusao` DATETIME(3) NULL,
    `excluido_por` VARCHAR(191) NULL,

    INDEX `arte_versoes_os_id_loja_id_idx`(`os_id`, `loja_id`),
    INDEX `arte_versoes_status_loja_id_idx`(`status`, `loja_id`),
    INDEX `arte_versoes_autor_id_loja_id_idx`(`autor_id`, `loja_id`),
    INDEX `arte_versoes_deletado_loja_id_idx`(`deletado`, `loja_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `arte_arquivos` (
    `id` VARCHAR(191) NOT NULL,
    `versao_id` VARCHAR(191) NOT NULL,
    `nome_arquivo` VARCHAR(191) NOT NULL,
    `nome_original` VARCHAR(191) NOT NULL,
    `tipo_arquivo` VARCHAR(191) NOT NULL,
    `tamanho` BIGINT NOT NULL,
    `url_arquivo` VARCHAR(191) NOT NULL,
    `url_thumbnail` VARCHAR(191) NULL,
    `storage_provider` VARCHAR(191) NOT NULL,
    `storage_path` VARCHAR(191) NOT NULL,
    `data_upload` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `loja_id` VARCHAR(191) NOT NULL,

    INDEX `arte_arquivos_versao_id_loja_id_idx`(`versao_id`, `loja_id`),
    INDEX `arte_arquivos_tipo_arquivo_loja_id_idx`(`tipo_arquivo`, `loja_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `arte_comentarios` (
    `id` VARCHAR(191) NOT NULL,
    `versao_id` VARCHAR(191) NOT NULL,
    `usuario_id` VARCHAR(191) NOT NULL,
    `comentario` LONGTEXT NOT NULL,
    `tipo` ENUM('INTERNO', 'CLIENTE', 'SISTEMA') NOT NULL DEFAULT 'INTERNO',
    `data_comentario` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `loja_id` VARCHAR(191) NOT NULL,

    INDEX `arte_comentarios_versao_id_loja_id_idx`(`versao_id`, `loja_id`),
    INDEX `arte_comentarios_usuario_id_loja_id_idx`(`usuario_id`, `loja_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `arte_links_aprovacao` (
    `id` VARCHAR(191) NOT NULL,
    `versao_id` VARCHAR(191) NOT NULL,
    `token_publico` VARCHAR(191) NOT NULL,
    `expira_em` DATETIME(3) NOT NULL,
    `aprovado` BOOLEAN NOT NULL DEFAULT false,
    `data_aprovacao` DATETIME(3) NULL,
    `ip_aprovacao` VARCHAR(191) NULL,
    `user_agent` VARCHAR(191) NULL,
    `comentario_cliente` LONGTEXT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `loja_id` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `arte_links_aprovacao_token_publico_key`(`token_publico`),
    INDEX `arte_links_aprovacao_token_publico_idx`(`token_publico`),
    INDEX `arte_links_aprovacao_loja_id_idx`(`loja_id`),
    INDEX `arte_links_aprovacao_expira_em_idx`(`expira_em`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `arte_mensagens` (
    `id` VARCHAR(191) NOT NULL,
    `os_id` VARCHAR(191) NOT NULL,
    `produto_id` VARCHAR(191) NOT NULL,
    `versao_id` VARCHAR(191) NULL,
    `mensagem` LONGTEXT NOT NULL,
    `autor_tipo` ENUM('CLIENTE', 'EQUIPE') NOT NULL,
    `autor_nome` VARCHAR(191) NOT NULL,
    `autor_email` VARCHAR(191) NULL,
    `lida` BOOLEAN NOT NULL DEFAULT false,
    `data_leitura` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `loja_id` VARCHAR(191) NOT NULL,

    INDEX `arte_mensagens_os_id_produto_id_loja_id_idx`(`os_id`, `produto_id`, `loja_id`),
    INDEX `arte_mensagens_autor_tipo_loja_id_idx`(`autor_tipo`, `loja_id`),
    INDEX `arte_mensagens_lida_loja_id_idx`(`lida`, `loja_id`),
    INDEX `arte_mensagens_created_at_loja_id_idx`(`created_at`, `loja_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `onboarding_operacional` (
    `id` VARCHAR(191) NOT NULL,
    `loja_id` VARCHAR(191) NOT NULL,
    `step_id` VARCHAR(64) NOT NULL,
    `status` VARCHAR(16) NOT NULL DEFAULT 'pendente',
    `concluido_em` DATETIME(3) NULL,
    `ignorado_em` DATETIME(3) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    INDEX `onboarding_operacional_loja_id_idx`(`loja_id`),
    INDEX `onboarding_operacional_status_idx`(`status`),
    UNIQUE INDEX `onboarding_operacional_loja_id_step_id_key`(`loja_id`, `step_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categorias_produto_finito` (
    `id` VARCHAR(191) NOT NULL,
    `loja_id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(100) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    INDEX `categorias_produto_finito_loja_id_idx`(`loja_id`),
    UNIQUE INDEX `categorias_produto_finito_loja_id_nome_key`(`loja_id`, `nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `produtos_finitos` (
    `id` VARCHAR(191) NOT NULL,
    `loja_id` VARCHAR(191) NOT NULL,
    `categoria_id` VARCHAR(191) NULL,
    `sku` VARCHAR(50) NOT NULL,
    `ean` VARCHAR(13) NULL,
    `nome` VARCHAR(255) NOT NULL,
    `descricao_resumida` VARCHAR(500) NULL,
    `descricao` TEXT NULL,
    `preco_venda` DECIMAL(10, 2) NOT NULL,
    `preco_promocional` DECIMAL(10, 2) NULL,
    `preco_custo` DECIMAL(10, 2) NULL,
    `peso_kg` DECIMAL(10, 3) NOT NULL DEFAULT 0,
    `largura_cm` INTEGER NOT NULL DEFAULT 0,
    `altura_cm` INTEGER NOT NULL DEFAULT 0,
    `profundidade_cm` INTEGER NOT NULL DEFAULT 0,
    `estoque_atual` INTEGER NOT NULL DEFAULT 0,
    `estoque_minimo` INTEGER NOT NULL DEFAULT 0,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    INDEX `produtos_finitos_loja_id_idx`(`loja_id`),
    INDEX `produtos_finitos_categoria_id_idx`(`categoria_id`),
    UNIQUE INDEX `produtos_finitos_loja_id_sku_key`(`loja_id`, `sku`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `galeria_produto_finito` (
    `id` VARCHAR(191) NOT NULL,
    `produto_finito_id` VARCHAR(191) NOT NULL,
    `url_imagem` TEXT NOT NULL,
    `ordem` INTEGER NOT NULL DEFAULT 0,

    INDEX `galeria_produto_finito_produto_finito_id_idx`(`produto_finito_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `insumos` ADD CONSTRAINT `insumos_categoriaId_fkey` FOREIGN KEY (`categoriaId`) REFERENCES `categorias`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `insumos` ADD CONSTRAINT `insumos_fornecedorId_fkey` FOREIGN KEY (`fornecedorId`) REFERENCES `fornecedor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `insumos` ADD CONSTRAINT `insumos_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `insumos` ADD CONSTRAINT `insumos_tipoMaterialId_fkey` FOREIGN KEY (`tipoMaterialId`) REFERENCES `tipomaterial`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `categorias` ADD CONSTRAINT `categorias_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `historico_custo_maquinas` ADD CONSTRAINT `historico_custo_maquinas_maquina_id_fkey` FOREIGN KEY (`maquina_id`) REFERENCES `maquina`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `historico_custo_funcoes` ADD CONSTRAINT `historico_custo_funcoes_funcao_id_fkey` FOREIGN KEY (`funcao_id`) REFERENCES `funcao`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `historico_preco_insumos` ADD CONSTRAINT `historico_preco_insumos_insumo_id_fkey` FOREIGN KEY (`insumo_id`) REFERENCES `insumos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orcamento_historico` ADD CONSTRAINT `orcamento_historico_orcamento_id_fkey` FOREIGN KEY (`orcamento_id`) REFERENCES `orcamento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orcamento_logs` ADD CONSTRAINT `orcamento_logs_orcamento_id_fkey` FOREIGN KEY (`orcamento_id`) REFERENCES `orcamento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cobrancas` ADD CONSTRAINT `cobrancas_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cobrancas` ADD CONSTRAINT `cobrancas_orcamento_id_fkey` FOREIGN KEY (`orcamento_id`) REFERENCES `orcamento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cobrancas` ADD CONSTRAINT `cobrancas_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `cliente`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cobranca_parcelas` ADD CONSTRAINT `cobranca_parcelas_cobranca_id_fkey` FOREIGN KEY (`cobranca_id`) REFERENCES `cobrancas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cobranca_recebimentos` ADD CONSTRAINT `cobranca_recebimentos_cobranca_id_fkey` FOREIGN KEY (`cobranca_id`) REFERENCES `cobrancas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cobranca_recebimentos` ADD CONSTRAINT `cobranca_recebimentos_parcela_id_fkey` FOREIGN KEY (`parcela_id`) REFERENCES `cobranca_parcelas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cobranca_recebimentos` ADD CONSTRAINT `cobranca_recebimentos_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cobranca_logs` ADD CONSTRAINT `cobranca_logs_cobranca_id_fkey` FOREIGN KEY (`cobranca_id`) REFERENCES `cobrancas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cobranca_logs` ADD CONSTRAINT `cobranca_logs_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ordem_servico_logs` ADD CONSTRAINT `ordem_servico_logs_os_id_fkey` FOREIGN KEY (`os_id`) REFERENCES `ordens_servico`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ordem_servico_logs` ADD CONSTRAINT `ordem_servico_logs_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `regras_validacao` ADD CONSTRAINT `regras_validacao_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `execucoes_regras` ADD CONSTRAINT `execucoes_regras_regra_id_fkey` FOREIGN KEY (`regra_id`) REFERENCES `regras_validacao`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `execucoes_regras` ADD CONSTRAINT `execucoes_regras_os_id_fkey` FOREIGN KEY (`os_id`) REFERENCES `ordens_servico`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `execucoes_regras` ADD CONSTRAINT `execucoes_regras_orcamento_id_fkey` FOREIGN KEY (`orcamento_id`) REFERENCES `orcamento`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `template_produtos` ADD CONSTRAINT `template_produtos_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item_template_produtos` ADD CONSTRAINT `item_template_produtos_insumo_id_fkey` FOREIGN KEY (`insumo_id`) REFERENCES `insumos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item_template_produtos` ADD CONSTRAINT `item_template_produtos_template_id_fkey` FOREIGN KEY (`template_id`) REFERENCES `template_produtos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `maquina_template_produtos` ADD CONSTRAINT `maquina_template_produtos_maquina_id_fkey` FOREIGN KEY (`maquina_id`) REFERENCES `maquina`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `maquina_template_produtos` ADD CONSTRAINT `maquina_template_produtos_template_id_fkey` FOREIGN KEY (`template_id`) REFERENCES `template_produtos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `funcao_template_produtos` ADD CONSTRAINT `funcao_template_produtos_funcao_id_fkey` FOREIGN KEY (`funcao_id`) REFERENCES `funcao`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `funcao_template_produtos` ADD CONSTRAINT `funcao_template_produtos_template_id_fkey` FOREIGN KEY (`template_id`) REFERENCES `template_produtos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `servico_template_produtos` ADD CONSTRAINT `servico_template_produtos_servico_id_fkey` FOREIGN KEY (`servico_id`) REFERENCES `servico_manual`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `servico_template_produtos` ADD CONSTRAINT `servico_template_produtos_template_id_fkey` FOREIGN KEY (`template_id`) REFERENCES `template_produtos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `anexomensagem` ADD CONSTRAINT `AnexoMensagem_mensagem_id_fkey` FOREIGN KEY (`mensagem_id`) REFERENCES `mensagemnegociacao`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cliente` ADD CONSTRAINT `Cliente_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `custoindireto` ADD CONSTRAINT `CustoIndireto_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `custoindireto` ADD CONSTRAINT `CustoIndireto_setor_id_fkey` FOREIGN KEY (`setor_id`) REFERENCES `setores_produtivos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fornecedor` ADD CONSTRAINT `Fornecedor_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `funcao` ADD CONSTRAINT `Funcao_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `funcao` ADD CONSTRAINT `Funcao_maquina_id_fkey` FOREIGN KEY (`maquina_id`) REFERENCES `maquina`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `funcao` ADD CONSTRAINT `Funcao_setor_id_fkey` FOREIGN KEY (`setor_id`) REFERENCES `setores_produtivos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `funcaoorcamento` ADD CONSTRAINT `FuncaoOrcamento_funcao_id_fkey` FOREIGN KEY (`funcao_id`) REFERENCES `funcao`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `funcaoorcamento` ADD CONSTRAINT `FuncaoOrcamento_orcamento_id_fkey` FOREIGN KEY (`orcamento_id`) REFERENCES `orcamento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `itemorcamento` ADD CONSTRAINT `ItemOrcamento_insumo_id_fkey` FOREIGN KEY (`insumo_id`) REFERENCES `insumos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `itemorcamento` ADD CONSTRAINT `ItemOrcamento_orcamento_id_fkey` FOREIGN KEY (`orcamento_id`) REFERENCES `orcamento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `maquina` ADD CONSTRAINT `Maquina_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `maquina` ADD CONSTRAINT `Maquina_setor_id_fkey` FOREIGN KEY (`setor_id`) REFERENCES `setores_produtivos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `maquinaorcamento` ADD CONSTRAINT `MaquinaOrcamento_maquina_id_fkey` FOREIGN KEY (`maquina_id`) REFERENCES `maquina`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `maquinaorcamento` ADD CONSTRAINT `MaquinaOrcamento_orcamento_id_fkey` FOREIGN KEY (`orcamento_id`) REFERENCES `orcamento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mensagemnegociacao` ADD CONSTRAINT `MensagemNegociacao_orcamento_id_fkey` FOREIGN KEY (`orcamento_id`) REFERENCES `orcamento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notificacao` ADD CONSTRAINT `Notificacao_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notificacao` ADD CONSTRAINT `Notificacao_orcamento_id_fkey` FOREIGN KEY (`orcamento_id`) REFERENCES `orcamento`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `modo_impressao` ADD CONSTRAINT `ModoImpressao_maquina_id_fkey` FOREIGN KEY (`maquina_id`) REFERENCES `maquina`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `modo_impressao` ADD CONSTRAINT `ModoImpressao_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `modalidade_entrega` ADD CONSTRAINT `modalidade_entrega_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tipo_instalacao` ADD CONSTRAINT `tipo_instalacao_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orcamento` ADD CONSTRAINT `Orcamento_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `cliente`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orcamento` ADD CONSTRAINT `Orcamento_entrega_modalidade_id_fkey` FOREIGN KEY (`entrega_modalidade_id`) REFERENCES `modalidade_entrega`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orcamento` ADD CONSTRAINT `Orcamento_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orcamento` ADD CONSTRAINT `orcamento_responsavel_id_fkey` FOREIGN KEY (`responsavel_id`) REFERENCES `usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProdutoOrcamento` ADD CONSTRAINT `ProdutoOrcamento_orcamento_id_fkey` FOREIGN KEY (`orcamento_id`) REFERENCES `orcamento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProdutoOrcamento` ADD CONSTRAINT `ProdutoOrcamento_instalacao_tipo_id_fkey` FOREIGN KEY (`instalacao_tipo_id`) REFERENCES `tipo_instalacao`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProdutoOrcamento` ADD CONSTRAINT `ProdutoOrcamento_produto_finito_id_fkey` FOREIGN KEY (`produto_finito_id`) REFERENCES `produtos_finitos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ItemInsumo` ADD CONSTRAINT `ItemInsumo_produto_id_fkey` FOREIGN KEY (`produto_id`) REFERENCES `ProdutoOrcamento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ItemInsumo` ADD CONSTRAINT `ItemInsumo_insumo_id_fkey` FOREIGN KEY (`insumo_id`) REFERENCES `insumos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ItemMaquina` ADD CONSTRAINT `ItemMaquina_produto_id_fkey` FOREIGN KEY (`produto_id`) REFERENCES `ProdutoOrcamento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ItemMaquina` ADD CONSTRAINT `ItemMaquina_maquina_id_fkey` FOREIGN KEY (`maquina_id`) REFERENCES `maquina`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ItemFuncao` ADD CONSTRAINT `ItemFuncao_produto_id_fkey` FOREIGN KEY (`produto_id`) REFERENCES `ProdutoOrcamento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ItemFuncao` ADD CONSTRAINT `ItemFuncao_funcao_id_fkey` FOREIGN KEY (`funcao_id`) REFERENCES `funcao`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ItemServicoManual` ADD CONSTRAINT `ItemServicoManual_produto_id_fkey` FOREIGN KEY (`produto_id`) REFERENCES `ProdutoOrcamento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ItemServicoManual` ADD CONSTRAINT `ItemServicoManual_servico_id_fkey` FOREIGN KEY (`servico_id`) REFERENCES `servico_manual`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ItemCustoIndireto` ADD CONSTRAINT `ItemCustoIndireto_produto_id_fkey` FOREIGN KEY (`produto_id`) REFERENCES `ProdutoOrcamento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ItemCustoIndireto` ADD CONSTRAINT `ItemCustoIndireto_custo_id_fkey` FOREIGN KEY (`custo_id`) REFERENCES `custoindireto`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HistoricoOrcamento` ADD CONSTRAINT `HistoricoOrcamento_orcamento_id_fkey` FOREIGN KEY (`orcamento_id`) REFERENCES `orcamento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VersaoOrcamento` ADD CONSTRAINT `VersaoOrcamento_orcamento_id_fkey` FOREIGN KEY (`orcamento_id`) REFERENCES `orcamento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MensagemChat` ADD CONSTRAINT `MensagemChat_orcamento_id_fkey` FOREIGN KEY (`orcamento_id`) REFERENCES `orcamento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LinkPublico` ADD CONSTRAINT `LinkPublico_orcamento_id_fkey` FOREIGN KEY (`orcamento_id`) REFERENCES `orcamento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AcessoLink` ADD CONSTRAINT `AcessoLink_link_id_fkey` FOREIGN KEY (`link_id`) REFERENCES `LinkPublico`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `estoque` ADD CONSTRAINT `estoque_insumo_id_fkey` FOREIGN KEY (`insumo_id`) REFERENCES `insumos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aprovacaoOrcamento` ADD CONSTRAINT `aprovacaoOrcamento_orcamento_id_fkey` FOREIGN KEY (`orcamento_id`) REFERENCES `orcamento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tipomaterial` ADD CONSTRAINT `TipoMaterial_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `servico_manual` ADD CONSTRAINT `ServicoManual_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `servico_manual` ADD CONSTRAINT `ServicoManual_setor_id_fkey` FOREIGN KEY (`setor_id`) REFERENCES `setores_produtivos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usuario` ADD CONSTRAINT `Usuario_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `password_reset_token` ADD CONSTRAINT `PasswordResetToken_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `perfil_acesso` ADD CONSTRAINT `perfil_acesso_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `perfil_permissao` ADD CONSTRAINT `perfil_permissao_perfil_id_fkey` FOREIGN KEY (`perfil_id`) REFERENCES `perfil_acesso`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usuario_perfil` ADD CONSTRAINT `usuario_perfil_perfil_id_fkey` FOREIGN KEY (`perfil_id`) REFERENCES `perfil_acesso`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usuario_perfil` ADD CONSTRAINT `usuario_perfil_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ordens_servico` ADD CONSTRAINT `ordens_servico_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ordens_servico` ADD CONSTRAINT `ordens_servico_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `cliente`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ordens_servico` ADD CONSTRAINT `ordens_servico_orcamento_id_fkey` FOREIGN KEY (`orcamento_id`) REFERENCES `orcamento`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `itens_os` ADD CONSTRAINT `itens_os_os_id_fkey` FOREIGN KEY (`os_id`) REFERENCES `ordens_servico`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `itens_os` ADD CONSTRAINT `itens_os_designer_atribuido_id_fkey` FOREIGN KEY (`designer_atribuido_id`) REFERENCES `usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workflows_os` ADD CONSTRAINT `workflows_os_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movimentacoes_os` ADD CONSTRAINT `movimentacoes_os_os_id_fkey` FOREIGN KEY (`os_id`) REFERENCES `ordens_servico`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `checklists_os` ADD CONSTRAINT `checklists_os_os_id_fkey` FOREIGN KEY (`os_id`) REFERENCES `ordens_servico`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workflow_instancia` ADD CONSTRAINT `workflow_instancia_os_id_fkey` FOREIGN KEY (`os_id`) REFERENCES `ordens_servico`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workflow_instancia` ADD CONSTRAINT `workflow_instancia_workflow_id_fkey` FOREIGN KEY (`workflow_id`) REFERENCES `workflows_os`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `etapa_instancia` ADD CONSTRAINT `etapa_instancia_workflow_instancia_id_fkey` FOREIGN KEY (`workflow_instancia_id`) REFERENCES `workflow_instancia`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `checklist_instancia` ADD CONSTRAINT `checklist_instancia_etapa_instancia_id_fkey` FOREIGN KEY (`etapa_instancia_id`) REFERENCES `etapa_instancia`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `apontamento` ADD CONSTRAINT `apontamento_os_id_fkey` FOREIGN KEY (`os_id`) REFERENCES `ordens_servico`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `apontamento` ADD CONSTRAINT `apontamento_etapa_instancia_id_fkey` FOREIGN KEY (`etapa_instancia_id`) REFERENCES `etapa_instancia`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `setores_produtivos` ADD CONSTRAINT `setores_produtivos_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workflow_setores` ADD CONSTRAINT `workflow_setores_workflow_id_fkey` FOREIGN KEY (`workflow_id`) REFERENCES `workflows_os`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workflow_setores` ADD CONSTRAINT `workflow_setores_setor_id_fkey` FOREIGN KEY (`setor_id`) REFERENCES `setores_produtivos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workflow_categorias` ADD CONSTRAINT `workflow_categorias_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workflow_categorias` ADD CONSTRAINT `workflow_categorias_workflow_id_fkey` FOREIGN KEY (`workflow_id`) REFERENCES `workflows_os`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workflow_categoria_regras` ADD CONSTRAINT `workflow_categoria_regras_categoria_id_fkey` FOREIGN KEY (`categoria_id`) REFERENCES `workflow_categorias`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workflow_instancia_setor` ADD CONSTRAINT `workflow_instancia_setor_workflow_instancia_id_fkey` FOREIGN KEY (`workflow_instancia_id`) REFERENCES `workflow_instancia`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workflow_instancia_setor` ADD CONSTRAINT `workflow_instancia_setor_setor_id_fkey` FOREIGN KEY (`setor_id`) REFERENCES `setores_produtivos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workflow_instancia_setor` ADD CONSTRAINT `workflow_instancia_setor_item_os_id_fkey` FOREIGN KEY (`item_os_id`) REFERENCES `itens_os`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workflow_instancia_setor` ADD CONSTRAINT `workflow_instancia_setor_operador_id_fkey` FOREIGN KEY (`operador_id`) REFERENCES `usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expedicoes_logistica` ADD CONSTRAINT `expedicoes_logistica_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expedicoes_logistica` ADD CONSTRAINT `expedicoes_logistica_os_id_fkey` FOREIGN KEY (`os_id`) REFERENCES `ordens_servico`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `configuracao_arte_loja` ADD CONSTRAINT `configuracao_arte_loja_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `configuracao_arte_loja` ADD CONSTRAINT `configuracao_arte_loja_servico_arte_id_fkey` FOREIGN KEY (`servico_arte_id`) REFERENCES `servico_manual`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `arte_versoes` ADD CONSTRAINT `arte_versoes_os_id_fkey` FOREIGN KEY (`os_id`) REFERENCES `ordens_servico`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `arte_versoes` ADD CONSTRAINT `arte_versoes_autor_id_fkey` FOREIGN KEY (`autor_id`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `arte_versoes` ADD CONSTRAINT `arte_versoes_aprovado_por_fkey` FOREIGN KEY (`aprovado_por`) REFERENCES `usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `arte_versoes` ADD CONSTRAINT `arte_versoes_liberado_por_fkey` FOREIGN KEY (`liberado_por`) REFERENCES `usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `arte_versoes` ADD CONSTRAINT `arte_versoes_excluido_por_fkey` FOREIGN KEY (`excluido_por`) REFERENCES `usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `arte_arquivos` ADD CONSTRAINT `arte_arquivos_versao_id_fkey` FOREIGN KEY (`versao_id`) REFERENCES `arte_versoes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `arte_comentarios` ADD CONSTRAINT `arte_comentarios_versao_id_fkey` FOREIGN KEY (`versao_id`) REFERENCES `arte_versoes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `arte_comentarios` ADD CONSTRAINT `arte_comentarios_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `arte_links_aprovacao` ADD CONSTRAINT `arte_links_aprovacao_versao_id_fkey` FOREIGN KEY (`versao_id`) REFERENCES `arte_versoes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `arte_mensagens` ADD CONSTRAINT `arte_mensagens_os_id_fkey` FOREIGN KEY (`os_id`) REFERENCES `ordens_servico`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `arte_mensagens` ADD CONSTRAINT `arte_mensagens_versao_id_fkey` FOREIGN KEY (`versao_id`) REFERENCES `arte_versoes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `onboarding_operacional` ADD CONSTRAINT `onboarding_operacional_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `categorias_produto_finito` ADD CONSTRAINT `categorias_produto_finito_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `produtos_finitos` ADD CONSTRAINT `produtos_finitos_loja_id_fkey` FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `produtos_finitos` ADD CONSTRAINT `produtos_finitos_categoria_id_fkey` FOREIGN KEY (`categoria_id`) REFERENCES `categorias_produto_finito`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `galeria_produto_finito` ADD CONSTRAINT `galeria_produto_finito_produto_finito_id_fkey` FOREIGN KEY (`produto_finito_id`) REFERENCES `produtos_finitos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
