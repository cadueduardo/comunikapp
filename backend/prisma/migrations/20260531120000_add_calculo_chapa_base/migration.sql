ALTER TABLE `insumos`
  ADD COLUMN `formato_material` VARCHAR(32) NULL,
  ADD COLUMN `largura_comercial` DECIMAL(10, 3) NULL,
  ADD COLUMN `altura_comercial` DECIMAL(10, 3) NULL,
  ADD COLUMN `comprimento_comercial` DECIMAL(10, 3) NULL,
  ADD COLUMN `area_comercial` DECIMAL(10, 4) NULL,
  ADD COLUMN `perda_padrao_percent` DECIMAL(5, 2) NULL,
  ADD COLUMN `permite_simulacao_chapa` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `controla_estoque` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `permite_registrar_sobra` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `retalho_min_largura` DECIMAL(10, 3) NULL,
  ADD COLUMN `retalho_min_altura` DECIMAL(10, 3) NULL,
  ADD COLUMN `retalho_min_area` DECIMAL(10, 4) NULL,
  ADD COLUMN `metodo_cobranca_padrao` VARCHAR(32) NULL;

ALTER TABLE `ItemInsumo`
  ADD COLUMN `calculo_chapa` LONGTEXT NULL;
