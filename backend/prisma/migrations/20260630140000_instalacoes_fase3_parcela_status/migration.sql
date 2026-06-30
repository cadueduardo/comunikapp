-- Fase 3: trava de saldo até Relatório Técnico Final (módulo instalações)
-- Amplia VARCHAR do status para AGUARDANDO_RELATORIO_TECNICO

ALTER TABLE `cobranca_parcelas`
  MODIFY COLUMN `status` VARCHAR(32) NOT NULL DEFAULT 'PREVISTO';
