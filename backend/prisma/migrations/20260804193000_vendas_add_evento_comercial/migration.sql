-- Fase 1 / M1.4 — eventos comerciais em HistoricoOrcamento + loja_id.
-- Aditiva. Não dropa OrcamentoHistorico / OrcamentoLog / aprovacaoOrcamento.
-- Backfill set-based via JOIN; DELETE só de órfãos sem orçamento pai.

-- MySQL 8 em Linux diferencia maiúsculas: a tabela física é `HistoricoOrcamento`.
ALTER TABLE `HistoricoOrcamento`
  ADD COLUMN `loja_id` VARCHAR(191) NULL,
  ADD COLUMN `evento` VARCHAR(191) NULL,
  ADD COLUMN `payload` JSON NULL;

UPDATE `HistoricoOrcamento` h
INNER JOIN `orcamento` o ON o.`id` = h.`orcamento_id`
SET h.`loja_id` = o.`loja_id`
WHERE h.`loja_id` IS NULL;

DELETE FROM `HistoricoOrcamento`
WHERE `loja_id` IS NULL;

ALTER TABLE `HistoricoOrcamento`
  MODIFY COLUMN `loja_id` VARCHAR(191) NOT NULL;

CREATE INDEX `historicoorcamento_loja_id_idx`
  ON `HistoricoOrcamento`(`loja_id`);

CREATE INDEX `historicoorcamento_loja_id_evento_data_idx`
  ON `HistoricoOrcamento`(`loja_id`, `evento`, `data`);

ALTER TABLE `HistoricoOrcamento`
  ADD CONSTRAINT `historicoorcamento_loja_id_fkey`
    FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;
