ALTER TABLE `produtos_finitos`
    ADD COLUMN `descricao_resumida` VARCHAR(500) NULL AFTER `nome`;

-- Produtos existentes: usar início da descrição detalhada como resumo
UPDATE `produtos_finitos`
SET `descricao_resumida` = LEFT(`descricao`, 500)
WHERE `descricao` IS NOT NULL
  AND TRIM(`descricao`) <> ''
  AND (`descricao_resumida` IS NULL OR TRIM(`descricao_resumida`) = '');
