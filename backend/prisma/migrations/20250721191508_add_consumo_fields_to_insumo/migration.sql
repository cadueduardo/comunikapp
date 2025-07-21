-- AlterTable
ALTER TABLE `insumos` ADD COLUMN `logica_consumo` ENUM('area', 'perimetro', 'quantidade_fixa', 'custom') NOT NULL DEFAULT 'area',
    ADD COLUMN `parametros_consumo` JSON NULL;
