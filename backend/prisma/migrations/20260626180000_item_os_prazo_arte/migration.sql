-- Prazo de entrega da arte por item da OS
ALTER TABLE `itens_os`
  ADD COLUMN `data_prazo_arte` DATETIME(3) NULL;
