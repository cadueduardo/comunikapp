-- Fase 1 / M1.3 — validade estruturada da proposta (DV-07).
-- Aditiva. Mantém `validade_proposta` (texto). Backfill set-based;
-- lotes por `criado_em` só se volume > 500k.

ALTER TABLE `orcamento`
  ADD COLUMN `validade_dias` INTEGER NULL,
  ADD COLUMN `expira_em` DATETIME(3) NULL;

UPDATE `orcamento`
SET `validade_dias` = CAST(
  SUBSTRING_INDEX(TRIM(`validade_proposta`), ' ', 1) AS UNSIGNED
)
WHERE `validade_proposta` IS NOT NULL
  AND LOWER(TRIM(`validade_proposta`)) REGEXP '^[0-9]+[[:space:]]*dias?$'
  AND CAST(SUBSTRING_INDEX(TRIM(`validade_proposta`), ' ', 1) AS UNSIGNED) > 0;

UPDATE `orcamento`
SET `validade_dias` = 30
WHERE `validade_dias` IS NULL
  AND (`excluido_em` IS NULL);

UPDATE `orcamento`
SET `expira_em` = DATE_ADD(`enviado_em`, INTERVAL `validade_dias` DAY)
WHERE `enviado_em` IS NOT NULL
  AND `validade_dias` IS NOT NULL
  AND `expira_em` IS NULL;

CREATE INDEX `orcamento_loja_id_expira_em_idx`
  ON `orcamento`(`loja_id`, `expira_em`);
