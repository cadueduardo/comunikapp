-- Fase 1 / M1.1 — eixo comercial canônico (DV-14 opção A).
--
-- Aditiva e posterior a HS-04/HS-05. Não remove `status` nem `status_aprovacao`.
-- Backfill conforme `docs/modulo-vendas/fase-0/04-maquina-de-estados-comercial.md` §7.
-- `EXCLUIDO` não é status comercial: permanece no default `rascunho`.
--
-- Estratégia de volume: UPDATE set-based (MySQL 8). Adequado ao volume atual.
-- Se COUNT(*) > 500k em produção, aplicar em lotes por `criado_em` via script —
-- não editar este arquivo após apply.

ALTER TABLE `orcamento`
  ADD COLUMN `status_comercial` ENUM(
    'rascunho',
    'aguardando_alcada',
    'enviada',
    'em_negociacao',
    'revisao_solicitada',
    'expirada',
    'aceita',
    'pedido_confirmado',
    'perdida',
    'cancelada'
  ) NOT NULL DEFAULT 'rascunho';

UPDATE `orcamento` o
SET `status_comercial` = CASE
  WHEN LOWER(COALESCE(o.`status`, '')) IN ('rascunho', 'pendente') THEN 'rascunho'
  WHEN LOWER(COALESCE(o.`status`, '')) IN ('enviado', 'em_analise') THEN 'enviada'
  WHEN LOWER(COALESCE(o.`status`, '')) = 'negociando' THEN 'em_negociacao'
  WHEN LOWER(COALESCE(o.`status`, '')) = 'aprovado'
    AND EXISTS (
      SELECT 1
      FROM `ordens_servico` os
      WHERE os.`orcamento_id` = o.`id`
    ) THEN 'pedido_confirmado'
  WHEN LOWER(COALESCE(o.`status`, '')) = 'aprovado' THEN 'aceita'
  WHEN LOWER(COALESCE(o.`status`, '')) = 'rejeitado' THEN 'perdida'
  WHEN LOWER(COALESCE(o.`status`, '')) IN ('em_execucao', 'concluido') THEN 'pedido_confirmado'
  WHEN LOWER(COALESCE(o.`status`, '')) = 'cancelado' THEN 'cancelada'
  ELSE 'rascunho'
END
WHERE LOWER(COALESCE(o.`status`, '')) <> 'excluido';

CREATE INDEX `orcamento_loja_id_status_comercial_idx`
  ON `orcamento`(`loja_id`, `status_comercial`);
