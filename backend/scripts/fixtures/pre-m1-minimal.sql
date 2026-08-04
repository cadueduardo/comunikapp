-- Fixture mínima pré-M1 para exercitar o SQL das migrations M1.1–M1.4 em MySQL 8.
-- Sem dados de produção. Usado só no CI.

CREATE TABLE IF NOT EXISTS `loja` (
  `id` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `status` VARCHAR(64) NOT NULL DEFAULT 'ATIVA',
  `assinatura_ativa` BOOLEAN NOT NULL DEFAULT false,
  `session_version` INT NOT NULL DEFAULT 0,
  `atualizado_em` DATETIME(3) NOT NULL,
  `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `nome` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `telefone` VARCHAR(191) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Loja_email_key` (`email`),
  UNIQUE KEY `Loja_slug_key` (`slug`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `orcamento` (
  `id` VARCHAR(191) NOT NULL,
  `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `atualizado_em` DATETIME(3) NOT NULL,
  `numero` VARCHAR(191) NOT NULL,
  `nome_servico` VARCHAR(191) NOT NULL,
  `horas_producao` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `custo_material` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `custo_mao_obra` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `custo_indireto` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `custo_total` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `margem_lucro` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `impostos` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `preco_final` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `loja_id` VARCHAR(191) NOT NULL,
  `status` VARCHAR(191) NULL DEFAULT 'rascunho',
  `validade_proposta` VARCHAR(191) NULL DEFAULT '30 dias',
  `versao_atual` INT NOT NULL DEFAULT 1,
  `ativo` BOOLEAN NOT NULL DEFAULT true,
  `data_criacao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `data_atualizacao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `ordem` INT NOT NULL DEFAULT 0,
  `excluido_em` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  INDEX `Orcamento_loja_id_idx` (`loja_id`),
  CONSTRAINT `Orcamento_loja_id_fkey`
    FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ordens_servico` (
  `id` VARCHAR(191) NOT NULL,
  `numero` VARCHAR(191) NOT NULL,
  `loja_id` VARCHAR(191) NOT NULL,
  `cliente_id` VARCHAR(191) NOT NULL DEFAULT 'cli-fixture',
  `orcamento_id` VARCHAR(191) NULL,
  `data_abertura` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `status` VARCHAR(64) NOT NULL DEFAULT 'FILA',
  `nome_servico` VARCHAR(191) NOT NULL DEFAULT 'OS fixture',
  `quantidade` DECIMAL(10,2) NOT NULL DEFAULT 1,
  `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `atualizado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ordens_servico_orcamento_id_key` (`orcamento_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `versaoorcamento` (
  `id` VARCHAR(191) NOT NULL,
  `orcamento_id` VARCHAR(191) NOT NULL,
  `versao` INT NOT NULL,
  `dados_completos` LONGTEXT NOT NULL,
  `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `versaoorcamento_orcamento_id_versao_key` (`orcamento_id`, `versao`),
  CONSTRAINT `versaoorcamento_orcamento_id_fkey`
    FOREIGN KEY (`orcamento_id`) REFERENCES `orcamento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `historicoorcamento` (
  `id` VARCHAR(191) NOT NULL,
  `orcamento_id` VARCHAR(191) NOT NULL,
  `acao` VARCHAR(191) NOT NULL,
  `data` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `historicoorcamento_orcamento_id_idx` (`orcamento_id`),
  CONSTRAINT `historicoorcamento_orcamento_id_fkey`
    FOREIGN KEY (`orcamento_id`) REFERENCES `orcamento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `loja` (`id`,`email`,`status`,`atualizado_em`,`nome`,`slug`,`telefone`)
VALUES ('loja-m1','m1@test.local','ATIVA',NOW(3),'Loja M1','loja-m1','000');

INSERT INTO `orcamento` (
  `id`,`atualizado_em`,`numero`,`nome_servico`,`loja_id`,`status`,`validade_proposta`
) VALUES
  ('orc-rascunho', NOW(3), '1', 'Rascunho', 'loja-m1', 'rascunho', '30 dias'),
  ('orc-enviado', NOW(3), '2', 'Enviado', 'loja-m1', 'enviado', '15 dias'),
  ('orc-aprovado', NOW(3), '3', 'Aprovado', 'loja-m1', 'aprovado', '30 dias');

INSERT INTO `ordens_servico` (`id`,`numero`,`loja_id`,`orcamento_id`)
VALUES ('os-1', 'OS-1', 'loja-m1', 'orc-aprovado');

INSERT INTO `versaoorcamento` (`id`,`orcamento_id`,`versao`,`dados_completos`)
VALUES ('ver-1', 'orc-enviado', 1, '{"atual":{"preco_final":10}}');

INSERT INTO `historicoorcamento` (`id`,`orcamento_id`,`acao`)
VALUES ('hist-1', 'orc-enviado', 'CRIADO');
