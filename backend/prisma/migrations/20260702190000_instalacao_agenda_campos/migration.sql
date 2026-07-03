-- Campos de agenda e reagendamento (lotes + ocorrências)
ALTER TABLE `itens_os_instalacao`
  ADD COLUMN `responsavel_local` VARCHAR(120) NULL,
  ADD COLUMN `informar_equipe` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `aguardando_reagendamento` BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE `ocorrencias_instalacao`
  ADD COLUMN `data_retorno_previsao` DATETIME(3) NULL,
  ADD COLUMN `turno_retorno_previsao` ENUM('MANHA', 'TARDE', 'INTEIRO') NULL;
