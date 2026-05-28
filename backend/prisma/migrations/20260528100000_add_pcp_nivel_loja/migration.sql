-- Fase PCP progressivo: nivel de complexidade do PCP por loja.
-- ESSENCIAL: fila simples; ORGANIZADO: etapas padrao; COMPLETO: setores, operadores e apontamentos.

ALTER TABLE `loja`
  ADD COLUMN `pcp_nivel` VARCHAR(24) NULL;
