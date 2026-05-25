ALTER TABLE `itens_os`
  ADD COLUMN `largura` DECIMAL(10, 2) NULL,
  ADD COLUMN `altura` DECIMAL(10, 2) NULL,
  ADD COLUMN `area` DECIMAL(10, 2) NULL,
  ADD COLUMN `perimetro` DECIMAL(10, 2) NULL,
  ADD COLUMN `unidade_medida` VARCHAR(16) NULL,
  ADD COLUMN `unidade_geometria` VARCHAR(4) NULL,
  ADD COLUMN `geometria_origem` VARCHAR(16) NULL,
  ADD COLUMN `arquivo_geometria_url` VARCHAR(512) NULL,
  ADD COLUMN `arquivo_geometria_metadados` LONGTEXT NULL;
