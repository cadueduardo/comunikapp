-- Baseline retroativo das tabelas operacionais do modulo Arte & Aprovacao.
--
-- Estas tabelas foram criadas originalmente de forma ad-hoc no banco de
-- desenvolvimento. Esta migration permite que o shadow database e novos
-- ambientes reconstruam o mesmo schema a partir do historico versionado.

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
  `loja_id` VARCHAR(191) NOT NULL,
  `deletado` BOOLEAN NOT NULL DEFAULT false,
  `data_exclusao` DATETIME(3) NULL,
  `excluido_por` VARCHAR(191) NULL,
  `liberado_em` DATETIME(3) NULL,
  `liberado_para_pcp` BOOLEAN NOT NULL DEFAULT false,
  `liberado_por` VARCHAR(191) NULL,

  INDEX `arte_versoes_os_id_loja_id_idx`(`os_id`, `loja_id`),
  INDEX `arte_versoes_status_loja_id_idx`(`status`, `loja_id`),
  INDEX `arte_versoes_autor_id_loja_id_idx`(`autor_id`, `loja_id`),
  INDEX `arte_versoes_deletado_loja_id_idx`(`deletado`, `loja_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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

ALTER TABLE `arte_versoes`
  ADD CONSTRAINT `arte_versoes_os_id_fkey`
    FOREIGN KEY (`os_id`) REFERENCES `ordens_servico`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `arte_versoes_autor_id_fkey`
    FOREIGN KEY (`autor_id`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `arte_versoes_aprovado_por_fkey`
    FOREIGN KEY (`aprovado_por`) REFERENCES `usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `arte_versoes_liberado_por_fkey`
    FOREIGN KEY (`liberado_por`) REFERENCES `usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `arte_versoes_excluido_por_fkey`
    FOREIGN KEY (`excluido_por`) REFERENCES `usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `arte_arquivos`
  ADD CONSTRAINT `arte_arquivos_versao_id_fkey`
    FOREIGN KEY (`versao_id`) REFERENCES `arte_versoes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `arte_comentarios`
  ADD CONSTRAINT `arte_comentarios_versao_id_fkey`
    FOREIGN KEY (`versao_id`) REFERENCES `arte_versoes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `arte_comentarios_usuario_id_fkey`
    FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `arte_links_aprovacao`
  ADD CONSTRAINT `arte_links_aprovacao_versao_id_fkey`
    FOREIGN KEY (`versao_id`) REFERENCES `arte_versoes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `arte_mensagens`
  ADD CONSTRAINT `arte_mensagens_os_id_fkey`
    FOREIGN KEY (`os_id`) REFERENCES `ordens_servico`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `arte_mensagens_versao_id_fkey`
    FOREIGN KEY (`versao_id`) REFERENCES `arte_versoes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
