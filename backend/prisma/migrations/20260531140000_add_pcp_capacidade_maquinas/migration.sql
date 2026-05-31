ALTER TABLE `maquina`
  ADD COLUMN `usar_no_pcp` BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN `horas_disponiveis_dia` DECIMAL(5, 2) NULL,
  ADD COLUMN `dias_produtivos` LONGTEXT NULL,
  ADD COLUMN `permite_agendamento_simultaneo` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `tempo_minimo_entre_servicos_min` INT NULL,
  ADD COLUMN `considerar_eficiencia_na_capacidade` BOOLEAN NOT NULL DEFAULT true;
