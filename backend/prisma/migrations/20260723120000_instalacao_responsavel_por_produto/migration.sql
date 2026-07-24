ALTER TABLE `ProdutoOrcamento`
  ADD COLUMN `instalacao_executor_tipo` VARCHAR(32) NOT NULL DEFAULT 'EQUIPE_INTERNA',
  ADD COLUMN `instalacao_fornecedor_id` VARCHAR(191) NULL,
  ADD COLUMN `instalacao_incluida_cotacao` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `instalacao_distribuicao` VARCHAR(24) NOT NULL DEFAULT 'A_DEFINIR',
  ADD COLUMN `logistica_modo` VARCHAR(32) NOT NULL DEFAULT 'RETIRADA_CLIENTE',
  ADD COLUMN `entrega_produto_modalidade_id` VARCHAR(191) NULL,
  ADD COLUMN `entrega_produto_prazo_dias` INTEGER NULL,
  ADD COLUMN `entrega_produto_valor_cobrado` DECIMAL(12, 2) NULL,
  ADD COLUMN `entrega_produto_custo_estimado` DECIMAL(12, 2) NULL,
  ADD COLUMN `entrega_produto_observacoes` TEXT NULL;

CREATE INDEX `ProdutoOrcamento_instalacao_fornecedor_id_idx`
  ON `ProdutoOrcamento`(`instalacao_fornecedor_id`);

CREATE INDEX `ProdutoOrcamento_entrega_produto_modalidade_id_idx`
  ON `ProdutoOrcamento`(`entrega_produto_modalidade_id`);

ALTER TABLE `ProdutoOrcamento`
  ADD CONSTRAINT `ProdutoOrcamento_instalacao_fornecedor_id_fkey`
  FOREIGN KEY (`instalacao_fornecedor_id`) REFERENCES `fornecedor`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `ProdutoOrcamento`
  ADD CONSTRAINT `ProdutoOrcamento_entrega_produto_modalidade_id_fkey`
  FOREIGN KEY (`entrega_produto_modalidade_id`) REFERENCES `modalidade_entrega`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

UPDATE `ProdutoOrcamento` p
JOIN `orcamento` o ON o.`id` = p.`orcamento_id`
SET
  p.`logistica_modo` = CASE
    WHEN o.`entrega_modalidade_id` IS NOT NULL THEN 'ENTREGA_EMPRESA'
    WHEN p.`instalacao_necessaria` = true THEN 'EQUIPE_INSTALACAO'
    ELSE 'RETIRADA_CLIENTE'
  END,
  p.`entrega_produto_modalidade_id` = o.`entrega_modalidade_id`,
  p.`entrega_produto_prazo_dias` = o.`entrega_prazo_dias`,
  p.`entrega_produto_valor_cobrado` = o.`entrega_valor_cobrado`,
  p.`entrega_produto_custo_estimado` = o.`entrega_custo_estimado`,
  p.`entrega_produto_observacoes` = o.`entrega_observacoes`,
  p.`instalacao_distribuicao` = CASE
    WHEN p.`instalacao_necessaria` = true
      AND p.`instalacao_logradouro` IS NOT NULL
      AND p.`instalacao_cidade` IS NOT NULL
    THEN 'ENDERECO_UNICO'
    ELSE 'A_DEFINIR'
  END;

ALTER TABLE `itens_os_instalacao`
  ADD COLUMN `executor_tipo` VARCHAR(32) NOT NULL DEFAULT 'EQUIPE_INTERNA',
  ADD COLUMN `fornecedor_instalador_id` VARCHAR(191) NULL,
  ADD COLUMN `custo_incluido_cotacao` BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX `itens_os_instalacao_fornecedor_instalador_id_idx`
  ON `itens_os_instalacao`(`fornecedor_instalador_id`);

ALTER TABLE `itens_os_instalacao`
  ADD CONSTRAINT `itens_os_instalacao_fornecedor_instalador_id_fkey`
  FOREIGN KEY (`fornecedor_instalador_id`) REFERENCES `fornecedor`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
