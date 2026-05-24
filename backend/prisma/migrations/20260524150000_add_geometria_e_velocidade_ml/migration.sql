-- Fase 2 Home operacional: geometria avancada em ProdutoOrcamento e
-- campo velocidade_ml_h em maquina (corte linear).
-- Ver docs/fase-0-home-operacional/04-campos-geometria.md

-- AlterTable: novos campos em ProdutoOrcamento
ALTER TABLE `ProdutoOrcamento`
  ADD COLUMN `perimetro_produto` DECIMAL(10, 2) NULL,
  ADD COLUMN `geometria_origem` VARCHAR(16) NULL,
  ADD COLUMN `arquivo_geometria_url` VARCHAR(512) NULL,
  ADD COLUMN `arquivo_geometria_metadados` LONGTEXT NULL;

-- AlterTable: nova velocidade linear em maquina
ALTER TABLE `maquina`
  ADD COLUMN `velocidade_ml_h` DECIMAL(10, 2) NULL;
