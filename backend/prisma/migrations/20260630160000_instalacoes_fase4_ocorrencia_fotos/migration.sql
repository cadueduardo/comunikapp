-- Fase 4: fotos de evidência em ocorrências de instalação (timeline broker)

ALTER TABLE `ocorrencias_instalacao`
  ADD COLUMN `fotos_evidencia` JSON NULL AFTER `descricao`;
